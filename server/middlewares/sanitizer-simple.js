/**
 * Simple input sanitization middleware for security
 * Alternative to express-mongo-sanitize to avoid compatibility issues
 */

const sanitizer = (req, res, next) => {
  try {
    // Simple sanitization - remove any keys that start with $
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('$')) {
          // Skip MongoDB operators
          continue;
        }
        
        if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    };

    // Sanitize request data
    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) req.query = sanitizeObject(req.query);
    if (req.params) req.params = sanitizeObject(req.params);
    
    next();
  } catch (error) {
    console.warn('Sanitization warning:', error.message);
    // Continue without sanitization if it fails
    next();
  }
};

module.exports = sanitizer; 