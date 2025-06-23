const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

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

// 📤 POST /api/upload
router.post('/', (req, res, next) => {
  console.log('[upload] POST /api/upload called');
  console.log('[upload] Request headers:', req.headers);
  console.log('[upload] Request body:', req.body);
  
  upload.single('image')(req, res, function (err) {
    if (err) {
      console.error('[upload] Multer error:', err);
      return res.status(500).json({ success: false, message: 'Multer error', error: err.message });
    }
    
    console.log('[upload] Multer processing completed');
    console.log('[upload] req.file:', req.file);
    console.log('[upload] req.body:', req.body);
    
    if (!req.file) {
      console.error('[upload] No file uploaded');
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    console.log('[upload] File uploaded successfully:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
    // Return a web-friendly, relative path (not absolute)
    const filePath = `/uploads/images/${req.file.filename}`;
    console.log('[upload] Generated filePath:', filePath);
    
    const response = { success: true, filePath: filePath };
    console.log('[upload] Sending response:', response);
    
    res.json(response);
  });
});

module.exports = router;
