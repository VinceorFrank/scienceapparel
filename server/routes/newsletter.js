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
const { requireAuth, requireAdmin } = require('../middlewares/auth');

// Public routes
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

// Admin routes
router.get('/subscribers', requireAuth, requireAdmin, listSubscribers);
router.post('/send', requireAuth, requireAdmin, sendNewsletter);
router.get('/scheduled', requireAuth, requireAdmin, getScheduledNewsletters);
router.delete('/scheduled/:campaignId', requireAuth, requireAdmin, cancelScheduledNewsletter);
router.get('/campaigns', requireAuth, requireAdmin, getCampaignHistory);
router.get('/campaigns/stats', requireAuth, requireAdmin, getCampaignStats);

module.exports = router;





