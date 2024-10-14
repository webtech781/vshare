require("dotenv").config();
const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const express = require("express");
const path = require("path");
const fs = require("fs");
const File = require("./models/File");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files (CSS, JS, images)

// Configure multer for file uploads (destination folder: uploads)
const upload = multer({ dest: "uploads" });

// Connect to MongoDB using environment variable for DATABASE_URL
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

// ---------------------------- IP Blocking Logic ------------------------------
const loginAttempts = {}; // Track attempts per IP
const blockedIps = new Set(); // Set to store blocked IP addresses

// Helper function to get client IP address
function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}

// Middleware to check if IP is blocked
const blockMiddleware = (req, res, next) => {
  const ip = getClientIp(req);

  if (blockedIps.has(ip)) {
    return res.status(403).render('error', {
      errorMessage: 'Your IP is temporarily blocked due to multiple failed login attempts.'
    });
  }

  next();
};

// Function to track failed login attempts
function trackFailedLogin(req) {
  const ip = getClientIp(req);
  if (!loginAttempts[ip]) {
    loginAttempts[ip] = 1;
  } else {
    loginAttempts[ip]++;
  }
}

// Function to check if login attempts exceeded the limit
function hasExceededLoginAttempts(req) {
  const ip = getClientIp(req);
  return loginAttempts[ip] >= 3;
}

// Function to block IP
function blockIp(req) {
  const ip = getClientIp(req);
  blockedIps.add(ip);
}

// ---------------------------- Routes -----------------------------------------

// Apply blockMiddleware globally to all routes where IP blocking is relevant
app.use(blockMiddleware);

// Route to render the homepage
app.get("/", (req, res) => {
  res.render("index", { fileLink: null });
});

// Route to handle file uploads
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const fileData = {
      path: req.file.path,
      originalName: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
    };

    // If password is provided, hash it using bcrypt
    if (req.body.password && req.body.password !== "") {
      fileData.password = await bcrypt.hash(req.body.password, 10);
    }

    // Create the file entry in the database
    const file = await File.create(fileData);

    res.json({ fileLink: `${req.headers.origin}/file/${file.id}` });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: "An error occurred while uploading the file." });
  }
});

// Route to handle password and show file details
app.route("/file/:id")
  .get((req, res) => {
    res.render("password", { error: false });
  })
  .post(async (req, res) => {
    try {
      const file = await File.findById(req.params.id);

      if (!file) {
        return res.status(404).render('error', { errorMessage: 'File not found.' });
      }

      // Check if the file is password-protected
      if (file.password) {
        if (!req.body.password) {
          return res.render("password", { error: true });
        }

        // Compare the entered password with the stored hashed password
        const isPasswordCorrect = await bcrypt.compare(req.body.password, file.password);
        if (!isPasswordCorrect) {
          trackFailedLogin(req);  // Track failed attempts
          
          if (hasExceededLoginAttempts(req)) {
            blockIp(req);  // Temporarily block IP if login attempts are exceeded
            return res.status(403).render('error', {
              errorMessage: 'Your IP is temporarily blocked due to multiple failed login attempts.'
            });
          }

          return res.render("password", { error: true });
        }
      }

      // Show file details and download button
      res.render("fileDetails", {
        fileName: file.originalName,
        fileSize: (file.size / (1024 * 1024)).toFixed(2), // Convert to MB for display
        fileType: file.type,
        fileId: file.id,
      });
    } catch (err) {
      console.error('Error retrieving file details:', err);
      res.status(500).render('error', { errorMessage: 'An internal error occurred.' });
    }
  });

// Route to handle actual file download
app.get("/download/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).render('error', { errorMessage: 'File not found.' });
    }

    file.downloadCount++;
    await file.save();

    res.download(file.path, file.originalName);
  } catch (err) {
    console.error('File download error:', err);
    res.status(500).render('error', { errorMessage: 'An error occurred while downloading the file.' });
  }
});

// Global error handler for 404
app.use((req, res, next) => {
  res.status(404).render('error', { errorMessage: 'Page not found.' });
});

// Global error handler for 500 (internal server errors)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { errorMessage: 'An internal server error occurred.' });
});

// Listen on the specified port from the environment variable or default to 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
