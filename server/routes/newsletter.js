const express = require('express');
const router = express.Router();
const {
  subscribe,
  unsubscribe,
  listSubscribers,
  sendNewsletter
} = require('../controllers/newsletterController');
const { protect, admin } = require('../middlewares/auth');

// Public routes
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

// Admin-only routes
router.use(protect);
router.use(admin);

router.get('/subscribers', listSubscribers);
router.post('/send', sendNewsletter);

module.exports = router;





