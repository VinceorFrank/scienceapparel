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
router.post('/', (req, res) => {
  upload.single('image')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    } else if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or invalid file type.' });
    }
    // Always return the path as 'images/filename.jpg' for DB storage
    res.status(200).json({
      message: 'Image uploaded',
      path: `images/${req.file.filename}`,
    });
  });
});

module.exports = router;
