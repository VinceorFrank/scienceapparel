const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Helper to ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Multer storage with dynamic destination
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Use ?type=review or ?type=image (default to image)
    const type = req.query.type === 'review' ? 'reviews' : 'images';
    const uploadPath = path.join('uploads', type);
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

// 📤 POST /api/upload
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  // Return a web-friendly, absolute path
  const filePath = `/${req.file.path.replace(/\\/g, '/')}`; // Normalize for web and ensure leading slash
  res.json({ success: true, filePath: filePath });
});

module.exports = router;
