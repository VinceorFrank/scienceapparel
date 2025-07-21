/**
 * Simplified Rate Limiting System
 * Provides essential rate limiting with clean, maintainable code
 */

const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');
const { sendError } = require('../utils/responseHandler');
const config = require('../config/env');

// Simplified rate limit configurations
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

  // Authentication endpoints (strict)
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
    skipFailedRequests: false
  },

  // Admin endpoints (strict)
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
  }
};

// Simple key generator
const generateKey = (req) => {
  const userKey = req.user ? `:user:${req.user._id}` : ':anonymous';
  const pathKey = `:path:${req.path.split('/')[1] || 'root'}`; // First path segment
  
  return `${req.ip}${userKey}${pathKey}`;
};

// Simple skip function
const shouldSkipRateLimit = (req) => {
  // Skip rate limiting for health checks
  if (req.path === '/api/health' || req.path === '/health') {
    return true;
  }

  // Skip rate limiting for static files
  if (req.path.startsWith('/uploads/') || req.path.startsWith('/static/')) {
    return true;
  }

  // Skip rate limiting for development environment with bypass header
  if (config.NODE_ENV === 'development' && req.headers['x-development-bypass']) {
    return true;
  }

  return false;
};

// Simple handler for rate limit exceeded
const handleRateLimitExceeded = (req, res, options) => {
  const retryAfter = Math.ceil(options.windowMs / 1000);
  
  // Log rate limit exceeded
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    path: req.path,
    method: req.method,
    user: req.user ? req.user._id : 'anonymous',
    retryAfter,
    limit: options.max,
    current: options.current
  });

  // Set appropriate headers
  res.setHeader('Retry-After', retryAfter);
  res.setHeader('X-RateLimit-Limit', options.max);
  res.setHeader('X-RateLimit-Remaining', options.remaining);

  // Use standardized error response
  return sendError(res, 429, options.message, {
    retryAfter,
    limit: options.max,
    remaining: options.remaining
  });
};

// Create rate limiter with configuration
const createRateLimiter = (config, limitType) => {
  return rateLimit({
    ...config,
    keyGenerator: generateKey,
    skip: shouldSkipRateLimit,
    handler: (req, res, options) => handleRateLimitExceeded(req, res, { ...options, limitType }),
  });
};

// Dynamic rate limiter that applies appropriate limits based on route
const dynamicRateLimiter = (req, res, next) => {
  // Determine which rate limit to apply based on the route
  let limitConfig = RATE_LIMIT_CONFIG.GENERAL;

  if (req.path.startsWith('/api/auth') || req.path.includes('/login') || req.path.includes('/register')) {
    limitConfig = RATE_LIMIT_CONFIG.AUTH;
  } else if (req.path.startsWith('/api/admin/')) {
    limitConfig = RATE_LIMIT_CONFIG.ADMIN;
  } else if (req.path.includes('/upload') || req.path.includes('/file')) {
    limitConfig = RATE_LIMIT_CONFIG.UPLOAD;
  } else if (req.path.includes('/payment') || req.path.includes('/stripe')) {
    limitConfig = RATE_LIMIT_CONFIG.PAYMENT;
  }

  // Create and apply the rate limiter
  const limiter = createRateLimiter(limitConfig, req.path);
  return limiter(req, res, next);
};

// Simple rate limit tracking
let rateLimitStats = {
  totalRequests: 0,
  blockedRequests: 0,
  lastReset: Date.now()
};

// Track rate limit statistics
const trackRateLimitStats = (req, res, next) => {
  rateLimitStats.totalRequests++;
  
  // Reset stats every hour
  if (Date.now() - rateLimitStats.lastReset > 60 * 60 * 1000) {
    rateLimitStats = {
      totalRequests: 0,
      blockedRequests: 0,
      lastReset: Date.now()
    };
  }
  
  next();
};

// Get rate limit statistics
const getRateLimitStats = () => {
  return {
    ...rateLimitStats,
    uptime: Date.now() - rateLimitStats.lastReset
  };
};

// Reset rate limit statistics
const resetRateLimitStats = () => {
  rateLimitStats = {
    totalRequests: 0,
    blockedRequests: 0,
    lastReset: Date.now()
  };
};

// Export the main rate limiter and utilities
module.exports = {
  dynamicRateLimiter,
  trackRateLimitStats,
  getRateLimitStats,
  resetRateLimitStats,
  createRateLimiter,
  RATE_LIMIT_CONFIG
}; 