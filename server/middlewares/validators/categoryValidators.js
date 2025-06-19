const { body, param, query } = require('express-validator');

// Validation for creating a new category
const validateCategoryCreate = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Category name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_&]+$/).withMessage('Category name contains invalid characters')
    .custom(value => {
      // Check for duplicate names (case insensitive)
      return true; // This will be handled in the route
    }),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
    .matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/).withMessage('Description contains invalid characters')
];

// Validation for updating a category
const validateCategoryUpdate = [
  param('id')
    .isMongoId().withMessage('Invalid category ID format'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Category name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_&]+$/).withMessage('Category name contains invalid characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
    .matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/).withMessage('Description contains invalid characters')
];

// Validation for category queries
const validateCategoryQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('Page must be a positive integer between 1 and 1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('Search term must be between 1 and 100 characters'),

  query('sort')
    .optional()
    .isIn(['name', '-name', 'createdAt', '-createdAt', 'productCount', '-productCount'])
    .withMessage('Invalid sort field')
];

// Validation for category ID parameter
const validateCategoryId = [
  param('id')
    .isMongoId().withMessage('Invalid category ID format')
];

module.exports = {
  validateCategoryCreate,
  validateCategoryUpdate,
  validateCategoryQuery,
  validateCategoryId
}; 