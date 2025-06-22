/**
 * Input sanitization middleware for security
 */

const mongoSanitize = require('express-mongo-sanitize');

// Fixed sanitizer middleware to handle Express compatibility issues
const sanitizer = (req, res, next) => {
  try {
    // Apply mongo sanitize with proper configuration
    mongoSanitize.sanitize(req.body, {
      replaceWith: '_'
    });
    
    mongoSanitize.sanitize(req.query, {
      replaceWith: '_'
    });
    
    mongoSanitize.sanitize(req.params, {
      replaceWith: '_'
    });
    
    next();
  } catch (error) {
    console.warn('Sanitization warning:', error.message);
    // Continue without sanitization if it fails
    next();
  }
};

module.exports = sanitizer; 