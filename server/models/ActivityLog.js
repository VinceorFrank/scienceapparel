const mongoose = require('mongoose');

// Enhanced ActivityLog model: stores comprehensive audit trails for security monitoring and compliance
const activityLogSchema = new mongoose.Schema({
  // Event information
  event: { 
    type: String, 
    required: true,
    index: true
  },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  category: { 
    type: String, 
    default: 'general',
    index: true
  },
  
  // User information
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  },
  userEmail: { 
    type: String,
    index: true
  },
  userRole: { 
    type: String,
    index: true
  },
  
  // Session and request information
  sessionId: { 
    type: String 
  },
  requestId: { 
    type: String 
  },
  
  // Network information
  ip: { 
    type: String,
    index: true
  },
  userAgent: { 
    type: String 
  },
  
  // Request details
  path: { 
    type: String,
    index: true
  },
  method: { 
    type: String,
    index: true
  },
  statusCode: { 
    type: Number 
  },
  responseTime: { 
    type: Number 
  },
  
  // Legacy fields for backward compatibility
  action: { 
    type: String,
    index: true
  },
  description: { 
    type: String 
  },
  
  // Detailed event information
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Metadata for additional context
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  // Add indexes for better query performance
  indexes: [
    { timestamp: -1 },
    { event: 1, timestamp: -1 },
    { severity: 1, timestamp: -1 },
    { user: 1, timestamp: -1 },
    { ip: 1, timestamp: -1 },
    { path: 1, timestamp: -1 },
    { category: 1, timestamp: -1 }
  ]
});

// Add text search index for full-text search
activityLogSchema.index({
  event: 'text',
  description: 'text',
  userEmail: 'text',
  path: 'text'
});

// Pre-save middleware to ensure backward compatibility
activityLogSchema.pre('save', function(next) {
  // If action is provided but event is not, use action as event
  if (this.action && !this.event) {
    this.event = this.action;
  }
  
  // If description is provided but not in details, add it
  if (this.description && !this.details.description) {
    this.details.description = this.description;
  }
  
  next();
});

// Static method to get logs with filtering
activityLogSchema.statics.getFilteredLogs = async function(filters = {}, pagination = {}) {
  const {
    event,
    severity,
    category,
    userId,
    userEmail,
    userRole,
    ip,
    path,
    method,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 50
  } = filters;

  const query = {};

  // Basic filters
  if (event) query.event = event;
  if (severity) query.severity = severity;
  if (category) query.category = category;
  if (userId) query.user = userId;
  if (userEmail) query.userEmail = { $regex: userEmail, $options: 'i' };
  if (userRole) query.userRole = userRole;
  if (ip) query.ip = ip;
  if (path) query.path = { $regex: path, $options: 'i' };
  if (method) query.method = method.toUpperCase();

  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  const logs = await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await this.countDocuments(query);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get security events
activityLogSchema.statics.getSecurityEvents = async function(filters = {}) {
  const securityCategories = ['security', 'authentication', 'authorization'];
  const securitySeverities = ['high', 'critical'];
  
  const query = {
    $or: [
      { category: { $in: securityCategories } },
      { severity: { $in: securitySeverities } }
    ]
  };

  if (filters.startDate) {
    query.createdAt = { $gte: new Date(filters.startDate) };
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit || 100)
    .lean();
};

// Static method to get user activity
activityLogSchema.statics.getUserActivity = async function(userId, filters = {}) {
  const query = { user: userId };

  if (filters.startDate) {
    query.createdAt = { $gte: new Date(filters.startDate) };
  }

  if (filters.event) {
    query.event = filters.event;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit || 50)
    .lean();
};

// Static method to get suspicious activity
activityLogSchema.statics.getSuspiciousActivity = async function(filters = {}) {
  const query = {
    $or: [
      { severity: 'critical' },
      { event: { $in: ['login_failed', 'permission_denied', 'malicious_input', 'rate_limit_exceeded'] } },
      { 'details.errorType': { $exists: true } }
    ]
  };

  if (filters.startDate) {
    query.createdAt = { $gte: new Date(filters.startDate) };
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit || 100)
    .lean();
};

// Static method to clean old logs
activityLogSchema.statics.cleanOldLogs = async function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate }
  });

  return result.deletedCount;
};

// Instance method to get formatted log entry
activityLogSchema.methods.getFormattedEntry = function() {
  return {
    id: this._id,
    event: this.event,
    severity: this.severity,
    category: this.category,
    timestamp: this.createdAt,
    user: {
      id: this.user,
      email: this.userEmail,
      role: this.userRole
    },
    request: {
      ip: this.ip,
      path: this.path,
      method: this.method,
      statusCode: this.statusCode,
      responseTime: this.responseTime
    },
    details: this.details,
    metadata: this.metadata
  };
};

module.exports = mongoose.model('ActivityLog', activityLogSchema); 