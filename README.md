
# mr.share

A secure file sharing system built with Node.js, Express, MongoDB, Multer for file uploads, and bcrypt for password hashing. This system allows users to securely upload files, share them using a link, and optionally set a password for additional security.

## Features
- **File Upload**: Upload files securely using the drag-and-drop interface or file selector.
- **Password Protection**: Option to add a password to protect the file.
- **Download Tracking**: Track how many times a file has been downloaded.
- **File Sharing**: Generate shareable links for downloading files.

## Tech Stack
- Node.js
- Express.js
- MongoDB
- Multer (for file handling)
- bcrypt (for password hashing)
- EJS (for templating)

## Setup Instructions

### Prerequisites
Ensure that you have the following installed on your system:
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/) (Ensure MongoDB is running locally or use a cloud MongoDB service like MongoDB Atlas)
- [npm](https://www.npmjs.com/) (Comes with Node.js)

### Step 1: Clone the Repository
```bash
git clone https://github.com/WebTech012345/mr.share.git
cd mr.share-main
```

### Step 2: Install Dependencies
Once inside the project directory, install the required dependencies by running:
```bash
npm install
```

### Step 3: Setup Environment Variables
Create a `.env` file in the root of your project and add the following variables:
```bash
DATABASE_URL=mongodb://localhost:27017/your-database-name
PORT=3000
```
Replace `your-database-name` with your MongoDB database name. Ensure MongoDB is running locally or connect to a remote MongoDB instance.

### Step 4: Run the Application
To start the application, run:
```bash
npm run myserver
```
This will run the server on the port specified in the `.env` file (default is 3000).

### Step 5: Access the Application
Open your web browser and navigate to:
```
http://localhost:3000
```

You should now see the file-sharing system interface.

### Step 6: Upload and Share Files
1. Drag and drop a file into the upload area or select a file from your system.
2. Optionally, add a password to secure the file.
3. Once uploaded, you'll be given a shareable link that you can send to others.

### Step 7: Download Files
- Click the shared link or go to `http://localhost:3000/file/:id`.
- If the file is password protected, enter the password to download the file.

## File Structure

```plaintext
project-root/
├── public/                   # Contains static assets like CSS, JS, images
│   ├── css/
│   │   ├── styles.css         # External CSS styles
│   │   ├── main.css         # External CSS styles
│   │   ├── error.css         # External CSS styles
│   │   └── password.css         # External CSS styles
│   ├── js/
│   │   └── script.js          # External JavaScript (if any)
├── uploads/                  # Temporary file uploads
├── views/                    # EJS templates
│   ├── index.ejs             # Main upload page
│   ├── password.ejs          # Password entry page for downloads
│   ├── FileDetails.js        # File details page
│   └── error.ejs             # Error page
├── models/
│   └── File.js               # Mongoose schema for file metadata
├── .env                      # Environment variables (create this manually)
├── .gitignore                # Ignore uploads and other unnecessary files
├── server.js                 # Main server file (Node.js backend)
└── package.json              # Node.js dependencies and scripts
```

## Dependencies
- `express`: Web framework for Node.js.
- `mongoose`: ODM library for MongoDB.
- `multer`: Middleware for handling file uploads.
- `bcrypt`: Password hashing.
- `dotenv`: For loading environment variables.
- `ejs`: Templating engine.

## Future Improvements
- Add email notifications for file sharing.
- Implement file expiry feature.
- Enhance the UI with more interactive elements.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
