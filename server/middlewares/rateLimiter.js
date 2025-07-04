/**
 * Enhanced Rate Limiting System with Granular Controls
 * Provides sophisticated rate limiting with different strategies per endpoint and user type
 */

const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');
const { sendError } = require('../utils/responseHandler');
const config = require('../config/env');

// Enhanced rate limit configuration with environment-specific settings
const RATE_LIMIT_CONFIG = {
  // General API limits
  GENERAL: {
    windowMs: config.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
    max: config.RATE_LIMIT_MAX_REQUESTS || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Authentication endpoints (more strict)
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
    skipFailedRequests: false
  },

  // Admin endpoints (very strict)
  ADMIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: 'Too many admin requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // File upload endpoints
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 uploads per hour
    message: 'Too many file uploads, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Payment endpoints (very strict)
  PAYMENT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 payment attempts per windowMs
    message: 'Too many payment attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Newsletter endpoints
  NEWSLETTER: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 newsletter operations per hour
    message: 'Too many newsletter operations, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // User registration (very strict)
  REGISTRATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 registrations per hour
    message: 'Too many registration attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  },

  // Password reset (very strict)
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset attempts per hour
    message: 'Too many password reset attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  },

  // Search endpoints (moderate)
  SEARCH: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 30, // limit each IP to 30 searches per 5 minutes
    message: 'Too many search requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Product browsing (generous)
  BROWSE: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 200, // limit each IP to 200 browse requests per 5 minutes
    message: 'Too many browse requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  }
};

// Enhanced key generator that includes user ID, role, and request type
const generateKey = (req) => {
  const userKey = req.user ? `:user:${req.user._id}` : ':anonymous';
  const roleKey = req.user ? `:role:${req.user.role}` : ':role:anonymous';
  const methodKey = `:method:${req.method}`;
  const pathKey = `:path:${req.path.split('/')[1] || 'root'}`; // First path segment
  
  return `${req.ip}${userKey}${roleKey}${methodKey}${pathKey}`;
};

// Enhanced skip function for certain endpoints and conditions
const shouldSkipRateLimit = (req) => {
  // Skip rate limiting for health checks
  if (req.path === '/api/health' || req.path === '/health') {
    return true;
  }

  // Skip rate limiting for static files
  if (req.path.startsWith('/uploads/') || req.path.startsWith('/static/')) {
    return true;
  }

  // Skip rate limiting for admin users on certain endpoints (configurable)
  if (req.user && req.user.isAdmin && req.path.startsWith('/api/admin/')) {
    // Only skip for read operations
    if (['GET', 'HEAD'].includes(req.method)) {
      return true;
    }
  }

  // Skip rate limiting for development environment
  if (config.NODE_ENV === 'development' && req.headers['x-development-bypass']) {
    return true;
  }

  // Skip rate limiting for trusted IPs (if configured)
  const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
  if (trustedIPs.includes(req.ip)) {
    return true;
  }

  return false;
};

// Enhanced handler for rate limit exceeded with better logging and response
const handleRateLimitExceeded = (req, res, options) => {
  const retryAfter = Math.ceil(options.windowMs / 1000);
  const limitType = options.limitType || 'general';
  
  // Enhanced logging with more context
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    path: req.path,
    method: req.method,
    user: req.user ? req.user._id : 'anonymous',
    userRole: req.user ? req.user.role : 'anonymous',
    userAgent: req.get('User-Agent'),
    retryAfter,
    limitType,
    limit: options.max,
    windowMs: options.windowMs,
    current: options.current,
    remaining: options.remaining
  });

  // Set appropriate headers
  res.setHeader('Retry-After', retryAfter);
  res.setHeader('X-RateLimit-Limit', options.max);
  res.setHeader('X-RateLimit-Remaining', options.remaining);
  res.setHeader('X-RateLimit-Reset', new Date(Date.now() + options.windowMs).toISOString());

  // Use standardized error response
  return sendError(res, 429, 'Too many requests. Please try again later.', {
    retryAfter,
    limitType,
    limit: options.max,
    remaining: options.remaining,
    resetTime: new Date(Date.now() + options.windowMs).toISOString()
  }, 'RATE_LIMIT_EXCEEDED');
};

// Create enhanced rate limiters with better configuration
const createRateLimiter = (config, limitType) => {
  return rateLimit({
    ...config,
    keyGenerator: generateKey,
    skip: shouldSkipRateLimit,
    handler: (req, res) => handleRateLimitExceeded(req, res, { ...config, limitType })
  });
};

