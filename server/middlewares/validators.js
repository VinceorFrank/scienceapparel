/**
 * Request validation middleware
 */

const { validationResult } = require('express-validator');

/**
 * Middleware to validate request using express-validator
 * @returns {Function} Express middleware
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        statusCode: 400,
        details: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      }
    });
  }
  
  next();
};

/**
 * Custom validation middleware for specific routes
 * @param {Function} validationFunction - Custom validation function
 * @returns {Function} Express middleware
 */
const customValidation = (validationFunction) => {
  return (req, res, next) => {
    try {
      const result = validationFunction(req);
      if (result && result.error) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.error,
            statusCode: 400
          }
        });
      }
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          statusCode: 400
        }
      });
    }
  };
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ObjectId to validate
 * @returns {boolean} True if valid
 */
const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate numeric range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if valid
 */
const isInRange = (value, min, max) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Validate string length
 * @param {string} value - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {boolean} True if valid
 */
const isValidLength = (value, min, max) => {
  if (typeof value !== 'string') return false;
  return value.length >= min && value.length <= max;
};

/**
 * Validate required fields
 * @param {Object} data - Data object
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Validation result
 */
const validateRequiredFields = (data, requiredFields) => {
  const missingFields = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field);
    }
  });
  
  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`
    };
  }
  
  return { isValid: true };
};

/**
 * Sanitize and validate product data
 * @param {Object} productData - Product data to validate
 * @returns {Object} Validation result
 */
const validateProduct = (productData) => {
  const requiredFields = ['name', 'price'];
  const requiredValidation = validateRequiredFields(productData, requiredFields);
  
  if (!requiredValidation.isValid) {
    return requiredValidation;
  }
  
  // Validate name length
  if (!isValidLength(productData.name, 1, 100)) {
    return {
      isValid: false,
      error: 'Product name must be between 1 and 100 characters'
    };
  }
  
  // Validate price
  if (!isInRange(productData.price, 0, 999999)) {
    return {
      isValid: false,
      error: 'Price must be between 0 and 999999'
    };
  }
  
  // Validate stock if provided
  if (productData.stock !== undefined && !isInRange(productData.stock, 0, 999999)) {
    return {
      isValid: false,
      error: 'Stock must be between 0 and 999999'
    };
  }
  
  return { isValid: true };
};

/**
 * Sanitize and validate user data
 * @param {Object} userData - User data to validate
 * @returns {Object} Validation result
 */
const validateUser = (userData) => {
  const requiredFields = ['email', 'firstName', 'lastName'];
  const requiredValidation = validateRequiredFields(userData, requiredFields);
  
  if (!requiredValidation.isValid) {
    return requiredValidation;
  }
  
  // Validate email
  if (!isValidEmail(userData.email)) {
    return {
      isValid: false,
      error: 'Invalid email format'
    };
  }
  
  // Validate name lengths
  if (!isValidLength(userData.firstName, 1, 50)) {
    return {
      isValid: false,
      error: 'First name must be between 1 and 50 characters'
    };
  }
  
  if (!isValidLength(userData.lastName, 1, 50)) {
    return {
      isValid: false,
      error: 'Last name must be between 1 and 50 characters'
    };
  }
  
  return { isValid: true };
};

/**
 * Sanitize and validate order data
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
      error: 'Order must contain at least one product'
    };
  }
  
  // Validate each product in the order
  for (let i = 0; i < orderData.products.length; i++) {
    const product = orderData.products[i];
    
    if (!product.productId || !isValidObjectId(product.productId)) {
      return {
        isValid: false,
        error: `Invalid product ID at index ${i}`
      };
    }
    
    if (!product.quantity || !isInRange(product.quantity, 1, 999)) {
      return {
        isValid: false,
        error: `Invalid quantity at index ${i}`
      };
    }
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
  validateOrder
}; 