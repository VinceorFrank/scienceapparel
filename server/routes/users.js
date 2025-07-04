/**
 * User Routes - Main Router
 * Centralizes all user-related routes using modular structure
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const { 
  getUserDashboard, 
  reorderFromOrder,
  getOrderTracking,
  getOrderHistory,
  getActiveOrders,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getPreferences,
  updatePreferences,
  getActivityLog
} = require('../controllers/userDashboardController');

// Import modular route handlers
const { router: authRoutes, loginHandler } = require('./users/auth');
const adminRoutes = require('./users/admin');
const addressRoutes = require('./users/addresses');

// Mount modular routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/addresses', addressRoutes);

// User Dashboard - Comprehensive user overview
router.get('/dashboard', requireAuth, getUserDashboard);
router.post('/dashboard/reorder', requireAuth, reorderFromOrder);

// Order Management Routes
router.get('/orders/tracking/:orderId', requireAuth, getOrderTracking);
router.get('/orders/history', requireAuth, getOrderHistory);
router.get('/orders/active', requireAuth, getActiveOrders);

// Profile Management Routes
router.put('/profile', requireAuth, updateProfile);
router.put('/password', requireAuth, changePassword);
router.get('/preferences', requireAuth, getPreferences);
router.put('/preferences', requireAuth, updatePreferences);
router.get('/activity', requireAuth, getActivityLog);

// Address Management Routes
router.get('/addresses', requireAuth, getAddresses);
router.post('/addresses', requireAuth, addAddress);
router.put('/addresses/:addressId', requireAuth, updateAddress);
router.delete('/addresses/:addressId', requireAuth, deleteAddress);
router.put('/addresses/:addressId/default', requireAuth, setDefaultAddress);

// Legacy route for backward compatibility (login)
router.post('/login', (req, res) => {
  res.redirect(307, '/api/users/auth/login');
});

// Legacy route redirects for backward compatibility
router.get('/me', (req, res) => {
  res.redirect('/api/users/auth/profile');
});

router.put('/me', (req, res) => {
  res.redirect('/api/users/auth/profile');
});

router.get('/me/addresses', (req, res) => {
  res.redirect('/api/users/addresses');
});

router.post('/me/addresses', (req, res) => {
  res.redirect('/api/users/addresses');
});

// Legacy route for backward compatibility (profile)
router.get('/profile', (req, res) => {
  res.redirect('/api/users/auth/profile');
});

module.exports = router;




