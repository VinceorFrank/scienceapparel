const { body, param, query } = require('express-validator');

// Validation for user registration
const validateUserRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail().withMessage('Invalid email format')
    .isLength({ max: 100 }).withMessage('Email is too long'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .custom((value) => {
      if (value.includes(' ')) {
        throw new Error('Password cannot contain spaces');
      }
      return true;
    })
];

// Validation for user login
const validateUserLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 1 }).withMessage('Password cannot be empty')
];

// Validation for updating user profile
const validateUserUpdate = [
  param('id')
    .isMongoId().withMessage('Invalid user ID format'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('Email is too long'),

  body('password')
    .optional()
    .isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .custom((value) => {
      if (value && value.includes(' ')) {
        throw new Error('Password cannot contain spaces');
      }
      return true;
    }),

  body('isAdmin')
    .optional()
    .isBoolean().withMessage('isAdmin must be a boolean value'),

  body('role')
    .optional()
    .isIn(['admin', 'product_manager', 'order_manager', 'support_agent', 'customer'])
    .withMessage('Invalid role specified')
];

// Validation for admin user queries
const validateUserQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('Page must be a positive integer between 1 and 1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('Search term must be between 1 and 100 characters'),

  query('role')
    .optional()
    .isIn(['admin', 'product_manager', 'order_manager', 'support_agent', 'customer'])
    .withMessage('Invalid role filter'),

  query('isAdmin')
    .optional()
    .isBoolean().withMessage('isAdmin filter must be a boolean value'),

  query('sort')
    .optional()
    .isIn(['name', '-name', 'email', '-email', 'createdAt', '-createdAt', 'role', '-role'])
    .withMessage('Invalid sort field')
];

// Validation for user ID parameter
const validateUserId = [
  param('id')
    .isMongoId().withMessage('Invalid user ID format')
];

// Validation for password change
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .custom((value) => {
      if (value.includes(' ')) {
        throw new Error('Password cannot contain spaces');
      }
      return true;
    }),

  body('confirmPassword')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

module.exports = {
  validateUserRegister,
  validateUserLogin,
  validateUserUpdate,
  validateUserQuery,
  validateUserId,
  validatePasswordChange
}; 