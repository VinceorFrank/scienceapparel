const express = require('express');
const router = express.Router();
const { getActivityLogs } = require('../controllers/activityLogController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

router.route('/').get(requireAuth, requireAdmin, getActivityLogs);

module.exports = router; 