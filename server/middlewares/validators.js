/**
 * Enhanced Request Validation Middleware
 */

const { validationResult } = require('express-validator');
const { sendError, sendValidationError } = require('../utils/responseHandler');
const { logger } = require('../utils/logger');

/**
 * Enhanced middleware to validate request using express-validator
 * @returns {Function} Express middleware
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
      type: error.type
    }));
    
    // Log validation errors for debugging
    logger.warn('Request validation failed', {
      path: req.path,
      method: req.method,
      errors: validationErrors,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return sendValidationError(res, 'Validation failed', validationErrors);
  }
  
  next();
};

/**
 * Enhanced custom validation middleware for specific routes
 * @param {Function} validationFunction - Custom validation function
 * @returns {Function} Express middleware
 */
const customValidation = (validationFunction) => {
  return (req, res, next) => {
    try {
      const result = validationFunction(req);
      if (result && result.error) {
        logger.warn('Custom validation failed', {
          path: req.path,
          method: req.method,
          error: result.error,
          ip: req.ip
        });
        
        return sendError(res, 400, result.error, null, 'VALIDATION_FAILED');
      }
      next();
    } catch (error) {
      logger.error('Custom validation error:', {
        path: req.path,
        method: req.method,
        error: error.message,
        stack: error.stack,
        ip: req.ip
      });
      
      return sendError(res, 400, 'Validation error', null, 'VALIDATION_ERROR');
    }
  };
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ObjectId to validate
 * @returns {boolean} True if valid
 */
const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Enhanced email validation
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  
  // Additional checks
  const [localPart, domain] = email.split('@');
  
  // Check local part length
  if (localPart.length > 64) return false;
  
  // Check domain length
  if (domain.length > 255) return false;
  
  // Check for valid domain format
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!domainRegex.test(domain)) return false;
  
  return true;
};

/**
 * Enhanced URL validation
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

/**
 * Enhanced numeric range validation
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if valid
 */
