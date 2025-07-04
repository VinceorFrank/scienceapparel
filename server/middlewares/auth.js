const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const { sendError, sendUnauthorized, sendForbidden } = require('../utils/responseHandler');
const { logger } = require('../utils/logger');

// Enhanced token generation with better security
const generateToken = (payload) => {
  const jwtConfig = config.getJWTConfig();
  
  if (!jwtConfig.secret || jwtConfig.secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  // Use production settings if in production
  const expiresIn = config.NODE_ENV === 'production' 
    ? jwtConfig.production.expiresIn 
    : jwtConfig.expiresIn;
  
  const algorithm = config.NODE_ENV === 'production' 
    ? jwtConfig.production.algorithm 
    : jwtConfig.algorithm;
  
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn,
    algorithm,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    // Additional security headers
    header: {
      typ: 'JWT',
      alg: algorithm
    }
  });
};

// Enhanced refresh token generation
const generateRefreshToken = (payload) => {
  const jwtConfig = config.getJWTConfig();
  
  if (!jwtConfig.refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET is required for refresh tokens');
  }
  
  return jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
    algorithm: jwtConfig.algorithm,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  });
};

// Enhanced token verification with multiple secret support and detailed error handling
const verifyToken = (token) => {
  try {
    const jwtConfig = config.getJWTConfig();
    
    if (!jwtConfig.secret) {
      throw new Error('JWT_SECRET not configured');
    }
    
    // Try primary secret first
    try {
      return jwt.verify(token, jwtConfig.secret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        algorithms: [jwtConfig.algorithm]
      });
    } catch (primaryError) {
      // If primary fails and backup secret exists, try backup
      if (jwtConfig.secretBackup && primaryError.name === 'JsonWebTokenError') {
        try {
          const decoded = jwt.verify(token, jwtConfig.secretBackup, {
            issuer: jwtConfig.issuer,
            audience: jwtConfig.audience,
            algorithms: [jwtConfig.algorithm]
          });
          
          // Log successful backup secret usage for monitoring
          logger.warn('Token verified using backup secret', {
            tokenType: 'backup_used',
            issuer: decoded.iss,
            audience: decoded.aud
          });
          
          return decoded;
        } catch (backupError) {
          // Both secrets failed
          logger.warn('Token verification failed with both primary and backup secrets', {
            primaryError: primaryError.message,
            backupError: backupError.message,
            tokenType: typeof token,
            tokenLength: token ? token.length : 0
          });
          return null;
        }
      }
      
      // Log the specific error for debugging
      logger.warn('Token verification failed', {
        error: primaryError.message,
        errorName: primaryError.name,
        tokenType: typeof token,
        tokenLength: token ? token.length : 0
      });
      
      return null;
    }
  } catch (error) {
    logger.error('Token verification error', {
      error: error.message,
      stack: error.stack
    });
    return null;
  }
};

// Enhanced refresh token verification
const verifyRefreshToken = (token) => {
  try {
    const jwtConfig = config.getJWTConfig();
    
    if (!jwtConfig.refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET not configured');
    }
    
    return jwt.verify(token, jwtConfig.refreshSecret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      algorithms: [jwtConfig.algorithm]
    });
  } catch (error) {
    logger.warn('Refresh token verification failed', {
      error: error.message,
      errorName: error.name,
      tokenType: typeof token,
      tokenLength: token ? token.length : 0
    });
    return null;
  }
};

