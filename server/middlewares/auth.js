const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sanitizeObjectId } = require('./sanitizer');

// Track failed login attempts
const failedAttempts = new Map();
const maxFailedAttempts = 5;
const lockoutDuration = 15 * 60 * 1000; // 15 minutes

/**
 * Check if user is locked out due to failed attempts
 * @param {string} identifier - Email or IP address
 * @returns {boolean} True if locked out
 */
const isLockedOut = (identifier) => {
  const attempts = failedAttempts.get(identifier);
  if (!attempts) return false;
  
  const now = Date.now();
  const recentAttempts = attempts.filter(timestamp => now - timestamp < lockoutDuration);
  
  if (recentAttempts.length >= maxFailedAttempts) {
    return true;
  }
  
  // Update attempts with only recent ones
  failedAttempts.set(identifier, recentAttempts);
  return false;
};

/**
 * Record failed login attempt
 * @param {string} identifier - Email or IP address
 */
const recordFailedAttempt = (identifier) => {
  const now = Date.now();
  const attempts = failedAttempts.get(identifier) || [];
  attempts.push(now);
  failedAttempts.set(identifier, attempts);
};

/**
 * Clear failed attempts for successful login
 * @param {string} identifier - Email or IP address
 */
const clearFailedAttempts = (identifier) => {
  failedAttempts.delete(identifier);
};

/**
 * Generate JWT token with enhanced security
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  const tokenPayload = {
    id: payload.id,
    email: payload.email,
    isAdmin: payload.isAdmin,
    role: payload.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    jti: require('crypto').randomBytes(16).toString('hex') // Unique token ID
  };

  return jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    issuer: 'ecommerce-api',
    audience: 'ecommerce-client'
  });
};

/**
 * Verify JWT token with enhanced validation
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token or null if invalid
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'ecommerce-api',
      audience: 'ecommerce-client'
    });

    // Check if token is not too old (additional security)
    const tokenAge = Date.now() - (decoded.iat * 1000);
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (tokenAge > maxAge) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
};

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Sanitize token
      if (!token || typeof token !== 'string' || token.length > 1000) {
        return res.status(401).json({ 
          success: false,
          error: {
            message: 'Invalid token format',
            statusCode: 401
          }
        });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ 
          success: false,
          error: {
            message: 'Invalid or expired token',
            statusCode: 401
          }
        });
      }

      // Sanitize user ID
      const userId = sanitizeObjectId(decoded.id);
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          error: {
            message: 'Invalid user ID in token',
            statusCode: 401
          }
        });
      }

      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: {
            message: 'User not found',
            statusCode: 401
          }
        });
      }

      // Check if user account is still active
      if (user.archived || user.deleted) {
        return res.status(401).json({ 
          success: false,
          error: {
            message: 'Account is deactivated',
            statusCode: 401
          }
        });
      }

      req.user = user;
      req.token = token;
      next();
    } catch (err) {
      return res.status(401).json({ 
        success: false,
        error: {
          message: 'Not authorized, token failed',
          statusCode: 401
        }
      });
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: {
        message: 'Not authorized, no token',
        statusCode: 401
      }
    });
  }
};

// Middleware to check admin
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      error: {
        message: 'Not authorized as admin',
        statusCode: 403
      }
    });
  }
};

// Middleware to check specific roles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: {
          message: 'Authentication required',
          statusCode: 401
        }
      });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    if (userRoles.includes(req.user.role) || req.user.isAdmin) {
      next();
    } else {
      res.status(403).json({ 
        success: false,
        error: {
          message: `Access denied. Required roles: ${userRoles.join(', ')}`,
          statusCode: 403
        }
      });
    }
  };
};

// Middleware to check if user owns the resource
const requireOwnership = (resourceModel, resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdField];
      const sanitizedId = sanitizeObjectId(resourceId);
      
      if (!sanitizedId) {
        return res.status(400).json({ 
          success: false,
          error: {
            message: 'Invalid resource ID',
            statusCode: 400
          }
        });
      }

      const resource = await resourceModel.findById(sanitizedId);
      if (!resource) {
        return res.status(404).json({ 
          success: false,
          error: {
            message: 'Resource not found',
            statusCode: 404
          }
        });
      }

      // Allow admins to access any resource
      if (req.user.isAdmin) {
        req.resource = resource;
        return next();
      }

      // Check if user owns the resource
      const ownerField = resource.user ? 'user' : 'userId';
      if (resource[ownerField] && resource[ownerField].toString() === req.user._id.toString()) {
        req.resource = resource;
        next();
      } else {
        res.status(403).json({ 
          success: false,
          error: {
            message: 'Access denied. You do not own this resource.',
            statusCode: 403
          }
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: {
          message: 'Error checking resource ownership',
          statusCode: 500
        }
      });
    }
  };
};

// Middleware to prevent brute force attacks
const preventBruteForce = (identifierField = 'email') => {
  return (req, res, next) => {
    const identifier = req.body[identifierField] || req.ip;
    
    if (isLockedOut(identifier)) {
      return res.status(429).json({ 
        success: false,
        error: {
          message: 'Too many failed attempts. Please try again later.',
          statusCode: 429,
          retryAfter: Math.ceil(lockoutDuration / 1000)
        }
      });
    }
    
    next();
  };
};

// Middleware to handle successful authentication
const handleSuccessfulAuth = (identifierField = 'email') => {
  return (req, res, next) => {
    const identifier = req.body[identifierField] || req.ip;
    clearFailedAttempts(identifier);
    next();
  };
};

// Middleware to handle failed authentication
const handleFailedAuth = (identifierField = 'email') => {
  return (req, res, next) => {
    const identifier = req.body[identifierField] || req.ip;
    recordFailedAttempt(identifier);
    next();
  };
};

// Clean up old failed attempts every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [identifier, attempts] of failedAttempts.entries()) {
    const recentAttempts = attempts.filter(timestamp => now - timestamp < lockoutDuration);
    if (recentAttempts.length === 0) {
      failedAttempts.delete(identifier);
    } else {
      failedAttempts.set(identifier, recentAttempts);
    }
  }
}, 30 * 60 * 1000);

module.exports = {
  protect,
  admin,
  generateToken,
  requireRole: requireRole,
  requireOwnership: requireOwnership,
  preventBruteForce: preventBruteForce,
  handleSuccessfulAuth: handleSuccessfulAuth,
  handleFailedAuth: handleFailedAuth,
  verifyToken,
  isLockedOut,
  recordFailedAttempt,
  clearFailedAttempts
};
