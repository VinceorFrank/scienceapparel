/**
 * Input sanitization middleware for security
 */

const xss = require('xss');

/**
 * Sanitize string values
 * @param {string} value - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  
  // Remove null bytes
  value = value.replace(/\0/g, '');
  
  // Remove control characters except newlines and tabs
  value = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // XSS protection
  value = xss(value, {
    whiteList: {}, // No HTML allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  });
  
  // Trim whitespace
  value = value.trim();
  
  return value;
};

/**
 * Sanitize object recursively
 * @param {*} obj - Object to sanitize
 * @returns {*} Sanitized object
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key
      const sanitizedKey = sanitizeString(key);
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeObject(value);
      }
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {string|null} Sanitized email or null if invalid
 */
const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  
  const sanitized = sanitizeString(email).toLowerCase();
  
  // Stricter email validation regex
  const emailRegex = /^(?=[a-zA-Z0-9@._%+-]{6,254}$)[a-zA-Z0-9._%+-]{1,64}@(?:[a-zA-Z0-9-]{1,63}\.){1,8}[a-zA-Z]{2,63}$/;

  if (!emailRegex.test(sanitized) || sanitized.includes('..')) {
    return null;
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /onload/i,
    /onerror/i,
    /onclick/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      return null;
    }
  }
  
  // Check for patterns that are often abused
  const abusivePatterns = [
    /\[removed\]/i,
    /abuse@/i,
    /postmaster@/i,
    /webmaster@/i,
    /noreply@/i
  ];

  for (const pattern of abusivePatterns) {
    if (pattern.test(sanitized)) {
      // Could log this as a warning instead of outright rejecting
      console.warn(`Potential abusive email pattern detected: ${sanitized}`);
    }
  }

  return sanitized;
};

/**
 * Validate and sanitize URL
 * @param {string} url - URL to validate
 * @returns {string|null} Sanitized URL or null if invalid
 */
const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  const sanitized = sanitizeString(url);
  
  try {
    const parsed = new URL(sanitized);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sanitized)) {
        return null;
      }
    }
    
    return sanitized;
  } catch (error) {
    return null;
  }
};

/**
 * Sanitize file upload data
 * @param {Object} file - File object
 * @returns {Object|null} Sanitized file object or null if invalid
 */
const sanitizeFile = (file) => {
  if (!file || typeof file !== 'object') return null;
  
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain'
  ];
  
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  // Validate file type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return null;
  }
  
  // Validate file size
  if (file.size > maxSize) {
    return null;
  }
  
  // Sanitize filename
  const sanitizedFilename = sanitizeString(file.name || file.originalname || '')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .substring(0, 255);
  
  if (!sanitizedFilename) {
    return null;
  }
  
  return {
    ...file,
    name: sanitizedFilename,
    originalname: sanitizedFilename
  };
};

/**
 * Sanitize MongoDB ObjectId
 * @param {string} id - ObjectId string
 * @returns {string|null} Sanitized ObjectId or null if invalid
 */
const sanitizeObjectId = (id) => {
  if (!id || typeof id !== 'string') return null;
  
  const sanitized = sanitizeString(id);
  
  // MongoDB ObjectId validation (24 hex characters)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(sanitized)) {
    return null;
  }
  
  return sanitized;
};

/**
 * Sanitize query parameters
 * @param {Object} query - Query object
 * @returns {Object} Sanitized query object
 */
const sanitizeQuery = (query) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(query)) {
    const sanitizedKey = sanitizeString(key);
    if (sanitizedKey) {
      // Handle special query parameters
      if (key === 'page' || key === 'limit') {
        const num = parseInt(value);
        if (!isNaN(num) && num > 0) {
          sanitized[sanitizedKey] = num;
        }
      } else if (key === 'sort') {
        const sortValue = sanitizeString(value);
        if (sortValue && /^[a-zA-Z0-9_,-]+$/.test(sortValue)) {
          sanitized[sanitizedKey] = sortValue;
        }
      } else if (key === 'category' || key === 'user') {
        const objectId = sanitizeObjectId(value);
        if (objectId) {
          sanitized[sanitizedKey] = objectId;
        }
      } else {
        sanitized[sanitizedKey] = sanitizeObject(value);
      }
    }
  }
  
  return sanitized;
};

/**
 * Sanitize request body
 * @param {Object} body - Request body
 * @returns {Object} Sanitized body
 */
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(body)) {
    const sanitizedKey = sanitizeString(key);
    if (sanitizedKey) {
      // Handle special body fields
      if (key === 'email') {
        const email = sanitizeEmail(value);
        if (email) {
          sanitized[sanitizedKey] = email;
        }
      } else if (key === 'image' || key === 'url') {
        const url = sanitizeUrl(value);
        if (url) {
          sanitized[sanitizedKey] = url;
        }
      } else if ((key === 'category' || key === 'user' || key === 'product') && typeof value === 'string') {
        const objectId = sanitizeObjectId(value);
        if (objectId) {
          sanitized[sanitizedKey] = objectId;
        }
      } else if (key === 'price' || key === 'stock' || key === 'totalPrice') {
        const num = parseFloat(value);
        if (!isNaN(num) && num >= 0) {
          sanitized[sanitizedKey] = num;
        }
      } else if (key === 'rating') {
        const num = parseInt(value);
        if (!isNaN(num) && num >= 1 && num <= 5) {
          sanitized[sanitizedKey] = num;
        }
      } else if (key === 'featured' || key === 'archived' || key === 'isAdmin' || key === 'isPaid' || key === 'isDelivered') {
        sanitized[sanitizedKey] = Boolean(value);
      } else if (key === 'tags' && Array.isArray(value)) {
        const sanitizedTags = value
          .map(tag => sanitizeString(tag))
          .filter(tag => tag && tag.length <= 20);
        if (sanitizedTags.length <= 10) {
          sanitized[sanitizedKey] = sanitizedTags;
        }
      } else {
        sanitized[sanitizedKey] = sanitizeObject(value);
      }
    }
  }
  
  return sanitized;
};

/**
 * Input sanitization middleware
 * @returns {Function} Express middleware
 */
const sanitizeInput = () => {
  return (req, res, next) => {
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeQuery(req.query);
    }
    
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeBody(req.body);
    }
    
    // Sanitize URL parameters
    if (req.params) {
      for (const [key, value] of Object.entries(req.params)) {
        if (key === 'id') {
          req.params[key] = sanitizeObjectId(value);
        } else {
          req.params[key] = sanitizeString(value);
        }
      }
    }
    
    // Sanitize file uploads
    if (req.files) {
      if (Array.isArray(req.files)) {
        req.files = req.files.map(file => sanitizeFile(file)).filter(Boolean);
      } else if (typeof req.files === 'object') {
        const sanitizedFiles = {};
        for (const [key, file] of Object.entries(req.files)) {
          const sanitizedFile = sanitizeFile(file);
          if (sanitizedFile) {
            sanitizedFiles[key] = sanitizedFile;
          }
        }
        req.files = sanitizedFiles;
      }
    }
    
    next();
  };
};

/**
 * Specific sanitizers for different data types
 */
const sanitizers = {
  email: sanitizeEmail,
  url: sanitizeUrl,
  objectId: sanitizeObjectId,
  string: sanitizeString,
  file: sanitizeFile,
  query: sanitizeQuery,
  body: sanitizeBody
};

module.exports = {
  sanitizeInput,
  sanitizers,
  sanitizeString,
  sanitizeObject,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeFile,
  sanitizeObjectId,
  sanitizeQuery,
  sanitizeBody
}; 