// Create all rate limiters
const generalLimiter = createRateLimiter(RATE_LIMIT_CONFIG.GENERAL, 'general');
const authLimiter = createRateLimiter(RATE_LIMIT_CONFIG.AUTH, 'auth');
const adminLimiter = createRateLimiter(RATE_LIMIT_CONFIG.ADMIN, 'admin');
const uploadLimiter = createRateLimiter(RATE_LIMIT_CONFIG.UPLOAD, 'upload');
const paymentLimiter = createRateLimiter(RATE_LIMIT_CONFIG.PAYMENT, 'payment');
const newsletterLimiter = createRateLimiter(RATE_LIMIT_CONFIG.NEWSLETTER, 'newsletter');
const registrationLimiter = createRateLimiter(RATE_LIMIT_CONFIG.REGISTRATION, 'registration');
const passwordResetLimiter = createRateLimiter(RATE_LIMIT_CONFIG.PASSWORD_RESET, 'password_reset');
const searchLimiter = createRateLimiter(RATE_LIMIT_CONFIG.SEARCH, 'search');
const browseLimiter = createRateLimiter(RATE_LIMIT_CONFIG.BROWSE, 'browse');

// Enhanced dynamic rate limiter with more granular endpoint detection
const dynamicRateLimiter = (req, res, next) => {
  const path = req.path.toLowerCase();
  const method = req.method.toUpperCase();

  // Authentication endpoints
  if (path.includes('/login') || path.includes('/signup') || path.includes('/auth')) {
    return authLimiter(req, res, next);
  }

  // Registration endpoints
  if (path.includes('/register') || path.includes('/signup')) {
    return registrationLimiter(req, res, next);
  }

  // Password reset endpoints
  if (path.includes('/password') || path.includes('/reset')) {
    return passwordResetLimiter(req, res, next);
  }

  // Admin endpoints
  if (path.startsWith('/api/admin/') || path.startsWith('/admin/')) {
    return adminLimiter(req, res, next);
  }

  // Upload endpoints
  if (path.startsWith('/api/upload') || path.startsWith('/upload')) {
    return uploadLimiter(req, res, next);
  }

  // Payment endpoints
  if (path.startsWith('/api/payment') || path.startsWith('/payment') || path.includes('/checkout')) {
    return paymentLimiter(req, res, next);
  }

  // Newsletter endpoints
  if (path.startsWith('/api/newsletter') || path.startsWith('/newsletter')) {
    return newsletterLimiter(req, res, next);
  }

  // Search endpoints
  if (path.includes('/search') || path.includes('/filter') || path.includes('/query')) {
    return searchLimiter(req, res, next);
  }

  // Browse/product listing endpoints
  if (path.includes('/products') || path.includes('/categories') || path.includes('/browse')) {
    return browseLimiter(req, res, next);
  }

  // Default to general limiter
  return generalLimiter(req, res, next);
};

// Enhanced rate limit monitoring with more detailed statistics
const rateLimitStats = {
  totalRequests: 0,
  blockedRequests: 0,
  byEndpoint: {},
  byUser: {},
  byLimitType: {},
  byIP: {},
  hourlyStats: {},
  dailyStats: {}
};

