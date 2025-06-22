const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get all activity logs
 * @route   GET /api/activity-logs
 * @access  Private/Admin
 */
const getActivityLogs = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const count = await ActivityLog.countDocuments({});
  const logs = await ActivityLog.find({})
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ logs, page, pages: Math.ceil(count / pageSize) });
});

module.exports = {
  getActivityLogs,
}; 