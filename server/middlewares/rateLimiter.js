/**
 * Rate limiting middleware for API protection
 */

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.config = {
      // Default limits (requests per window)
      default: { windowMs: 15 * 60 * 1000, max: 100 }, // 15 minutes, 100 requests
      auth: { windowMs: 15 * 60 * 1000, max: 5 }, // 15 minutes, 5 login attempts
      api: { windowMs: 60 * 1000, max: 60 }, // 1 minute, 60 requests
      admin: { windowMs: 60 * 1000, max: 200 }, // 1 minute, 200 requests for admins
      upload: { windowMs: 60 * 1000, max: 10 }, // 1 minute, 10 uploads
      search: { windowMs: 60 * 1000, max: 30 } // 1 minute, 30 searches
    };
  }

  /**
   * Generate a unique key for rate limiting
   * @param {Object} req - Express request object
   * @param {string} type - Rate limit type
   * @returns {string} Unique key
   */
  generateKey(req, type) {
    const identifier = req.user ? req.user._id : req.ip;
    const userType = req.user ? (req.user.isAdmin ? 'admin' : 'user') : 'anonymous';
    return `${type}:${userType}:${identifier}`;
  }

  /**
   * Check if request is within rate limit
   * @param {string} key - Rate limit key
   * @param {Object} config - Rate limit configuration
   * @returns {Object} Rate limit status
   */
  checkLimit(key, config) {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const requests = this.requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    this.requests.set(key, validRequests);

    const currentCount = validRequests.length;
    const isAllowed = currentCount < config.max;

    if (isAllowed) {
      validRequests.push(now);
      this.requests.set(key, validRequests);
    }

    return {
      allowed: isAllowed,
      remaining: Math.max(0, config.max - currentCount),
      resetTime: now + config.windowMs,
      currentCount
    };
  }

  /**
   * Clean up old rate limit data
   */
  cleanup() {
    const now = Date.now();
    
    for (const [key, requests] of this.requests.entries()) {
      const hasRecentRequests = requests.some(timestamp => 
        now - timestamp < 60 * 60 * 1000 // Keep data for 1 hour
      );
      
      if (!hasRecentRequests) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Get rate limit statistics
   * @returns {Object} Rate limit statistics
   */
  getStats() {
    const stats = {
      totalKeys: this.requests.size,
      totalRequests: 0,
      blockedRequests: 0,
      byType: {}
    };

    for (const [key, requests] of this.requests.entries()) {
      const type = key.split(':')[0];
      const count = requests.length;
      
      stats.totalRequests += count;
      
      if (!stats.byType[type]) {
        stats.byType[type] = { keys: 0, requests: 0 };
      }
      
      stats.byType[type].keys++;
      stats.byType[type].requests += count;
    }

    return stats;
  }
}

// Create global rate limiter instance
const rateLimiter = new RateLimiter();

/**
 * Rate limiting middleware factory
 * @param {string} type - Rate limit type
 * @param {Object} customConfig - Custom configuration (optional)
 * @returns {Function} Express middleware
 */
const createRateLimiter = (type, customConfig = null) => {
  return (req, res, next) => {
    const config = customConfig || rateLimiter.config[type] || rateLimiter.config.default;
    const key = rateLimiter.generateKey(req, type);
    
    const limitStatus = rateLimiter.checkLimit(key, config);

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': config.max,
      'X-RateLimit-Remaining': limitStatus.remaining,
      'X-RateLimit-Reset': limitStatus.resetTime
    });

    if (!limitStatus.allowed) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests, please try again later',
          statusCode: 429,
          retryAfter: Math.ceil((limitStatus.resetTime - Date.now()) / 1000)
        }
      });
    }

    next();
  };
};

/**
 * Specific rate limiters for different endpoints
 */
const rateLimiters = {
  // Authentication endpoints (login, register, password reset)
  auth: createRateLimiter('auth'),
  
  // General API endpoints
  api: createRateLimiter('api'),
  
  // Admin endpoints (higher limits for admins)
  admin: createRateLimiter('admin'),
  
  // File upload endpoints
  upload: createRateLimiter('upload'),
  
  // Search endpoints
  search: createRateLimiter('search'),
  
  // Custom rate limiter
  custom: (config) => createRateLimiter('custom', config)
};

/**
 * Dynamic rate limiter based on user role
 * @returns {Function} Express middleware
 */
const dynamicRateLimiter = () => {
  return (req, res, next) => {
    let type = 'api';
    
    // Determine rate limit type based on route and user
    if (req.path.includes('/auth') || req.path.includes('/login') || req.path.includes('/register')) {
      type = 'auth';
    } else if (req.path.includes('/admin')) {
      type = req.user && req.user.isAdmin ? 'admin' : 'api';
    } else if (req.path.includes('/upload')) {
      type = 'upload';
    } else if (req.path.includes('/search') || req.query.keyword || req.query.search) {
      type = 'search';
    }

    const config = rateLimiter.config[type];
    const key = rateLimiter.generateKey(req, type);
    
    const limitStatus = rateLimiter.checkLimit(key, config);

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': config.max,
      'X-RateLimit-Remaining': limitStatus.remaining,
      'X-RateLimit-Reset': limitStatus.resetTime,
      'X-RateLimit-Type': type
    });

    if (!limitStatus.allowed) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests, please try again later',
          statusCode: 429,
          retryAfter: Math.ceil((limitStatus.resetTime - Date.now()) / 1000),
          type: type
        }
      });
    }

    next();
  };
};

// Clean up old data every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000);

module.exports = {
  rateLimiter,
  rateLimiters,
  dynamicRateLimiter,
  createRateLimiter
}; 