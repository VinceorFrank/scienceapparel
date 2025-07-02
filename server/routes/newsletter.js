const express = require('express');
const router = express.Router();
const {
  subscribe,
  unsubscribe,
  listSubscribers,
  sendNewsletter,
  cancelScheduledNewsletter,
  getScheduledNewsletters,
  getCampaignHistory,
  getCampaignStats
} = require('../controllers/newsletterController');
const { requireAuth: protect, admin } = require('../middlewares/auth');

// Public routes
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

// Admin routes
router.get('/subscribers', protect, admin, listSubscribers);
router.post('/send', protect, admin, sendNewsletter);
router.get('/scheduled', protect, admin, getScheduledNewsletters);
router.delete('/scheduled/:campaignId', protect, admin, cancelScheduledNewsletter);
router.get('/campaigns', protect, admin, getCampaignHistory);
router.get('/campaigns/stats', protect, admin, getCampaignStats);

module.exports = router;





