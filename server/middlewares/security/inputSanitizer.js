/**
 * Input Sanitization Middleware
 * Comprehensive sanitization for user inputs to prevent XSS and injection attacks
 */

const xss = require('xss');
const DOMPurify = require('isomorphic-dompurify');

/**
 * Sanitize string input
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Basic XSS protection
  sanitized = xss(sanitized, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  });
  
  // Additional HTML sanitization
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  
  return sanitized.trim();
}

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Sanitize request body
 */
function sanitizeBody(req, res, next) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Sanitize query parameters
 */
function sanitizeQuery(req, res, next) {
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
}

/**
 * Sanitize URL parameters
 */
function sanitizeParams(req, res, next) {
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
}

/**
 * Comprehensive sanitization middleware
 */
function sanitizeAll(req, res, next) {
  sanitizeBody(req, res, () => {
    sanitizeQuery(req, res, () => {
      sanitizeParams(req, res, next);
    });
  });
}

/**
 * Sanitize with rate limiting
 */
function sanitizeWithRateLimit(rateLimit = 100) {
  const requestCounts = new Map();
  
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    
    // Clean old entries
    for (const [ip, data] of requestCounts.entries()) {
      if (now - data.timestamp > windowMs) {
        requestCounts.delete(ip);
      }
    }
    
    // Check rate limit
    const clientData = requestCounts.get(clientIP);
    if (clientData && clientData.count >= rateLimit) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        error: 'RATE_LIMIT_EXCEEDED'
      });
    }
    
    // Update count
    if (clientData) {
      clientData.count++;
    } else {
      requestCounts.set(clientIP, { count: 1, timestamp: now });
    }
    
    // Sanitize request
    sanitizeAll(req, res, next);
  };
}

/**
 * Sanitize specific fields
 */
function sanitizeFields(fields) {
  return (req, res, next) => {
    if (req.body) {
      for (const field of fields) {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = sanitizeString(req.body[field]);
        }
      }
    }
    next();
  };
}

/**
 * Sanitize email addresses
 */
function sanitizeEmail(req, res, next) {
  if (req.body && req.body.email) {
    req.body.email = req.body.email.toLowerCase().trim();
  }
  next();
}

/**
 * Sanitize phone numbers
 */
function sanitizePhone(req, res, next) {
  if (req.body && req.body.phone) {
    // Remove all non-digit characters except + and -
    req.body.phone = req.body.phone.replace(/[^\d+\-]/g, '');
  }
  next();
}

module.exports = {
  sanitizeString,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeAll,
  sanitizeWithRateLimit,
  sanitizeFields,
  sanitizeEmail,
  sanitizePhone
}; 