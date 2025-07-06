/**
 * Comprehensive Audit Logging System
 * Provides detailed audit trails for security monitoring and compliance
 */

const ActivityLog = require('../models/ActivityLog');
const { logger } = require('./logger');

// Define audit event types
const AUDIT_EVENTS = {
  // Authentication events
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  ACCOUNT_LOCKED: 'account_locked',
  ACCOUNT_UNLOCKED: 'account_unlocked',
  
  // Authorization events
  PERMISSION_DENIED: 'permission_denied',
  ROLE_CHANGE: 'role_change',
  ACCESS_GRANTED: 'access_granted',
  ACCESS_DENIED: 'access_denied',
  
  // Data access events
  DATA_VIEWED: 'data_viewed',
  DATA_CREATED: 'data_created',
  DATA_UPDATED: 'data_updated',
  DATA_DELETED: 'data_deleted',
  DATA_EXPORTED: 'data_exported',
  DATA_IMPORTED: 'data_imported',
  
  // Security events
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_TOKEN: 'invalid_token',
  EXPIRED_TOKEN: 'expired_token',
  MALICIOUS_INPUT: 'malicious_input',
  SQL_INJECTION_ATTEMPT: 'sql_injection_attempt',
  XSS_ATTEMPT: 'xss_attempt',
  
  // System events
  CONFIGURATION_CHANGE: 'configuration_change',
  BACKUP_CREATED: 'backup_created',
  SYSTEM_RESTART: 'system_restart',
  MAINTENANCE_MODE: 'maintenance_mode',
  
  // Business events
  ORDER_CREATED: 'order_created',
  ORDER_UPDATED: 'order_updated',
  ORDER_CANCELLED: 'order_cancelled',
  PAYMENT_PROCESSED: 'payment_processed',
  REFUND_ISSUED: 'refund_issued',
  CUSTOMER_REGISTERED: 'customer_registered',
  CUSTOMER_UPDATED: 'customer_updated',
  PRODUCT_CREATED: 'product_created',
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_DELETED: 'product_deleted'
};

// Define severity levels
const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Enhanced audit logging function
 * @param {string} event - Event type
 * @param {Object} details - Event details
 * @param {Object} req - Express request object
 * @param {Object} options - Additional options
 */
const auditLog = async (event, details = {}, req = null, options = {}) => {
  const {
    severity = SEVERITY_LEVELS.MEDIUM,
    category = 'general',
    ip = req?.ip,
    userAgent = req?.get('User-Agent'),
    userId = req?.user?._id,
    userEmail = req?.user?.email,
    userRole = req?.user?.role,
    sessionId = req?.session?.id,
    requestId = req?.headers['x-request-id'],
    path = req?.path,
    method = req?.method,
    statusCode = req?.res?.statusCode,
    responseTime = req?.responseTime,
    body = req?.body,
    query = req?.query,
    params = req?.params,
    headers = req?.headers,
    error = null,
    metadata = {}
  } = options;

  try {
    // Create audit log entry
    const auditEntry = {
      event,
      severity,
      category,
      timestamp: new Date(),
      user: userId,
      userEmail,
      userRole,
      sessionId,
      requestId,
      ip,
      userAgent,
      path,
      method,
      statusCode,
      responseTime,
      details: {
        ...details,
        body: sanitizeSensitiveData(body),
        query: sanitizeSensitiveData(query),
        params: sanitizeSensitiveData(params),
        headers: sanitizeSensitiveHeaders(headers),
        error: error ? {
          message: error.message,
          stack: error.stack,
          code: error.code
        } : null,
        metadata
      }
    };

    // Save to database
    await ActivityLog.create(auditEntry);

    // Log to console based on severity
    const logData = {
      event,
      severity,
      userId,
      userEmail,
      userRole,
      ip,
      path,
      method,
      statusCode,
      details: sanitizeSensitiveData(details)
    };

    switch (severity) {
      case SEVERITY_LEVELS.CRITICAL:
        logger.error('CRITICAL AUDIT EVENT', logData);
        break;
      case SEVERITY_LEVELS.HIGH:
        logger.warn('HIGH PRIORITY AUDIT EVENT', logData);
        break;
      case SEVERITY_LEVELS.MEDIUM:
        logger.info('AUDIT EVENT', logData);
        break;
      case SEVERITY_LEVELS.LOW:
        logger.debug('AUDIT EVENT', logData);
        break;
    }

  } catch (error) {
    logger.error('Failed to create audit log', {
      error: error.message,
      event,
      userId,
      ip
    });
  }
};

/**
 * Sanitize sensitive data from logs
 * @param {*} data - Data to sanitize
 * @returns {*} Sanitized data
 */
const sanitizeSensitiveData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session',
    'credit_card',
    'card_number',
    'cvv',
    'ssn',
    'social_security'
  ];

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

/**
 * Sanitize sensitive headers
 * @param {Object} headers - Headers object
 * @returns {Object} Sanitized headers
 */
const sanitizeSensitiveHeaders = (headers) => {
  if (!headers) return headers;

  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token'
  ];

  const sanitized = { ...headers };

  for (const header of sensitiveHeaders) {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  }

  return sanitized;
};

/**
 * Security event logging
 * @param {string} event - Security event type
 * @param {Object} details - Event details
 * @param {Object} req - Express request object
 */
