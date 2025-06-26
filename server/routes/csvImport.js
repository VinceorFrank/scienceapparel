const express = require('express');
const router = express.Router();
const {
  importProducts,
  importCategories,
  importUsers,
  getTemplateHeaders,
  validateCSV
} = require('../controllers/csvImportController');
const { protect, admin } = require('../middlewares/auth');

// All routes require admin authentication
router.use(protect);
router.use(admin);

// Import endpoints
router.post('/products', importProducts);
router.post('/categories', importCategories);
router.post('/users', importUsers);

// Template and validation endpoints
router.get('/templates/:dataType', getTemplateHeaders);
router.post('/validate', validateCSV);

module.exports = router; 