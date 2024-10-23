require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require('express-session');
const bodyParser = require('body-parser');
const redis = require('redis');
const mongoose = require("mongoose");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const File = require("./models/File");
const { promisify } = require('util');
const rateLimit = require('express-rate-limit');
const UAParser = require('ua-parser-js');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

const app = express();

// Multer configuration
const upload = multer({ dest: "uploads" });

// Redis client setup
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Connect to Redis
redisClient.connect().then(async () => {
    console.log('Connected to Redis');
    await redisClient.del('accessLogs');
    await redisClient.del('blockedIps');
}).catch((err) => {
    console.error('Failed to connect to Redis:', err);
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
});

// MongoDB connection
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);  // Exit the process if unable to connect to MongoDB
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // set to true if your app is on HTTPS
}));
app.use(express.static('public'));

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

// Constants and helper functions
const MAX_LOGIN_ATTEMPTS = 3;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

function getClientIp(req) {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}

async function isIpBlocked(ip) {
    const blockedUntil = await redisClient.get(`blocked:${ip}`);
    if (blockedUntil && parseInt(blockedUntil) > Date.now()) {
        return { blocked: true, until: parseInt(blockedUntil), type: 'temporary' };
    }
    const isPermanentlyBlocked = await redisClient.sIsMember('blockedIps', ip);
    return { blocked: isPermanentlyBlocked, until: null, type: isPermanentlyBlocked ? 'permanent' : null };
}

async function blockIp(ip) {
    const blockUntil = Date.now() + BLOCK_DURATION;
    await redisClient.set(`blocked:${ip}`, blockUntil.toString());
}

async function recordFailedAttempt(ip) {
    const attempts = await redisClient.incr(`failedAttempts:${ip}`);
    await redisClient.expire(`failedAttempts:${ip}`, 900); // 15 minutes
    return attempts;
}

async function resetLoginAttempts(ip) {
    await redisClient.del(`failedAttempts:${ip}`);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
}

// Middleware to log access and check for blocked IPs
app.use(async (req, res, next) => {
    const ip = getClientIp(req);
    const parser = new UAParser(req.headers['user-agent']);
    const deviceInfo = parser.getResult();
    const deviceName = `${deviceInfo.browser.name || 'Unknown'} on ${deviceInfo.os.name || 'Unknown'}`;
    const timestamp = new Date().toISOString();
    
    try {
        const blockStatus = await isIpBlocked(ip);
        if (blockStatus.blocked) {
            return res.status(403).render('error', { 
                errorMessage: 'Your IP is blocked. Please contact the administrator.' 
            });
        }
        await redisClient.lPush('accessLogs', JSON.stringify({ ip, deviceName, timestamp }));
        await redisClient.lTrim('accessLogs', 0, 999);
    } catch (err) {
        console.error('Error checking IP or logging access:', err);
    }
    next();
});

// Define isAuthenticated middleware
const isAuthenticated = (req, res, next) => {
    console.log('Checking authentication');
    console.log('Session:', req.session);
    if (req.session.isAdmin) {
        console.log('User is authenticated');
        next();
    } else {
        console.log('User is not authenticated');
        res.status(403).json({ error: 'Unauthorized' });
    }
};

// Routes
app.get('/', (req, res) => {
    res.render("index", { fileLink: null });
});

app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileData = {
            path: req.file.path,
            originalName: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype,
        };

        if (req.body.password && req.body.password !== "") {
            fileData.password = await bcrypt.hash(req.body.password, 10);
        }

        const file = await File.create(fileData);
        res.json({ fileLink: `${req.headers.origin}/file/${file.id}` });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'File upload failed', details: err.message });
    }
});

