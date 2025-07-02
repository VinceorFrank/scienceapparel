/**
 * User Routes - Main Router
 * Centralizes all user-related routes using modular structure
 */

const express = require('express');
const router = express.Router();

// Import modular route handlers
const { router: authRoutes, loginHandler } = require('./users/auth');
const adminRoutes = require('./users/admin');
const addressRoutes = require('./users/addresses');

// Mount modular routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/addresses', addressRoutes);

// Legacy route for backward compatibility (login)
router.post('/login', loginHandler);

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




