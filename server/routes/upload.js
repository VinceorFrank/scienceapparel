const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// 🔧 Configure Multer storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // folder to save files
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // unique filename
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
  res.status(200).json({
    message: 'Image uploaded',
    path: `/uploads/${req.file.filename}`,
  });
});

module.exports = router;
