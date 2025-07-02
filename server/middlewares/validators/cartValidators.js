/**
 * Cart Validation Middleware
 * Comprehensive validation for cart operations
 */

const { body, param, query } = require('express-validator');
const { validateRequest } = require('../errorHandler');

// Validation for adding item to cart
const validateAddToCart = [
  body('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),

  body('quantity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),

  validateRequest
];

// Validation for updating cart item quantity
const validateUpdateCartItem = [
  param('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),

  body('quantity')
    .isInt({ min: 0, max: 100 })
    .withMessage('Quantity must be between 0 and 100'),

  validateRequest
];

// Validation for removing cart item
const validateRemoveCartItem = [
  param('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),

  validateRequest
];

// Validation for cart queries
const validateCartQueries = [
  query('includeValidation')
    .optional()
    .isBoolean()
    .withMessage('includeValidation must be a boolean'),

  validateRequest
];

module.exports = {
  validateAddToCart,
  validateUpdateCartItem,
  validateRemoveCartItem,
  validateCartQueries
}; 