/**
 * Enhanced Input Sanitization System
 * Provides comprehensive protection against XSS, NoSQL injection, and other security threats
 */

const DOMPurify = require('isomorphic-dompurify');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const { logger } = require('../../utils/logger');

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

  let sanitized = url.trim();

  // Basic URL validation
  try {
    const urlObj = new URL(sanitized);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      logger.warn('Invalid URL protocol detected', { url: sanitized });
      return null;
    }
  } catch (error) {
    logger.warn('Invalid URL format detected', { url: sanitized });
    return null;
  }

  // Remove any HTML or scripts
  sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] });
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  return sanitized;
};

/**
 * Enhanced MongoDB ObjectId validation and sanitization
 * @param {string} id - ObjectId to validate
 * @returns {string|null} Valid ObjectId or null
 */
const sanitizeObjectId = (id) => {
  if (typeof id !== 'string') {
    return null;
  }

  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(id)) {
    logger.warn('Invalid ObjectId format detected', { id });
    return null;
  }

  return id.toLowerCase();
};

/**
 * Enhanced number sanitization
 * @param {*} value - Value to sanitize
 * @param {Object} options - Sanitization options
 * @returns {number|null} Sanitized number or null
 */
const sanitizeNumber = (value, options = {}) => {
  const { min = -Infinity, max = Infinity, allowFloat = true } = options;

  if (value === null || value === undefined) {
    return null;
  }

  const num = allowFloat ? parseFloat(value) : parseInt(value, 10);

  if (isNaN(num)) {
    logger.warn('Invalid number format detected', { value });
    return null;
  }

  if (num < min || num > max) {
    logger.warn('Number out of range', { value: num, min, max });
    return null;
  }

  return num;
};

/**
 * Enhanced boolean sanitization
 * @param {*} value - Value to sanitize
 * @returns {boolean} Sanitized boolean
 */
const sanitizeBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    return ['true', '1', 'yes', 'on'].includes(lowerValue);
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return false;
};

/**
 * Enhanced array sanitization
 * @param {Array} array - Array to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Array} Sanitized array
 */
const sanitizeArray = (array, options = {}) => {
  const { maxLength = 100, unique = false, filterNull = true } = options;

  if (!Array.isArray(array)) {
    return [];
  }

  let sanitized = array.slice(0, maxLength);

  // Remove null/undefined values if requested
  if (filterNull) {
    sanitized = sanitized.filter(item => item !== null && item !== undefined);
  }

  // Remove duplicates if requested
  if (unique) {
    sanitized = [...new Set(sanitized)];
  }

  return sanitized;
};

/**
 * Enhanced middleware for request body sanitization
 * @param {Object} options - Sanitization options
 * @returns {Function} Express middleware
 */
const sanitizeRequestBody = (options = {}) => {
  return (req, res, next) => {
    try {
      if (req.body && typeof req.body === 'object') {
        const originalBody = JSON.stringify(req.body);
        req.body = deepSanitize(req.body, options);
        
        // Log if significant changes were made
        const sanitizedBody = JSON.stringify(req.body);
        if (originalBody !== sanitizedBody) {
          logger.info('Request body sanitized', {
            path: req.path,
            method: req.method,
            originalLength: originalBody.length,
            sanitizedLength: sanitizedBody.length
          });
        }
      }
      
      next();
    } catch (error) {
      logger.error('Body sanitization error', {
        error: error.message,
        path: req.path,
        method: req.method
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        code: 'SANITIZATION_ERROR'
      });
    }
  };
};

/**
 * Enhanced middleware for query parameters sanitization
 * @param {Object} options - Sanitization options
 * @returns {Function} Express middleware
 */
const sanitizeQueryParams = (options = {}) => {
  return (req, res, next) => {
    try {
      if (req.query && typeof req.query === 'object') {
        const originalQuery = JSON.stringify(req.query);
        req.query = deepSanitize(req.query, options);
        
        // Log if significant changes were made
        const sanitizedQuery = JSON.stringify(req.query);
        if (originalQuery !== sanitizedQuery) {
          logger.info('Query parameters sanitized', {
            path: req.path,
            method: req.method,
            originalLength: originalQuery.length,
            sanitizedLength: sanitizedQuery.length
          });
        }
      }
      
      next();
    } catch (error) {
      logger.error('Query sanitization error', {
        error: error.message,
        path: req.path,
        method: req.method
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        code: 'SANITIZATION_ERROR'
      });
    }
  };
};

/**
 * Enhanced middleware for URL parameters sanitization
 * @param {Object} options - Sanitization options
 * @returns {Function} Express middleware
 */
const sanitizeUrlParams = (options = {}) => {
  return (req, res, next) => {
    try {
      if (req.params && typeof req.params === 'object') {
        const originalParams = JSON.stringify(req.params);
        req.params = deepSanitize(req.params, options);
        
        // Log if significant changes were made
        const sanitizedParams = JSON.stringify(req.params);
        if (originalParams !== sanitizedParams) {
          logger.info('URL parameters sanitized', {
            path: req.path,
            method: req.method,
            originalLength: originalParams.length,
            sanitizedLength: sanitizedParams.length
          });
        }
      }
      
      next();
    } catch (error) {
      logger.error('URL params sanitization error', {
        error: error.message,
        path: req.path,
        method: req.method
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid URL parameters',
        code: 'SANITIZATION_ERROR'
      });
    }
  };
};

/**
 * Comprehensive sanitization middleware
 * @param {Object} options - Sanitization options
 * @returns {Function} Express middleware
 */
const comprehensiveSanitizer = (options = {}) => {
  return [
    sanitizeRequestBody(options),
    sanitizeQueryParams(options),
    sanitizeUrlParams(options)
  ];
};

module.exports = {
  deepSanitize,
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeObjectId,
  sanitizeNumber,
  sanitizeBoolean,
  sanitizeArray,
  sanitizeRequestBody,
  sanitizeQueryParams,
  sanitizeUrlParams,
  comprehensiveSanitizer
}; 