const securityLog = async (event, details = {}, req = null) => {
  await auditLog(event, details, req, {
    severity: SEVERITY_LEVELS.HIGH,
    category: 'security'
  });
};

/**
 * Authentication event logging
 * @param {string} event - Auth event type
 * @param {Object} details - Event details
 * @param {Object} req - Express request object
 */
const authLog = async (event, details = {}, req = null) => {
  await auditLog(event, details, req, {
    severity: SEVERITY_LEVELS.MEDIUM,
    category: 'authentication'
  });
};

/**
 * Data access event logging
 * @param {string} event - Data event type
 * @param {Object} details - Event details
 * @param {Object} req - Express request object
 */
const dataLog = async (event, details = {}, req = null) => {
  await auditLog(event, details, req, {
    severity: SEVERITY_LEVELS.MEDIUM,
    category: 'data_access'
  });
};

/**
 * Business event logging
 * @param {string} event - Business event type
 * @param {Object} details - Event details
 * @param {Object} req - Express request object
 */
const businessLog = async (event, details = {}, req = null) => {
  await auditLog(event, details, req, {
    severity: SEVERITY_LEVELS.LOW,
    category: 'business'
  });
};

/**
 * Critical event logging
 * @param {string} event - Critical event type
 * @param {Object} details - Event details
 * @param {Object} req - Express request object
 */
const criticalLog = async (event, details = {}, req = null) => {
  await auditLog(event, details, req, {
    severity: SEVERITY_LEVELS.CRITICAL,
    category: 'critical'
  });
};

/**
 * Middleware for automatic audit logging
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware
 */
const auditMiddleware = (options = {}) => {
  const {
    logRequests = true,
    logResponses = true,
    logErrors = true,
    sensitivePaths = ['/api/auth', '/api/users/password'],
    excludePaths = ['/api/health', '/api/status']
  } = options;

  return async (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;

    // Log request if enabled
    if (logRequests && !excludePaths.some(path => req.path.includes(path))) {
      await auditLog(AUDIT_EVENTS.DATA_VIEWED, {
        action: 'request_started',
        requestSize: req.headers['content-length'] || 0
      }, req, {
        severity: SEVERITY_LEVELS.LOW,
        category: 'request'
      });
    }

    // Override response.send to capture response data
    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      
      // Log response if enabled
      if (logResponses && !excludePaths.some(path => req.path.includes(path))) {
        auditLog(AUDIT_EVENTS.DATA_VIEWED, {
          action: 'request_completed',
          responseSize: data ? data.length : 0,
          responseTime
        }, req, {
          severity: SEVERITY_LEVELS.LOW,
          category: 'response',
          statusCode: res.statusCode,
          responseTime
        });
      }

      return originalSend.call(this, data);
    };

    // Error handling
    const originalError = next;
    next = function(err) {
      if (err && logErrors) {
        const severity = err.statusCode >= 500 ? SEVERITY_LEVELS.HIGH : SEVERITY_LEVELS.MEDIUM;
        
        auditLog(AUDIT_EVENTS.SUSPICIOUS_ACTIVITY, {
          action: 'error_occurred',
          errorType: err.name,
          errorMessage: err.message
        }, req, {
          severity,
          category: 'error',
          error: err
        });
      }

      return originalError.call(this, err);
    };

    next();
  };
};

/**
 * Get audit logs with filtering
 * @param {Object} filters - Filter options
 * @param {Object} pagination - Pagination options
 * @returns {Object} Filtered audit logs
 */
const getAuditLogs = async (filters = {}, pagination = {}) => {
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
    page = 1,
    limit = 50
  } = filters;

  const query = {};

  if (event) query.event = event;
  if (severity) query.severity = severity;
  if (category) query.category = category;
  if (userId) query.user = userId;
  if (userEmail) query.userEmail = { $regex: userEmail, $options: 'i' };
  if (userRole) query.userRole = userRole;
  if (ip) query.ip = ip;
  if (path) query.path = { $regex: path, $options: 'i' };
  if (method) query.method = method.toUpperCase();

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const logs = await ActivityLog.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await ActivityLog.countDocuments(query);

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

/**
 * Export audit logs
 * @param {Object} filters - Filter options
 * @param {string} format - Export format (json, csv)
 * @returns {string} Exported data
 */
const exportAuditLogs = async (filters = {}, format = 'json') => {
  const { logs } = await getAuditLogs(filters, { page: 1, limit: 10000 });

  if (format === 'csv') {
    const csv = logs.map(log => {
      return [
        log.timestamp,
        log.event,
        log.severity,
        log.category,
        log.userEmail || '',
        log.userRole || '',
        log.ip || '',
        log.path || '',
        log.method || '',
        log.statusCode || '',
        JSON.stringify(log.details)
      ].join(',');
    });

    const headers = [
      'Timestamp',
      'Event',
      'Severity',
      'Category',
      'User Email',
      'User Role',
      'IP Address',
      'Path',
      'Method',
      'Status Code',
      'Details'
    ];

    return [headers.join(','), ...csv].join('\n');
  }

  return JSON.stringify(logs, null, 2);
};

module.exports = {
  AUDIT_EVENTS,
  SEVERITY_LEVELS,
  auditLog,
  securityLog,
  authLog,
  dataLog,
  businessLog,
  criticalLog,
  auditMiddleware,
  getAuditLogs,
  exportAuditLogs,
  sanitizeSensitiveData
}; 