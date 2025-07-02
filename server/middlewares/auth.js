const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

// Simplified token generation
const generateToken = (payload) => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
};

// Simplified token verification
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Simplified authentication middleware
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
    
    // Get user from token
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication failed.' });
  }
};

// Admin authorization middleware
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    
    const userRoles = Array.isArray(roles) ? roles : [roles];
    if (userRoles.includes(req.user.role) || req.user.isAdmin) {
      next();
    } else {
      res.status(403).json({ 
        message: `Access denied. Required roles: ${userRoles.join(', ')}` 
      });
    }
  };
};

// Resource ownership middleware
const requireOwnership = (resourceModel, resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdField];
      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found.' });
      }
      
      if (req.user.isAdmin || 
          (resource.user && resource.user.toString() === req.user._id.toString())) {
        req.resource = resource;
        return next();
      }
      
      res.status(403).json({ message: 'Access denied. You do not own this resource.' });
    } catch (error) {
      console.error('Ownership verification error:', error);
      res.status(500).json({ message: 'Server error while verifying ownership.' });
    }
  };
};

module.exports = {
  generateToken,
  verifyToken,
  requireAuth: protect,
  admin,
  requireRole,
  requireOwnership,
};