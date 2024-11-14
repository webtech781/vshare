# VShare - Secure File Sharing System

VShare is a secure file-sharing system built with Node.js, Express, MongoDB, and Redis. It allows users to upload files, optionally protect them with passwords, and generate shareable links. The system also includes an admin panel for monitoring and managing user activities.

## Features

- File upload with optional password protection
- Secure file sharing via generated links
- Admin panel for monitoring user activities
- IP blocking for security
- User IP history tracking
- Responsive design for various devices



## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v14 or later)
- MongoDB
- Redis
- Git (for cloning the repository)

## Setup Documentation

### Windows

1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Install MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community)
3. Install Redis for Windows using [Memurai](https://www.memurai.com/) (a Redis-compatible server for Windows)
4. Clone the repository:
   ```
   git clone https://github.com/webtech781/vshare.git
   cd vshare
   ```
5. Install dependencies:
   ```
   npm install
   ```
6. Create a `.env` file in the root directory and add the following:
   ```
   DATABASE_URL=mongodb://localhost:27017/vshare
   PORT=3002
   REDIS_URL=redis://localhost:6379
   ADMIN_USERNAME=youradminusername
   ADMIN_PASSWORD=youradminpassword
   SESSION_SECRET=your_very_long_and_random_secret_string
   ```
7. Start the Redis server:
   ```
   redis-server
   ```
   run it in new tab
   
8. Start the server:
   ```
   npm run vshare
   ```

### Linux

1. Install Node.js:
   ```
   curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
2. Install MongoDB:
   ```
   sudo apt-get install -y mongodb
   ```
3. Install Redis:
   ```
   sudo apt-get install redis-server
   ```
4. Clone the repository:
   ```
   git clone https://github.com/webtech781/vshare.git
   cd vshare
   ```
5. Install dependencies:
   ```
   npm install
   ```
6. Create a `.env` file in the root directory and add the following:
   ```
   DATABASE_URL=mongodb://localhost:27017/vshare
   PORT=3002
   REDIS_URL=redis://localhost:6379
   ADMIN_USERNAME=youradminusername
   ADMIN_PASSWORD=youradminpassword
   SESSION_SECRET=your_very_long_and_random_secret_string
   ```
7. Start the Redis server:
   ```
   redis-server
   ```
   run it in new tab
   
8. Start the server:
   ```
   npm run vshare
   ```

### macOS

1. Install Node.js using Homebrew:
   ```
   brew install node
   ```
2. Install MongoDB:
   ```
   brew tap mongodb/brew
   brew install mongodb-community
   ```
3. Install Redis:
   ```
   brew install redis
   ```
4. Clone the repository:
   ```
   git clone https://github.com/webtech781/vshare.git
   cd vshare
   ```
5. Install dependencies:
   ```
   npm install
   ```
6. Create a `.env` file in the root directory and add the following:
   ```
   DATABASE_URL=mongodb://localhost:27017/vshare
   PORT=3002
   REDIS_URL=redis://localhost:6379
   ADMIN_USERNAME=youradminusername
   ADMIN_PASSWORD=youradminpassword
   SESSION_SECRET=your_very_long_and_random_secret_string
   ```
7. Start the Redis server:
   ```
   redis-server
   ```
   run it in new tab
   
8. Start the server:
   ```
   npm run vshare
   ```

## Usage

1. Access the file upload page at `http://localhost:3002`
2. Upload a file and optionally set a password
3. Share the generated link with others
4. Access the admin panel at `http://localhost:3002/admin`

## File Structure

```plaintext
vshare/
├── public/                   # Contains static assets like CSS, JS, and images
│   ├── css/                  # CSS files for styling
│   │   ├── styles.css        # Main stylesheet for the application
│   │   ├── error.css        # error stylesheet for the error page
│   │   └── main.css          # Additional styles for admin and other pages
│   ├── js/                   # External JavaScript files (if any)
│   │   └── script.js
├── uploads/                  # Directory for temporary file uploads
├── views/                    # EJS templates for rendering pages
│   ├── admin.ejs             # Admin login page template
│   ├── adminPanel.ejs        # Admin panel template for managing the application
│   ├── index.ejs             # Home page template for file uploads
│   ├── ipHistory.ejs         # Template for displaying IP access history
│   ├── fileDetails.ejs       # Template for individual file details (recently updated)
│   └── error.ejs             # Error page template
├── models/                   # Mongoose schemas for MongoDB collections
│   └── File.js               # Schema for storing file metadata
├── .env                      # Configuration file for environment variables
├── .gitignore                # Specifies untracked files to ignore (e.g., node_modules)
├── package.json              # Defines dependencies, scripts, and project metadata
├── server.js                 # Main server file containing the application logic
├── test-server.js            # Simple test server for development purposes
└── README.md                 # Project documentation (you may include this file)
         
```

## Dependencies
- `express`: Web framework for Node.js.
- `mongoose`: ODM library for MongoDB.
- `multer`: Middleware for handling file uploads.
- `bcrypt`: Password hashing.
- `dotenv`: For loading environment variables.
- `ejs`: Templating engine.
- `helmet`: For securing HTTP headers.
- `express-rate-limit`: To limit repeated requests to public APIs.


## Development

... (existing development instructions)

When developing, make sure to follow these security best practices:
- Regularly update dependencies using `npm audit` and `npm update`.
- Always validate and sanitize user inputs.
- Use HTTPS in production environments.
- Keep the `.env` file secure and never commit it to version control.

## Production Deployment

When deploying to production:

1. Ensure HTTPS is properly configured with valid SSL/TLS certificates.
2. Set the `NODE_ENV` environment variable to 'production'.
3. Use a reverse proxy like Nginx for additional security layers.
4. Regularly update and patch the server and all dependencies.

## Contributing

Contributions to VShare are welcome. Please feel free to submit a Pull Request.

To contribute to this project:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure you update tests as appropriate and adhere to the existing coding style.

## License

This project is licensed under the ISC License.
