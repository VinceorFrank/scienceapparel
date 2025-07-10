/**
 * Unified Input Sanitization Middleware
 * Provides comprehensive protection against XSS, NoSQL injection, and other security threats
 * Consolidates all sanitizer implementations into a single, clean solution
 */

const DOMPurify = require('isomorphic-dompurify');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const { logger } = require('../utils/logger');

/**
 * Deep sanitize object recursively
 * @param {*} data - Data to sanitize
 * @param {Object} options - Sanitization options
 * @returns {*} Sanitized data
 */
const deepSanitize = (data, options = {}) => {
  const {
    removeHtml = true,
    removeScripts = true,
    removeMongoOperators = true,
    maxDepth = 10,
    currentDepth = 0
  } = options;

  // Prevent infinite recursion
  if (currentDepth > maxDepth) {
    logger.warn('Sanitization depth limit reached', { maxDepth, currentDepth });
    return null;
  }

  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle strings
  if (typeof data === 'string') {
    let sanitized = data.trim();
    
    // Remove HTML tags if requested
    if (removeHtml) {
      sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] });
    }
    
    // Remove script tags and content
    if (removeScripts) {
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      sanitized = sanitized.replace(/javascript:/gi, '');
      sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    }
    
    // XSS protection
    sanitized = xss(sanitized, {
      whiteList: {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    });
    
    return sanitized;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => deepSanitize(item, { ...options, currentDepth: currentDepth + 1 }));
  }

  // Handle objects
  if (typeof data === 'object') {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Remove MongoDB operators if requested
      if (removeMongoOperators && key.startsWith('$')) {
        logger.warn('MongoDB operator detected and removed', { key, value });
        continue;
      }
      
      // Sanitize key
      const sanitizedKey = deepSanitize(key, { ...options, currentDepth: currentDepth + 1 });
      
      // Sanitize value
      const sanitizedValue = deepSanitize(value, { ...options, currentDepth: currentDepth + 1 });
      
      if (sanitizedValue !== undefined) {
        sanitized[sanitizedKey] = sanitizedValue;
      }
    }
    
    return sanitized;
  }

  // Return other types as-is (numbers, booleans, etc.)
  return data;
};

/**
 * Enhanced string sanitization with specific rules
 * @param {string} str - String to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized string
 */
const sanitizeString = (str, options = {}) => {
  const {
    allowHtml = false,
    allowScripts = false,
    maxLength = 1000,
    allowedTags = [],
    allowedAttributes = {}
  } = options;

  if (typeof str !== 'string') {
    return str;
  }

  let sanitized = str.trim();

  // Length check
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // HTML sanitization
  if (!allowHtml) {
    sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] });
  } else if (allowedTags.length > 0) {
    sanitized = DOMPurify.sanitize(sanitized, { 
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: allowedAttributes
    });
  }

  // Script removal
  if (!allowScripts) {
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  }

  // XSS protection
  sanitized = xss(sanitized, {
    whiteList: allowHtml ? { [allowedTags.join('')]: allowedAttributes } : {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  });

  return sanitized;
};

/**
 * Enhanced email sanitization
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
const sanitizeEmail = (email) => {
  if (typeof email !== 'string') {
    return email;
  }

  let sanitized = email.trim().toLowerCase();

  // Basic email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(sanitized)) {
    logger.warn('Invalid email format detected', { email: sanitized });
    return null;
  }

  // Remove any HTML or scripts
  sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] });
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  return sanitized;
};

/**
 * Enhanced phone number sanitization
 * @param {string} phone - Phone number to sanitize
 * @returns {string} Sanitized phone number
 */
const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') {
    return phone;
  }

  // Remove all non-digit characters except + and -
  let sanitized = phone.replace(/[^\d+\-]/g, '');

  // Ensure it starts with + or a digit
  if (!sanitized.match(/^[\+]?[1-9]/)) {
    logger.warn('Invalid phone number format detected', { phone });
    return null;
  }

  return sanitized;
};

/**
 * Enhanced URL sanitization
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 */
const sanitizeUrl = (url) => {
  if (typeof url !== 'string') {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    
    // Only allow http and https protocols
    if (!/^https?:$/.test(parsedUrl.protocol)) {
      logger.warn('Invalid URL protocol detected', { url });
      return null;
    }
    
    // Remove trailing slash for consistency
    return parsedUrl.toString().replace(/\/$/, '');
  } catch (error) {
    logger.warn('Invalid URL format detected', { url });
    return null;
  }
};

/**
 * Enhanced ObjectId sanitization
 * @param {string} id - ObjectId to sanitize
 * @returns {string} Sanitized ObjectId
 */
const sanitizeObjectId = (id) => {
  if (typeof id !== 'string') {
    return id;
  }
  
  return /^[0-9a-fA-F]{24}$/.test(id) ? id : null;
};