// Enhanced authentication middleware with proper error handling
const requireAuth = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return sendUnauthorized(res, 'Access denied. No token provided.');
    }
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return sendUnauthorized(res, 'Invalid or expired token.');
    }
    
    // Validate token payload
    if (!decoded.id || !decoded.email) {
      return sendUnauthorized(res, 'Invalid token payload.');
    }
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return sendUnauthorized(res, 'User not found.');
    }
    
    // Check if user account is active
    if (user.status === 'suspended') {
      return sendForbidden(res, 'Account is suspended. Please contact support.');
    }
    
    // Verify token email matches user email (additional security)
    if (decoded.email !== user.email) {
      logger.warn('Token email mismatch', {
        tokenEmail: decoded.email,
        userEmail: user.email,
        userId: user._id
      });
      return sendUnauthorized(res, 'Token validation failed.');
    }
    
    // Add user to request
    req.user = user;
    
    // Log successful authentication
    logger.info('User authenticated successfully', {
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    next();
  } catch (error) {
    logger.error('Authentication error:', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    return sendError(res, 500, 'Authentication failed.');
  }
};

// Enhanced admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return sendUnauthorized(res, 'Authentication required.');
  }
  
  if (!req.user.isAdmin && req.user.role !== 'admin') {
    logger.warn('Admin access denied', {
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ip: req.ip
    });
    return sendForbidden(res, 'Access denied. Admin privileges required.');
  }
  
  next();
};

// Enhanced role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required.');
    }
    
    const userRoles = Array.isArray(roles) ? roles : [roles];
    const hasRequiredRole = userRoles.includes(req.user.role) || req.user.isAdmin;
    
    if (!hasRequiredRole) {
      logger.warn('Role-based access denied', {
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        requiredRoles: userRoles,
        ip: req.ip
      });
      return sendForbidden(res, `Access denied. Required roles: ${userRoles.join(', ')}`);
    }
    
    next();
  };
};

// Enhanced resource ownership middleware
const requireOwnership = (resourceModel, resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdField];
      
      if (!resourceId) {
        return sendError(res, 400, 'Resource ID is required.');
      }
      
      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return sendError(res, 404, 'Resource not found.');
      }
      
      // Check ownership or admin privileges
      const isOwner = resource.user && resource.user.toString() === req.user._id.toString();
      const isAdmin = req.user.isAdmin || req.user.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        logger.warn('Resource ownership access denied', {
          userId: req.user._id,
          userEmail: req.user.email,
          resourceId,
          resourceOwner: resource.user,
          ip: req.ip
        });
        return sendForbidden(res, 'Access denied. You do not own this resource.');
      }
      
      req.resource = resource;
      next();
    } catch (error) {
      logger.error('Ownership verification error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?._id,
        resourceId: req.params[resourceIdField],
        ip: req.ip
      });
      return sendError(res, 500, 'Server error while verifying ownership.');
    }
  };
};

// Customer-only middleware
const requireCustomer = (req, res, next) => {
  if (!req.user) {
    return sendUnauthorized(res, 'Authentication required.');
  }
  
  if (req.user.role !== 'customer' && !req.user.isAdmin) {
    return sendForbidden(res, 'Access denied. Customer privileges required.');
  }
  
  next();
};

// Optional authentication middleware (for public endpoints that can work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.id) {
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.status === 'active') {
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't fail the request
    logger.warn('Optional authentication failed', {
      error: error.message,
      ip: req.ip
    });
    next();
  }
};

// Token refresh middleware
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return sendUnauthorized(res, 'Refresh token is required.');
    }
    
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return sendUnauthorized(res, 'Invalid or expired refresh token.');
    }
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return sendUnauthorized(res, 'User not found.');
    }
    
    // Check if user account is active
    if (user.status === 'suspended') {
      return sendForbidden(res, 'Account is suspended. Please contact support.');
    }
    
    // Generate new tokens
    const newToken = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });
    
    const newRefreshToken = generateRefreshToken({
      id: user._id,
      email: user.email
    });
    
    // Log token refresh
    logger.info('Token refreshed successfully', {
      userId: user._id,
      userEmail: user.email,
      ip: req.ip
    });
    
    return res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    return sendError(res, 500, 'Token refresh failed.');
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  requireAuth,
  requireAdmin,
  requireRole,
  requireOwnership,
  requireCustomer,
  optionalAuth,
  refreshToken,
  // Legacy exports for backward compatibility
  admin: requireAdmin,
  protect: requireAuth
};