app.route("/file/:id")
    .get((req, res) => {
        res.render("password", { error: false });
    })
    .post(async (req, res, next) => {
        const ip = getClientIp(req);
        try {
            const blockStatus = await isIpBlocked(ip);
            if (blockStatus.blocked) {
                return res.status(403).render('error', { errorMessage: 'Your IP is temporarily blocked. Please try again later.' });
            }

            const file = await File.findById(req.params.id);
            if (!file) {
                return res.status(404).render('error', { errorMessage: 'File not found.' });
            }
            if (file.password) {
                if (!req.body.password || !(await bcrypt.compare(req.body.password, file.password))) {
                    const attempts = await recordFailedAttempt(ip);
                    if (attempts >= 3) {
                        await blockIp(ip);
                        return res.status(403).render('error', { errorMessage: 'Too many failed attempts. Your IP has been blocked for 15 minutes.' });
                    }
                    return res.render("password", { error: true });
                }
            }
            await resetLoginAttempts(ip);
            res.render("fileDetails", {
                fileName: file.originalName,
                fileSize: formatFileSize(file.size),
                fileType: file.type,
                fileId: file.id,
            });
        } catch (err) {
            next(err);
        }
    });

app.get("/download/:id", async (req, res, next) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).render('error', { errorMessage: 'File not found.' });
        }
        file.downloadCount++;
        await file.save();
        res.download(file.path, file.originalName);
    } catch (err) {
        next(err);
    }
});

// Admin routes
app.get('/admin', (req, res) => {
    res.render('admin', { errorMessage: null });
});

// Add this near the top of your file, after other middleware setups
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per window
  message: 'Too many login attempts, please try again later.'
});

// The admin login route should now work correctly
app.post('/admin/login', loginLimiter, [
  body('username').isLength({ min: 1 }).trim().escape(),
  body('password').isLength({ min: 1 }).trim().escape()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  const failedAttempts = await redisClient.get(`failedAttempts:${username}`) || 0;

  if (failedAttempts >= 5) {
    return res.status(403).json({ error: 'Account locked. Try again later.' });
  }

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    await redisClient.del(`failedAttempts:${username}`);
    req.session.isAdmin = true;
    const loginEntry = JSON.stringify({
      timestamp: new Date(),
      ip: getClientIp(req)
    });
    await redisClient.lPush('adminLoginHistory', loginEntry);
    res.json({ success: true });
  } else {
    await redisClient.incr(`failedAttempts:${username}`);
    await redisClient.expire(`failedAttempts:${username}`, 30 * 60); // 30 minutes
    res.json({ success: false, error: 'Invalid credentials' });
  }
});

app.get('/admin/panel', isAuthenticated, (req, res) => {
    console.log('Accessing admin panel');
    console.log('Session:', req.session);
    res.render('adminPanel');
});

app.get('/admin/ip-history', isAuthenticated, async (req, res) => {
    try {
        const allLogs = await redisClient.lRange('accessLogs', 0, -1);
        const ipHistory = allLogs.map(log => JSON.parse(log)).reverse(); // Reverse to show newest first
        res.render('ipHistory', { ipHistory });
    } catch (err) {
        console.error('Error fetching IP history:', err);
        res.status(500).render('error', { errorMessage: 'Failed to fetch IP history' });
    }
});

let cachedLiveIps = [];
let lastUpdateTime = 0;
const CACHE_DURATION = 1000; // 1 second cache

app.get('/admin/live-ips', isAuthenticated, async (req, res) => {
    const now = Date.now();
    if (now - lastUpdateTime > CACHE_DURATION) {
        try {
            const allLogs = await redisClient.lRange('accessLogs', 0, -1);
            cachedLiveIps = [...new Set(allLogs.map(log => JSON.parse(log).ip))];
            lastUpdateTime = now;
        } catch (err) {
            console.error('Error fetching live IPs:', err);
            return res.status(500).json({ error: 'Failed to fetch live IPs' });
        }
    }
    res.json(cachedLiveIps);
});

app.get('/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/admin');
    });
});

const adminLogsLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.headers['cf-connecting-ip'] || req.ip;
    }
});