// Enhanced middleware to track rate limit statistics
const trackRateLimitStats = (req, res, next) => {
  const startTime = Date.now();
  rateLimitStats.totalRequests++;
  
  const endpoint = req.path;
  const userId = req.user ? req.user._id : 'anonymous';
  const userRole = req.user ? req.user.role : 'anonymous';
  const ip = req.ip;
  const method = req.method;
  const hour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  
  // Track by endpoint
  if (!rateLimitStats.byEndpoint[endpoint]) {
    rateLimitStats.byEndpoint[endpoint] = { 
      requests: 0, 
      blocked: 0, 
      methods: {},
      avgResponseTime: 0
    };
  }
  rateLimitStats.byEndpoint[endpoint].requests++;
  
  // Track by method for endpoint
  if (!rateLimitStats.byEndpoint[endpoint].methods[method]) {
    rateLimitStats.byEndpoint[endpoint].methods[method] = 0;
  }
  rateLimitStats.byEndpoint[endpoint].methods[method]++;
  
  // Track by user
  if (!rateLimitStats.byUser[userId]) {
    rateLimitStats.byUser[userId] = { 
      requests: 0, 
      blocked: 0, 
      role: userRole,
      lastRequest: null
    };
  }
  rateLimitStats.byUser[userId].requests++;
  rateLimitStats.byUser[userId].lastRequest = new Date();
  
  // Track by IP
  if (!rateLimitStats.byIP[ip]) {
    rateLimitStats.byIP[ip] = { requests: 0, blocked: 0 };
  }
  rateLimitStats.byIP[ip].requests++;
  
  // Track hourly stats
  if (!rateLimitStats.hourlyStats[hour]) {
    rateLimitStats.hourlyStats[hour] = { requests: 0, blocked: 0 };
  }
  rateLimitStats.hourlyStats[hour].requests++;
  
  // Track daily stats
  if (!rateLimitStats.dailyStats[day]) {
    rateLimitStats.dailyStats[day] = { requests: 0, blocked: 0 };
  }
  rateLimitStats.dailyStats[day].requests++;
  
  // Track blocked requests and response time
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Update average response time
    const endpointStats = rateLimitStats.byEndpoint[endpoint];
    endpointStats.avgResponseTime = 
      (endpointStats.avgResponseTime * (endpointStats.requests - 1) + responseTime) / endpointStats.requests;
    
    if (res.statusCode === 429) {
      rateLimitStats.blockedRequests++;
      rateLimitStats.byEndpoint[endpoint].blocked++;
      rateLimitStats.byUser[userId].blocked++;
      rateLimitStats.byIP[ip].blocked++;
      rateLimitStats.hourlyStats[hour].blocked++;
      rateLimitStats.dailyStats[day].blocked++;
    }
  });
  
  next();
};

// Enhanced function to get rate limit statistics
const getRateLimitStats = () => {
  const totalBlockedRate = rateLimitStats.totalRequests > 0 
    ? (rateLimitStats.blockedRequests / rateLimitStats.totalRequests * 100).toFixed(2)
    : 0;

  // Calculate top endpoints by requests
  const topEndpoints = Object.entries(rateLimitStats.byEndpoint)
    .sort(([,a], [,b]) => b.requests - a.requests)
    .slice(0, 10)
    .map(([endpoint, stats]) => ({
      endpoint,
      requests: stats.requests,
      blocked: stats.blocked,
      blockedRate: stats.requests > 0 ? ((stats.blocked / stats.requests) * 100).toFixed(2) + '%' : '0%',
      avgResponseTime: Math.round(stats.avgResponseTime) + 'ms'
    }));

  // Calculate top users by requests
  const topUsers = Object.entries(rateLimitStats.byUser)
    .sort(([,a], [,b]) => b.requests - a.requests)
    .slice(0, 10)
    .map(([userId, stats]) => ({
      userId,
      role: stats.role,
      requests: stats.requests,
      blocked: stats.blocked,
      blockedRate: stats.requests > 0 ? ((stats.blocked / stats.requests) * 100).toFixed(2) + '%' : '0%',
      lastRequest: stats.lastRequest
    }));

  return {
    summary: {
      totalRequests: rateLimitStats.totalRequests,
      blockedRequests: rateLimitStats.blockedRequests,
    blockedRate: `${totalBlockedRate}%`,
    timestamp: new Date().toISOString()
    },
    topEndpoints,
    topUsers,
    hourlyStats: rateLimitStats.hourlyStats,
    dailyStats: rateLimitStats.dailyStats,
    config: RATE_LIMIT_CONFIG
  };
};

// Enhanced function to reset rate limit statistics
const resetRateLimitStats = () => {
  Object.assign(rateLimitStats, {
    totalRequests: 0,
    blockedRequests: 0,
    byEndpoint: {},
    byUser: {},
    byLimitType: {},
    byIP: {},
    hourlyStats: {},
    dailyStats: {}
  });
  
  logger.info('Rate limit statistics reset');
};

// Function to get current rate limit status for a specific key
const getRateLimitStatus = (key) => {
  // This would need to be implemented based on your rate limiting store
  // For now, return a placeholder
  return {
    key,
    current: 0,
    limit: RATE_LIMIT_CONFIG.GENERAL.max,
    remaining: RATE_LIMIT_CONFIG.GENERAL.max,
    resetTime: new Date(Date.now() + RATE_LIMIT_CONFIG.GENERAL.windowMs).toISOString()
  };
};

module.exports = {
  dynamicRateLimiter,
  generalLimiter,
  authLimiter,
  adminLimiter,
  uploadLimiter,
  paymentLimiter,
  newsletterLimiter,
  registrationLimiter,
  passwordResetLimiter,
  searchLimiter,
  browseLimiter,
  trackRateLimitStats,
  getRateLimitStats,
  resetRateLimitStats,
  getRateLimitStatus,
  RATE_LIMIT_CONFIG
}; 