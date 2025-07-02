/**
 * Enhanced Rate Limiting System
 * Provides sophisticated rate limiting with different strategies per endpoint
 */

const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  // General API limits
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Authentication endpoints (more strict)
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Admin endpoints (very strict)
  ADMIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: 'Too many admin requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // File upload endpoints
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 uploads per hour
    message: 'Too many file uploads, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Payment endpoints (very strict)
  PAYMENT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 payment attempts per windowMs
    message: 'Too many payment attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Newsletter endpoints
  NEWSLETTER: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 newsletter operations per hour
    message: 'Too many newsletter operations, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }
};

// Custom key generator that includes user ID if authenticated
const generateKey = (req) => {
  const userKey = req.user ? `:user:${req.user._id}` : ':anonymous';
  const roleKey = req.user ? `:role:${req.user.role}` : ':role:anonymous';
  return `${req.ip}${userKey}${roleKey}`;
};

// Custom skip function for certain endpoints
const shouldSkipRateLimit = (req) => {
  // Skip rate limiting for health checks
  if (req.path === '/api/health') {
    return true;
  }

  // Skip rate limiting for static files
  if (req.path.startsWith('/uploads/')) {
    return true;
  }

  // Skip rate limiting for admin users on certain endpoints
  if (req.user && req.user.isAdmin && req.path.startsWith('/api/admin/')) {
    return true;
  }

  return false;
};

// Enhanced handler for rate limit exceeded
const handleRateLimitExceeded = (req, res) => {
  const retryAfter = Math.ceil(RATE_LIMIT_CONFIG.GENERAL.windowMs / 1000);
  
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    path: req.path,
    method: req.method,
    user: req.user ? req.user._id : 'anonymous',
    userRole: req.user ? req.user.role : 'anonymous',
    retryAfter
  });

  res.setHeader('Retry-After', retryAfter);
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter,
    timestamp: new Date().toISOString()
  });
};

// Create rate limiters
const generalLimiter = rateLimit({
  ...RATE_LIMIT_CONFIG.GENERAL,
  keyGenerator: generateKey,
  skip: shouldSkipRateLimit,
  handler: handleRateLimitExceeded
});

const authLimiter = rateLimit({
  ...RATE_LIMIT_CONFIG.AUTH,
  keyGenerator: generateKey,
  skip: shouldSkipRateLimit,
  handler: handleRateLimitExceeded
});

const adminLimiter = rateLimit({
  ...RATE_LIMIT_CONFIG.ADMIN,
  keyGenerator: generateKey,
  skip: shouldSkipRateLimit,
  handler: handleRateLimitExceeded
});

const uploadLimiter = rateLimit({
  ...RATE_LIMIT_CONFIG.UPLOAD,
  keyGenerator: generateKey,
  skip: shouldSkipRateLimit,
  handler: handleRateLimitExceeded
});

const paymentLimiter = rateLimit({
  ...RATE_LIMIT_CONFIG.PAYMENT,
  keyGenerator: generateKey,
  skip: shouldSkipRateLimit,
  handler: handleRateLimitExceeded
});

const newsletterLimiter = rateLimit({
  ...RATE_LIMIT_CONFIG.NEWSLETTER,
  keyGenerator: generateKey,
  skip: shouldSkipRateLimit,
  handler: handleRateLimitExceeded
});

// Dynamic rate limiter based on endpoint
const dynamicRateLimiter = (req, res, next) => {
  const path = req.path;

  // Authentication endpoints
  if (path.includes('/login') || path.includes('/signup') || path.includes('/password')) {
    return authLimiter(req, res, next);
  }

  // Admin endpoints
  if (path.startsWith('/api/admin/')) {
    return adminLimiter(req, res, next);
  }

  // Upload endpoints
  if (path.startsWith('/api/upload')) {
    return uploadLimiter(req, res, next);
  }

  // Payment endpoints
  if (path.startsWith('/api/payment')) {
    return paymentLimiter(req, res, next);
  }

  // Newsletter endpoints
  if (path.startsWith('/api/newsletter')) {
    return newsletterLimiter(req, res, next);
  }

  // Default to general limiter
  return generalLimiter(req, res, next);
};

// Rate limit monitoring
const rateLimitStats = {
  totalRequests: 0,
  blockedRequests: 0,
  byEndpoint: {},
  byUser: {}
};

// Middleware to track rate limit statistics
const trackRateLimitStats = (req, res, next) => {
  rateLimitStats.totalRequests++;
  
  const endpoint = req.path;
  const userId = req.user ? req.user._id : 'anonymous';
  
  // Track by endpoint
  if (!rateLimitStats.byEndpoint[endpoint]) {
    rateLimitStats.byEndpoint[endpoint] = { requests: 0, blocked: 0 };
  }
  rateLimitStats.byEndpoint[endpoint].requests++;
  
  // Track by user
  if (!rateLimitStats.byUser[userId]) {
    rateLimitStats.byUser[userId] = { requests: 0, blocked: 0 };
  }
  rateLimitStats.byUser[userId].requests++;
  
  // Track blocked requests
  res.on('finish', () => {
    if (res.statusCode === 429) {
      rateLimitStats.blockedRequests++;
      rateLimitStats.byEndpoint[endpoint].blocked++;
      rateLimitStats.byUser[userId].blocked++;
    }
  });
  
  next();
};

// Get rate limit statistics
const getRateLimitStats = () => {
  const totalBlockedRate = rateLimitStats.totalRequests > 0 
    ? (rateLimitStats.blockedRequests / rateLimitStats.totalRequests * 100).toFixed(2)
    : 0;

  return {
    ...rateLimitStats,
    blockedRate: `${totalBlockedRate}%`,
    timestamp: new Date().toISOString()
  };
};

// Reset rate limit statistics
const resetRateLimitStats = () => {
  Object.assign(rateLimitStats, {
    totalRequests: 0,
    blockedRequests: 0,
    byEndpoint: {},
    byUser: {}
  });
};

module.exports = {
  dynamicRateLimiter,
  generalLimiter,
  authLimiter,
  adminLimiter,
  uploadLimiter,
  paymentLimiter,
  newsletterLimiter,
  trackRateLimitStats,
  getRateLimitStats,
  resetRateLimitStats,
  RATE_LIMIT_CONFIG
}; 