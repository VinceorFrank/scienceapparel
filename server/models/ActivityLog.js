const mongoose = require('mongoose');

// ActivityLog model: stores admin/user actions for auditing and tracking
const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  description: { type: String, required: true },
}, {
  timestamps: true
});

module.exports = mongoose.model('ActivityLog', activityLogSchema); 