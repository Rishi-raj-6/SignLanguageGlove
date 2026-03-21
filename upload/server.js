'use strict';

const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Allowed MIME types and their corresponding extensions
const ALLOWED_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.ms-powerpoint': '.ppt',
};

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.pptx', '.ppt']);

/**
 * Validate that a file's MIME type and extension are in the allowed list.
 * Both must match to prevent content-type spoofing.
 */
function isAllowedFile(mimetype, originalname) {
  const ext = path.extname(originalname).toLowerCase();
  return (
    Object.prototype.hasOwnProperty.call(ALLOWED_TYPES, mimetype) &&
    ALLOWED_EXTENSIONS.has(ext)
  );
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename(_req, file, cb) {
    // Use a cryptographically secure UUID to guarantee uniqueness across
    // concurrent uploads, then append the sanitised original extension.
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
  fileFilter(_req, file, cb) {
    if (isAllowedFile(file.mimetype, file.originalname)) {
      cb(null, true);
    } else {
      cb(
        Object.assign(new Error('INVALID_FILE_TYPE'), {
          code: 'INVALID_FILE_TYPE',
          supported: Object.keys(ALLOWED_TYPES),
        })
      );
    }
  },
});

const app = express();

// Serve the static upload UI
app.use(express.static(path.join(__dirname, 'public')));

/**
 * POST /upload
 * Accepts a single file in the `file` field.
 * Returns JSON { success, message, filename? }.
 */
app.post('/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(415).json({
          success: false,
          message:
            'Unsupported file type. Please upload a PDF (.pdf), PowerPoint (.pptx), or legacy PowerPoint (.ppt) file.',
          supported: Object.keys(ALLOWED_TYPES),
        });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'File too large. Maximum allowed size is 50 MB.',
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: 'No file was provided.' });
    }

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully.',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  });
});

/**
 * GET /supported-types
 * Returns the list of supported MIME types and extensions.
 */
app.get('/supported-types', (_req, res) => {
  res.json({
    mimeTypes: Object.keys(ALLOWED_TYPES),
    extensions: Array.from(ALLOWED_EXTENSIONS),
  });
});

module.exports = { app, ALLOWED_TYPES, ALLOWED_EXTENSIONS, isAllowedFile };

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Upload server running at http://localhost:${PORT}`);
  });
}
