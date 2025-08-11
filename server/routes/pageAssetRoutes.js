const express = require('express');
const router  = express.Router();
const {
  getAssetsBySlug,
  upsertAsset,
  deleteAsset
} = require('../controllers/pageAssetController');
const { protect, admin } = require('../middlewares/auth');
const multer  = require('multer');
const path = require('path');

// Multer config: restrict file type and size
const storage = multer.diskStorage({
  destination: 'uploads/images/',
  filename: (req, file, cb) => {
    // Preserve original filename with extension
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

// Public - anyone can read
router.get('/:slug', getAssetsBySlug);

// Admin-only CRUD
router.post('/', protect, admin, upload.single('file'), (err, req, res, next) => {
  // Multer error handler
  if (err) return res.status(400).json({ message: err.message });
  next();
}, upsertAsset);
router.delete('/:pageSlug/:slot', protect, admin, deleteAsset);

module.exports = router; 