app.get('/admin/logs', isAuthenticated, adminLogsLimiter, async (req, res) => {
    try {
        const allLogs = await redisClient.lRange('accessLogs', 0, -1);
        const blockedIps = await redisClient.sMembers('blockedIps');
        const adminLoginHistory = await redisClient.lRange('adminLoginHistory', 0, -1);

        const uniqueIps = [...new Set(allLogs.map(log => JSON.parse(log).ip))];
        
        const blockedIpsWithStatus = [];
        const unblockedIps = [];

        for (const ip of uniqueIps) {
            const blockStatus = await isIpBlocked(ip);
            const logEntry = allLogs.find(log => JSON.parse(log).ip === ip);
            const { deviceName } = JSON.parse(logEntry);
            if (blockStatus.blocked) {
                blockedIpsWithStatus.push({ ip, deviceName, until: blockStatus.until, type: blockStatus.type });
            } else {
                unblockedIps.push({ ip, deviceName });
            }
        }

        res.json({
            blockedIps: blockedIpsWithStatus,
            unblockedIps,
            adminLoginHistory: adminLoginHistory.map(JSON.parse).reverse()
        });
    } catch (err) {
        console.error('Error fetching logs:', err);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

app.post('/admin/toggle-block', isAuthenticated, async (req, res) => {
    const { ip, block } = req.body;
    console.log(`Received request to ${block ? 'block' : 'unblock'} IP: ${ip}`);

    try {
        if (block) {
            console.log(`Adding ${ip} to blockedIps set`);
            await redisClient.sAdd('blockedIps', ip);
            await redisClient.del(`blocked:${ip}`);
        } else {
            console.log(`Removing ${ip} from blockedIps set`);
            await redisClient.sRem('blockedIps', ip);
            await redisClient.del(`blocked:${ip}`);
        }
        console.log(`Successfully ${block ? 'blocked' : 'unblocked'} IP: ${ip}`);
        res.json({ success: true });
    } catch (err) {
        console.error('Error toggling IP block status:', err);
        res.status(500).json({ success: false, error: 'Failed to update IP status', details: err.message });
    }
});

app.post('/admin/delete-ip-history', isAuthenticated, async (req, res) => {
    const { ip } = req.body;
    try {
        const allLogs = await redisClient.lRange('accessLogs', 0, -1);
        const updatedLogs = allLogs.filter(log => JSON.parse(log).ip !== ip);
        await redisClient.del('accessLogs');
        for (const log of updatedLogs) {
            await redisClient.rPush('accessLogs', log);
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting IP history:', err);
        res.status(500).json({ error: 'Failed to delete IP history' });
    }
});

app.get('/admin/login-history', isAuthenticated, async (req, res) => {
    try {
        const adminLoginHistory = await redisClient.lRange('adminLoginHistory', 0, -1);
        res.json(adminLoginHistory.map(JSON.parse).reverse());
    } catch (err) {
        console.error('Error fetching admin login history:', err);
        res.status(500).json({ error: 'Failed to fetch admin login history' });
    }
});

// Error handlers
app.use((req, res, next) => {
  res.status(404).render('error', { errorMessage: 'Page not found.' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { errorMessage: 'An unexpected error occurred.' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('SIGINT signal received. Closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    // Close database connections here
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      redisClient.quit(() => {
        console.log('Redis connection closed');
        process.exit(0);
      });
    });
  });
});

// Store the server instance
const server = app.listen(0, () => {
    const port = server.address().port;
    console.log(`Server running on http://localhost:${port}`);
}).on('error', (e) => {
    console.error('An error occurred while starting the server:', e);
    process.exit(1);
});

// Add these middleware configurations before your routes
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
    styleSrc: ["'self'", 'https://cdn.jsdelivr.net'],
    imgSrc: ["'self'", 'data:'],
  },
}));

// HTTPS support in production
if (process.env.NODE_ENV === 'production') {
  const https = require('https');
  const fs = require('fs');
  const privateKey = fs.readFileSync('/path/to/private.key', 'utf8');
  const certificate = fs.readFileSync('/path/to/certificate.crt', 'utf8');
  const credentials = { key: privateKey, cert: certificate };

  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(443, () => {
    console.log('HTTPS Server running on port 443');
  });
}