const isInRange = (value, min, max) => {
  if (value === null || value === undefined) return false;
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Enhanced string length validation
 * @param {string} value - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {boolean} True if valid
 */
const isValidLength = (value, min, max) => {
  if (typeof value !== 'string') return false;
  const trimmedLength = value.trim().length;
  return trimmedLength >= min && trimmedLength <= max;
};

/**
 * Enhanced required fields validation
 * @param {Object} data - Data object
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Validation result
 */
const validateRequiredFields = (data, requiredFields) => {
  const missingFields = [];
  const emptyFields = [];
  
  requiredFields.forEach(field => {
    if (!data.hasOwnProperty(field)) {
      missingFields.push(field);
    } else if (data[field] === null || data[field] === undefined) {
      emptyFields.push(field);
    } else if (typeof data[field] === 'string' && data[field].trim() === '') {
      emptyFields.push(field);
    } else if (Array.isArray(data[field]) && data[field].length === 0) {
      emptyFields.push(field);
    }
  });
  
  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`,
      type: 'MISSING_FIELDS'
    };
  }
  
  if (emptyFields.length > 0) {
    return {
      isValid: false,
      error: `Empty required fields: ${emptyFields.join(', ')}`,
      type: 'EMPTY_FIELDS'
    };
  }
  
  return { isValid: true };
};

/**
 * Enhanced product validation
 * @param {Object} productData - Product data to validate
 * @returns {Object} Validation result
 */
const validateProduct = (productData) => {
  const requiredFields = ['name', 'price'];
  const requiredValidation = validateRequiredFields(productData, requiredFields);
  
  if (!requiredValidation.isValid) {
    return requiredValidation;
  }
  
  // Validate name length and content
  if (!isValidLength(productData.name, 1, 100)) {
    return {
      isValid: false,
      error: 'Product name must be between 1 and 100 characters',
      type: 'INVALID_NAME_LENGTH'
    };
  }
  
  // Check for potentially harmful content in name
  const harmfulPatterns = /<script|javascript:|on\w+\s*=|data:text\/html/i;
  if (harmfulPatterns.test(productData.name)) {
    return {
      isValid: false,
      error: 'Product name contains potentially harmful content',
      type: 'HARMFUL_CONTENT'
    };
  }
  
  // Validate price
  if (!isInRange(productData.price, 0, 999999.99)) {
    return {
      isValid: false,
      error: 'Price must be between 0 and 999999.99',
      type: 'INVALID_PRICE'
    };
  }
  
  // Validate stock if provided
  if (productData.stock !== undefined && !isInRange(productData.stock, 0, 999999)) {
    return {
      isValid: false,
      error: 'Stock must be between 0 and 999999',
      type: 'INVALID_STOCK'
    };
  }
  
  // Validate description if provided
  if (productData.description && !isValidLength(productData.description, 0, 2000)) {
    return {
      isValid: false,
      error: 'Description must be no more than 2000 characters',
      type: 'INVALID_DESCRIPTION_LENGTH'
    };
  }
  
  // Validate category if provided
  if (productData.category && !isValidObjectId(productData.category)) {
    return {
      isValid: false,
      error: 'Invalid category ID',
      type: 'INVALID_CATEGORY'
    };
  }
  
  return { isValid: true };
};

/**
 * Enhanced user validation
 * @param {Object} userData - User data to validate
 * @returns {Object} Validation result
 */
const validateUser = (userData) => {
  const requiredFields = ['email', 'name'];
  const requiredValidation = validateRequiredFields(userData, requiredFields);
  
  if (!requiredValidation.isValid) {
    return requiredValidation;
  }
  
  // Validate email
  if (!isValidEmail(userData.email)) {
    return {
      isValid: false,
      error: 'Invalid email format',
      type: 'INVALID_EMAIL'
    };
  }
  
  // Validate name length
  if (!isValidLength(userData.name, 1, 100)) {
    return {
      isValid: false,
      error: 'Name must be between 1 and 100 characters',
      type: 'INVALID_NAME_LENGTH'
    };
  }
  
  // Validate phone if provided
  if (userData.phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(userData.phone.replace(/[\s\-\(\)]/g, ''))) {
      return {
        isValid: false,
        error: 'Invalid phone number format',
        type: 'INVALID_PHONE'
      };
    }
  }
  
  // Validate role if provided
  const validRoles = ['admin', 'product_manager', 'order_manager', 'support_agent', 'customer'];
  if (userData.role && !validRoles.includes(userData.role)) {
    return {
      isValid: false,
      error: 'Invalid user role',
      type: 'INVALID_ROLE'
    };
  }
  
  return { isValid: true };
};

/**
 * Enhanced order validation
 * @param {Object} orderData - Order data to validate
 * @returns {Object} Validation result
 */
const validateOrder = (orderData) => {
  const requiredFields = ['products'];
  const requiredValidation = validateRequiredFields(orderData, requiredFields);
  
  if (!requiredValidation.isValid) {
    return requiredValidation;
  }
  
  // Validate products array
  if (!Array.isArray(orderData.products) || orderData.products.length === 0) {
    return {
      isValid: false,
      error: 'Order must contain at least one product',
      type: 'EMPTY_PRODUCTS'
    };
  }
  
  // Validate maximum products per order
  if (orderData.products.length > 50) {
    return {
      isValid: false,
      error: 'Order cannot contain more than 50 products',
      type: 'TOO_MANY_PRODUCTS'
    };
  }
  
  // Validate each product in the order
  for (let i = 0; i < orderData.products.length; i++) {
    const product = orderData.products[i];
    
    if (!product.productId || !isValidObjectId(product.productId)) {
      return {
        isValid: false,
        error: `Invalid product ID at index ${i}`,
        type: 'INVALID_PRODUCT_ID'
      };
    }
    
    if (!product.quantity || !isInRange(product.quantity, 1, 999)) {
      return {
        isValid: false,
        error: `Invalid quantity at index ${i}. Must be between 1 and 999`,
        type: 'INVALID_QUANTITY'
      };
    }
  }
  
  // Validate shipping address if provided
  if (orderData.shippingAddress) {
    const addressValidation = validateAddress(orderData.shippingAddress);
    if (!addressValidation.isValid) {
      return addressValidation;
    }
  }
  
  return { isValid: true };
};

/**
 * Enhanced address validation
 * @param {Object} addressData - Address data to validate
 * @returns {Object} Validation result
 */
const validateAddress = (addressData) => {
  const requiredFields = ['firstName', 'lastName', 'address', 'city', 'state', 'postalCode', 'country'];
  const requiredValidation = validateRequiredFields(addressData, requiredFields);
  
  if (!requiredValidation.isValid) {
    return requiredValidation;
  }
  
  // Validate name lengths
  if (!isValidLength(addressData.firstName, 1, 50)) {
    return {
      isValid: false,
      error: 'First name must be between 1 and 50 characters',
      type: 'INVALID_FIRST_NAME'
    };
  }
  
  if (!isValidLength(addressData.lastName, 1, 50)) {
    return {
      isValid: false,
      error: 'Last name must be between 1 and 50 characters',
      type: 'INVALID_LAST_NAME'
    };
  }
  
  // Validate address length
  if (!isValidLength(addressData.address, 5, 200)) {
    return {
      isValid: false,
      error: 'Address must be between 5 and 200 characters',
      type: 'INVALID_ADDRESS'
    };
  }
  
  // Validate city length
  if (!isValidLength(addressData.city, 1, 100)) {
    return {
      isValid: false,
      error: 'City must be between 1 and 100 characters',
      type: 'INVALID_CITY'
    };
  }
  
  // Validate state length
  if (!isValidLength(addressData.state, 1, 100)) {
    return {
      isValid: false,
      error: 'State must be between 1 and 100 characters',
      type: 'INVALID_STATE'
    };
  }
  
  // Validate postal code
  if (!isValidLength(addressData.postalCode, 3, 20)) {
    return {
      isValid: false,
      error: 'Postal code must be between 3 and 20 characters',
      type: 'INVALID_POSTAL_CODE'
    };
  }
  
  // Validate country
  if (!isValidLength(addressData.country, 1, 100)) {
    return {
      isValid: false,
      error: 'Country must be between 1 and 100 characters',
      type: 'INVALID_COUNTRY'
    };
  }
  
  // Validate phone if provided
  if (addressData.phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(addressData.phone.replace(/[\s\-\(\)]/g, ''))) {
      return {
        isValid: false,
        error: 'Invalid phone number format',
        type: 'INVALID_PHONE'
      };
    }
  }
  
  return { isValid: true };
};

/**
 * Enhanced category validation
 * @param {Object} categoryData - Category data to validate
 * @returns {Object} Validation result
 */
const validateCategory = (categoryData) => {
  const requiredFields = ['name'];
  const requiredValidation = validateRequiredFields(categoryData, requiredFields);
  
  if (!requiredValidation.isValid) {
    return requiredValidation;
  }
  
  // Validate name length
  if (!isValidLength(categoryData.name, 1, 100)) {
    return {
      isValid: false,
      error: 'Category name must be between 1 and 100 characters',
      type: 'INVALID_NAME_LENGTH'
    };
  }
  
  // Validate description if provided
  if (categoryData.description && !isValidLength(categoryData.description, 0, 500)) {
    return {
      isValid: false,
      error: 'Description must be no more than 500 characters',
      type: 'INVALID_DESCRIPTION_LENGTH'
    };
  }
  
  // Validate parent category if provided
  if (categoryData.parent && !isValidObjectId(categoryData.parent)) {
    return {
      isValid: false,
      error: 'Invalid parent category ID',
      type: 'INVALID_PARENT_CATEGORY'
    };
  }
  
  return { isValid: true };
};

/**
 * Enhanced pagination validation
 * @param {Object} paginationData - Pagination data to validate
 * @returns {Object} Validation result
 */
const validatePagination = (paginationData) => {
  const { page = 1, limit = 10 } = paginationData;
  
  if (!isInRange(page, 1, 1000)) {
    return {
      isValid: false,
      error: 'Page must be between 1 and 1000',
      type: 'INVALID_PAGE'
    };
  }
  
  if (!isInRange(limit, 1, 100)) {
    return {
      isValid: false,
      error: 'Limit must be between 1 and 100',
      type: 'INVALID_LIMIT'
    };
  }
  
  return { isValid: true };
};

module.exports = {
  validateRequest,
  customValidation,
  isValidObjectId,
  isValidEmail,
  isValidUrl,
  isInRange,
  isValidLength,
  validateRequiredFields,
  validateProduct,
  validateUser,
  validateOrder,
  validateAddress,
  validateCategory,
  validatePagination
};