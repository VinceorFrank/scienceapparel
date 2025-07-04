const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  processWebhook,
  getPaymentHistory,
  getPaymentStats,
  processRefund
} = require('../controllers/paymentController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const ActivityLog = require('../models/ActivityLog');

// Apply authentication middleware to all payment routes
router.use(requireAuth);

// Public webhook endpoint (no authentication required)
router.post('/webhook', express.raw({ type: 'application/json' }), processWebhook);

// Create payment intent
router.post('/create-intent', createPaymentIntent);

// Confirm payment
router.post('/confirm', confirmPayment);

// Get payment history for customer
router.get('/history', getPaymentHistory);

// Admin routes (require admin privileges)
router.use(requireAdmin);

// Get payment statistics
router.get('/stats', getPaymentStats);

// Process refund
router.post('/refund', processRefund);

module.exports = router;





