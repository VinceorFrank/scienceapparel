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
const { protect, admin } = require('../middlewares/auth');
const ActivityLog = require('../models/ActivityLog');

// Public webhook endpoint (no authentication required)
router.post('/webhook', express.raw({ type: 'application/json' }), processWebhook);

// Protected routes (require authentication)
router.use(protect);

// Create payment intent
router.post('/create-intent', createPaymentIntent);

// Confirm payment
router.post('/confirm', confirmPayment);

// Get payment history for customer
router.get('/history', getPaymentHistory);

// Admin routes (require admin privileges)
router.use(admin);

// Get payment statistics
router.get('/stats', getPaymentStats);

// Process refund
router.post('/refund', processRefund);

module.exports = router;