/**
 * Enhanced number sanitization
 * @param {*} value - Value to sanitize as number
 * @param {Object} options - Sanitization options
 * @returns {number} Sanitized number
 */
const sanitizeNumber = (value, options = {}) => {
  const { min = null, max = null, defaultValue = null } = options;
  
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  const num = Number(value);
  
  if (isNaN(num)) {
    logger.warn('Invalid number value detected', { value });
    return defaultValue;
  }
  
  if (min !== null && num < min) {
    logger.warn('Number below minimum value', { value: num, min });
    return defaultValue;
  }
  
  if (max !== null && num > max) {
    logger.warn('Number above maximum value', { value: num, max });
    return defaultValue;
  }
  
  return num;
};

/**
 * Enhanced boolean sanitization
 * @param {*} value - Value to sanitize as boolean
 * @returns {boolean} Sanitized boolean
 */
const sanitizeBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return false;
    }
  }
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  return Boolean(value);
};

/**
 * Enhanced array sanitization
 * @param {Array} array - Array to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Array} Sanitized array
 */
const sanitizeArray = (array, options = {}) => {
  const { maxLength = 100, itemSanitizer = null } = options;
  
  if (!Array.isArray(array)) {
    return [];
  }
  
  let sanitized = array.slice(0, maxLength);
  
  if (itemSanitizer) {
    sanitized = sanitized.map(item => itemSanitizer(item));
  }
  
  return sanitized.filter(item => item !== null && item !== undefined);
};

/**
 * Enhanced file sanitization
 * @param {Object} file - File object to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Object} Sanitized file object
 */
const sanitizeFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'docx'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.docx']
  } = options;

  if (!file || typeof file !== 'object' || !file.name) {
    return null;
  }

  // Check file size
  if (file.size > maxSize) {
    logger.warn('File size exceeds limit', { fileName: file.name, size: file.size, maxSize });
    return null;
  }

  // Check file type
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    logger.warn('File type not allowed', { fileName: file.name, extension });
    return null;
  }

  // Sanitize filename
  const sanitizedName = sanitizeString(file.name, { maxLength: 255 });
  
  return {
    ...file,
    name: sanitizedName
  };
};

/**
 * Comprehensive sanitizer middleware factory
 * @param {Object} options - Sanitization options
 * @returns {Function} Sanitizer middleware
 */
const comprehensiveSanitizer = (options = {}) => {
  const {
    removeHtml = true,
    removeScripts = true,
    removeMongoOperators = true,
    maxDepth = 10,
    sanitizeBody = true,
    sanitizeQuery = true,
    sanitizeParams = true
  } = options;

  return (req, res, next) => {
    try {
      // Apply MongoDB sanitization
      if (removeMongoOperators) {
        mongoSanitize.sanitize(req.body, { replaceWith: '_' });
        mongoSanitize.sanitize(req.query, { replaceWith: '_' });
        mongoSanitize.sanitize(req.params, { replaceWith: '_' });
      }

      // Apply comprehensive sanitization
      if (sanitizeBody && req.body) {
        req.body = deepSanitize(req.body, { removeHtml, removeScripts, removeMongoOperators, maxDepth });
      }

      if (sanitizeQuery && req.query) {
        req.query = deepSanitize(req.query, { removeHtml, removeScripts, removeMongoOperators, maxDepth });
      }

      if (sanitizeParams && req.params) {
        req.params = deepSanitize(req.params, { removeHtml, removeScripts, removeMongoOperators, maxDepth });
      }

      next();
    } catch (error) {
      logger.warn('Sanitization warning:', error.message);
      // Continue without sanitization if it fails
      next();
    }
  };
};

/**
 * Simple sanitizer middleware (backward compatibility)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const simpleSanitizer = (req, res, next) => {
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
    logger.warn('Sanitization warning:', error.message);
    // Continue without sanitization if it fails
    next();
  }
};

// Export the main sanitizer middleware
const sanitizer = comprehensiveSanitizer({
  removeHtml: true,
  removeScripts: true,
  removeMongoOperators: true,
  maxDepth: 10
});

// Export utility functions for specific sanitization needs
sanitizer.sanitizeString = sanitizeString;
sanitizer.sanitizeEmail = sanitizeEmail;
sanitizer.sanitizePhone = sanitizePhone;
sanitizer.sanitizeUrl = sanitizeUrl;
sanitizer.sanitizeObjectId = sanitizeObjectId;
sanitizer.sanitizeNumber = sanitizeNumber;
sanitizer.sanitizeBoolean = sanitizeBoolean;
sanitizer.sanitizeArray = sanitizeArray;
sanitizer.sanitizeFile = sanitizeFile;
sanitizer.comprehensiveSanitizer = comprehensiveSanitizer;
sanitizer.simpleSanitizer = simpleSanitizer;
sanitizer.deepSanitize = deepSanitize;

module.exports = sanitizer; 