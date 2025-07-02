const express = require('express');
const router = express.Router();
const { getActivityLogs } = require('../controllers/activityLogController');
const { requireAuth: protect, admin } = require('../middlewares/auth');

router.route('/').get(protect, admin, getActivityLogs);

module.exports = router; 