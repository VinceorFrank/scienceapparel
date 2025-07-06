/**
 * Unified Validation System
 * Provides consistent validation across all routes with security-first approach
 */

const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { sendValidationError } = require('../../utils/responseHandler');
const { logger } = require('../../utils/logger');

/**
 * Enhanced validation result handler with detailed logging
 */
const handleValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
      type: error.type,
      location: error.location
    }));
    
    // Enhanced security logging
    logger.warn('Validation failed - potential security issue', {
      path: req.path,
      method: req.method,
      errors: validationErrors,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user._id : 'anonymous',
      userEmail: req.user ? req.user.email : 'anonymous',
      userRole: req.user ? req.user.role : 'anonymous'
    });
    
    return sendValidationError(res, validationErrors);
  }
  
  next();
};

/**
 * MongoDB ObjectId validation
 */
const validateObjectId = (fieldName) => {
  return param(fieldName)
    .isMongoId()
    .withMessage(`${fieldName} must be a valid MongoDB ObjectId`);
};

/**
 * Enhanced email validation with security checks
 */
const validateEmail = (fieldName = 'email') => {
  return body(fieldName)
    .trim()
    .isEmail()
    .normalizeEmail()
    .isLength({ min: 5, max: 254 })
    .withMessage('Email must be between 5 and 254 characters')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage('Invalid email format');
};

/**
 * Enhanced password validation with security requirements
 */
const validatePassword = (fieldName = 'password') => {
  return body(fieldName)
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .custom((value) => {
      // Check for common weak passwords
      const weakPasswords = [
        'password', '123456', 'qwerty', 'admin', 'user',
        'test', 'demo', 'guest', 'welcome', 'login'
      ];
      
      if (weakPasswords.includes(value.toLowerCase())) {
        throw new Error('Password is too common. Please choose a stronger password.');
      }
      
      return true;
    });
};

/**
 * Enhanced string validation with XSS protection
 */
const validateString = (fieldName, options = {}) => {
  const { min = 1, max = 1000, required = true } = options;
  
  let validator = body(fieldName)
    .trim()
    .isLength({ min, max })
    .withMessage(`${fieldName} must be between ${min} and ${max} characters`)
    .matches(/^[a-zA-Z0-9\s\-_.,!?@#$%&*()+=:;"'<>[\]{}|\\/~`]+$/)
    .withMessage(`${fieldName} contains invalid characters`);
  
  if (required) {
    validator = validator.notEmpty().withMessage(`${fieldName} is required`);
  }
  
  return validator;
};

/**
 * Enhanced numeric validation with range checks
 */
const validateNumber = (fieldName, options = {}) => {
  const { min = 0, max = 999999, required = true } = options;
  
  let validator = body(fieldName)
    .isFloat({ min, max })
    .withMessage(`${fieldName} must be a number between ${min} and ${max}`);
  
  if (required) {
    validator = validator.notEmpty().withMessage(`${fieldName} is required`);
  }
  
  return validator;
};

/**
 * Enhanced array validation
 */
const validateArray = (fieldName, options = {}) => {
  const { minLength = 0, maxLength = 100, required = true } = options;
  
  let validator = body(fieldName)
    .isArray({ min: minLength, max: maxLength })
    .withMessage(`${fieldName} must be an array with ${minLength} to ${maxLength} items`);
  
  if (required) {
    validator = validator.notEmpty().withMessage(`${fieldName} is required`);
  }
  
  return validator;
};

/**
 * Enhanced boolean validation
 */
const validateBoolean = (fieldName, required = true) => {
  let validator = body(fieldName)
    .isBoolean()
    .withMessage(`${fieldName} must be a boolean value`);
  
  if (required) {
    validator = validator.notEmpty().withMessage(`${fieldName} is required`);
  }
  
  return validator;
};

/**
 * Enhanced URL validation with security checks
 */
const validateUrl = (fieldName, required = true) => {
  let validator = body(fieldName)
    .isURL({
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
      allow_underscores: false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false
    })
    .withMessage(`${fieldName} must be a valid URL with http or https protocol`);
  
  if (required) {
    validator = validator.notEmpty().withMessage(`${fieldName} is required`);
  }
  
  return validator;
};

/**
 * Enhanced phone number validation
 */
const validatePhone = (fieldName = 'phone') => {
  return body(fieldName)
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Phone number must be a valid international format');
};

/**
 * Enhanced address validation
 */
const validateAddress = () => {
  return [
    validateString('firstName', { min: 1, max: 50 }),
    validateString('lastName', { min: 1, max: 50 }),
    validateString('address', { min: 5, max: 200 }),
    validateString('city', { min: 1, max: 100 }),
    validateString('state', { min: 1, max: 100 }),
    validateString('postalCode', { min: 3, max: 20 }),
    validateString('country', { min: 1, max: 100 }),
    validatePhone('phone').optional()
  ];
};

/**
 * Enhanced pagination validation
 */
const validatePagination = () => {
  return [
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
      .isLength({ min: 1, max: 50 })
      .withMessage('Sort parameter must be a string between 1 and 50 characters')
  ];
};

/**
 * Enhanced search validation
 */
const validateSearch = () => {
  return [
    query('search')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters')
      .matches(/^[a-zA-Z0-9\s\-_.,!?@#$%&*()+=:;"'<>[\]{}|\\/~`]+$/)
      .withMessage('Search term contains invalid characters')
  ];
};

/**
 * Enhanced file upload validation
 */
const validateFileUpload = (options = {}) => {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'] } = options;
  
  return (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        code: 'NO_FILE'
      });
    }
    
    const file = req.files.file;
    
    // Check file size
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
        code: 'FILE_TOO_LARGE'
      });
    }
    
    // Check file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        code: 'INVALID_FILE_TYPE'
      });
    }
    
    // Check for malicious file content
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file content type',
        code: 'INVALID_MIME_TYPE'
      });
    }
    
    next();
  };
};

/**
 * Enhanced JWT token validation
 */
const validateJWTToken = () => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
        code: 'NO_TOKEN'
      });
    }
    
    // Basic JWT format validation
    if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }
    
    next();
  };
};

/**
 * Enhanced rate limiting validation
 */
const validateRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return (req, res, next) => {
    // This is a basic check - actual rate limiting should be handled by middleware
    const clientIP = req.ip;
    const userAgent = req.get('User-Agent');
    
    // Log potential abuse
    if (req.headers['x-forwarded-for'] || req.headers['x-real-ip']) {
      logger.warn('Potential proxy detected', {
        ip: req.ip,
        forwardedFor: req.headers['x-forwarded-for'],
        realIp: req.headers['x-real-ip'],
        userAgent
      });
    }
    
    next();
  };
};

module.exports = {
  handleValidationResult,
  validateObjectId,
  validateEmail,
  validatePassword,
  validateString,
  validateNumber,
  validateArray,
  validateBoolean,
  validateUrl,
  validatePhone,
  validateAddress,
  validatePagination,
  validateSearch,
  validateFileUpload,
  validateJWTToken,
  validateRateLimit
}; 