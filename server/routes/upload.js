const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { requireAuth } = require('../middlewares/auth');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { logger, businessLogger } = require('../utils/logger');

const router = express.Router();

// Apply CORS to this router
router.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Helper to ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Multer storage with dynamic destination
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Always use absolute path for images
    const uploadPath = path.join(__dirname, '../uploads/images');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// ✅ Only allow image files
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Images only (jpeg, jpg, png)'));
  }
};

const upload = multer({ storage, fileFilter });

// @desc    Upload file
// @route   POST /api/upload
// @access  Private
router.post('/', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    businessLogger('file_upload_started', {
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      mimeType: req.file?.mimetype
    }, req);

    if (!req.file) {
      return sendError(res, 400, 'No file uploaded', null, 'NO_FILE_UPLOADED');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return sendError(res, 400, 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed', null, 'INVALID_FILE_TYPE');
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return sendError(res, 400, 'File too large. Maximum size is 5MB', null, 'FILE_TOO_LARGE');
    }
    
    businessLogger('file_upload_processing', {
      fileName: req.file.originalname,
      fileSize: req.file.size
    }, req);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${timestamp}-${req.file.originalname}`;
    const filePath = path.join(__dirname, '../uploads/images', fileName);

    // Ensure uploads directory exists
    const uploadsDir = path.dirname(filePath);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Move file to uploads directory
    fs.renameSync(req.file.path, filePath);

    const response = {
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileName: fileName,
        originalName: req.file.originalname,
      size: req.file.size,
        mimeType: req.file.mimetype,
        url: `/uploads/images/${fileName}`
      }
    };

    businessLogger('file_upload_completed', {
      fileName: fileName,
      filePath: filePath,
      fileSize: req.file.size
    }, req);

    return sendSuccess(res, 201, 'File uploaded successfully', response.data);
  } catch (err) {
    logger.error('File upload error', {
      error: err.message,
      fileName: req.file?.originalname,
      fileSize: req.file?.size
    });
    next(err);
  }
});

module.exports = router;
