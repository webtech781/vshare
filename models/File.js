const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  password: String,
  downloadCount: {
    type: Number,
    required: true,
    default: 0,
  },
  size: {
    type: Number,  // Store size in bytes
    required: true,
  },
  type: {
    type: String,  // Store MIME type
    required: true,
  }
});

module.exports = mongoose.model("File", fileSchema);
