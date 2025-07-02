/**
 * Advanced Request Validation Middleware
 * Comprehensive validation for request structure, size, and content types
 */

const { body, query, param, header } = require('express-validator');
const { validateRequest } = require('../errorHandler');

// Maximum file sizes (in bytes)
const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024,    // 5MB
  document: 10 * 1024 * 1024, // 10MB
  video: 50 * 1024 * 1024,   // 50MB
  audio: 20 * 1024 * 1024     // 20MB
};

// Allowed file types
const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg']
};

/**
 * Validate request body size
 */
function validateBodySize(maxSize = 1024 * 1024) { // Default 1MB
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        message: `Request body too large. Maximum size is ${maxSize / 1024 / 1024}MB`,
        error: 'PAYLOAD_TOO_LARGE'
      });
    }
    
    next();
  };
}

/**
 * Validate file upload
 */
function validateFileUpload(allowedTypes = 'image', maxSize = null) {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        error: 'NO_FILE'
      });
    }

    const files = req.files || [req.file];
    const fileSize = maxSize || MAX_FILE_SIZES[allowedTypes] || MAX_FILE_SIZES.image;
    const allowedMimeTypes = ALLOWED_FILE_TYPES[allowedTypes] || ALLOWED_FILE_TYPES.image;

    for (const file of files) {
      // Check file size
      if (file.size > fileSize) {
        return res.status(413).json({
          success: false,
          message: `File too large. Maximum size is ${fileSize / 1024 / 1024}MB`,
          error: 'FILE_TOO_LARGE'
        });
      }

      // Check file type
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
          error: 'INVALID_FILE_TYPE'
        });
      }

      // Check for malicious file extensions
      const maliciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
      const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (maliciousExtensions.includes(fileExtension)) {
        return res.status(400).json({
          success: false,
          message: 'Malicious file type detected',
          error: 'MALICIOUS_FILE'
        });
      }
    }

    next();
  };
}

/**
 * Validate JSON content type
 */
function validateJsonContentType(req, res, next) {
  const contentType = req.headers['content-type'];
  
  if (!contentType || !contentType.includes('application/json')) {
    return res.status(400).json({
      success: false,
      message: 'Content-Type must be application/json',
      error: 'INVALID_CONTENT_TYPE'
    });
  }
  
  next();
}

/**
 * Validate multipart content type
 */
function validateMultipartContentType(req, res, next) {
  const contentType = req.headers['content-type'];
  
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return res.status(400).json({
      success: false,
      message: 'Content-Type must be multipart/form-data',
      error: 'INVALID_CONTENT_TYPE'
    });
  }
  
  next();
}

/**
 * Validate request headers
 */
const validateHeaders = [
  header('user-agent')
    .notEmpty()
    .withMessage('User-Agent header is required')
    .isLength({ max: 500 })
    .withMessage('User-Agent header too long'),

  header('accept')
    .optional()
    .custom(val => {
      // Allow common multi-value Accept headers
      if (
        typeof val === 'string' &&
        (
          val.includes('application/json') ||
          val.includes('text/plain') ||
          val.includes('*/*')
        )
      ) {
        return true;
      }
      throw new Error('Invalid Accept header');
    }),

  header('content-type')
    .optional()
    .matches(/^(application\/json|multipart\/form-data|application\/x-www-form-urlencoded)/)
    .withMessage('Invalid Content-Type header'),

  validateRequest
];

/**
 * Validate pagination parameters
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sort')
    .optional()
    .isString()
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*(-1|1)?$/)
    .withMessage('Invalid sort parameter'),

  validateRequest
];

/**
 * Validate search parameters
 */
const validateSearch = [
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),

  query('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),

  query('priceMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),

  query('priceMax')
    .optional()
    .isFloat({ min: 0 })
    .custom((value, { req }) => {
      if (req.query.priceMin && parseFloat(value) < parseFloat(req.query.priceMin)) {
        throw new Error('Maximum price must be greater than minimum price');
      }
      return true;
    }),

  validateRequest
];

/**
 * Validate date range parameters
 */
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  validateRequest
];

/**
 * Validate MongoDB ObjectId parameters
 */
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} ID`),

  validateRequest
];

/**
 * Validate email format
 */
const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email must be less than 100 characters'),

  validateRequest
];

/**
 * Validate password strength
 */
const validatePassword = [
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  validateRequest
];

/**
 * Validate phone number
 */
const validatePhone = [
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),

  validateRequest
];

/**
 * Validate URL format
 */
const validateUrl = [
  body('url')
    .isURL()
    .withMessage('Please provide a valid URL')
    .isLength({ max: 500 })
    .withMessage('URL must be less than 500 characters'),

  validateRequest
];

/**
 * Validate numeric range
 */
const validateNumericRange = (field, min, max) => [
  body(field)
    .isFloat({ min, max })
    .withMessage(`${field} must be between ${min} and ${max}`),

  validateRequest
];

/**
 * Validate string length
 */
const validateStringLength = (field, min, max) => [
  body(field)
    .isString()
    .trim()
    .isLength({ min, max })
    .withMessage(`${field} must be between ${min} and ${max} characters`),

  validateRequest
];

/**
 * Validate array of values
 */
const validateArray = (field, allowedValues) => [
  body(field)
    .isArray()
    .withMessage(`${field} must be an array`)
    .custom((value) => {
      if (!value.every(item => allowedValues.includes(item))) {
        throw new Error(`${field} contains invalid values. Allowed: ${allowedValues.join(', ')}`);
      }
      return true;
    }),

  validateRequest
];

module.exports = {
  validateBodySize,
  validateFileUpload,
  validateJsonContentType,
  validateMultipartContentType,
  validateHeaders,
  validatePagination,
  validateSearch,
  validateDateRange,
  validateObjectId,
  validateEmail,
  validatePassword,
  validatePhone,
  validateUrl,
  validateNumericRange,
  validateStringLength,
  validateArray,
  MAX_FILE_SIZES,
  ALLOWED_FILE_TYPES
}; 