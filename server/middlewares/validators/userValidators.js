/**
 * User Validation Middleware
 * Comprehensive validation for user operations
 */

const { body, param, query } = require('express-validator');
const { validateRequest } = require('../errorHandler');

// Validation for user registration
const validateUserRegistration = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email must be less than 100 characters'),

  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),

  validateRequest
];

// Validation for user login
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  validateRequest
];

// Validation for profile updates
const validateProfileUpdate = [
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),

  body('currentPassword')
    .optional()
    .notEmpty()
    .withMessage('Current password is required when changing password'),

  body('newPassword')
    .optional()
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .custom((newPassword, { req }) => {
      if (newPassword && !req.body.currentPassword) {
        throw new Error('Current password is required when setting new password');
      }
      return true;
    }),

  validateRequest
];

// Validation for address management
const validateAddress = [
  body('type')
    .isIn(['shipping', 'billing'])
    .withMessage('Address type must be either shipping or billing'),

  body('firstName')
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('lastName')
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('address')
    .isString()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),

  body('city')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('City can only contain letters and spaces'),

  body('province')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Province must be between 2 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Province can only contain letters and spaces'),

  body('state')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('State can only contain letters and spaces'),

  body('postalCode')
    .isString()
    .trim()
    .isLength({ min: 3, max: 10 })
    .withMessage('Postal code must be between 3 and 10 characters')
    .matches(/^[a-zA-Z0-9\s\-]+$/)
    .withMessage('Postal code contains invalid characters'),

  body('country')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Country can only contain letters and spaces'),

  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),

  body('company')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name must be less than 100 characters'),

  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),

  validateRequest
];

// Validation for address ID parameter
const validateAddressId = [
  param('addressId')
    .isMongoId()
    .withMessage('Invalid address ID'),

  validateRequest
];

// Validation for user queries (admin)
const validateUserQueries = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),

  query('role')
    .optional()
    .isIn(['admin', 'product_manager', 'order_manager', 'support_agent', 'customer'])
    .withMessage('Invalid role filter'),

  query('status')
    .optional()
    .isIn(['active', 'suspended', 'pending_verification'])
    .withMessage('Invalid status filter'),

  query('minOrders')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Min orders must be a non-negative integer'),

  query('maxOrders')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max orders must be a non-negative integer')
    .custom((maxOrders, { req }) => {
      if (req.query.minOrders && parseInt(maxOrders) < parseInt(req.query.minOrders)) {
        throw new Error('Max orders cannot be less than min orders');
      }
      return true;
    }),

  query('minSpend')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min spend must be a non-negative number'),

  query('maxSpend')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max spend must be a non-negative number')
    .custom((maxSpend, { req }) => {
      if (req.query.minSpend && parseFloat(maxSpend) < parseFloat(req.query.minSpend)) {
        throw new Error('Max spend cannot be less than min spend');
      }
      return true;
    }),

  query('registeredAfter')
    .optional()
    .isISO8601()
    .withMessage('Registered after must be a valid ISO date'),

  query('registeredBefore')
    .optional()
    .isISO8601()
    .withMessage('Registered before must be a valid ISO date')
    .custom((registeredBefore, { req }) => {
      if (req.query.registeredAfter && new Date(registeredBefore) < new Date(req.query.registeredAfter)) {
        throw new Error('Registered before date must be after registered after date');
      }
      return true;
    }),

  query('sort')
    .optional()
    .isIn(['name', 'email', 'createdAt', 'orders', 'spend'])
    .withMessage('Invalid sort field'),

  validateRequest
];

// Validation for user ID parameter
const validateUserId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),

  validateRequest
];

// Validation for user update (admin)
const validateUserUpdate = [
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),

  body('isAdmin')
    .optional()
    .isBoolean()
    .withMessage('isAdmin must be a boolean'),

  body('role')
    .optional()
    .isIn(['customer', 'admin', 'product_manager', 'order_manager', 'support_agent'])
    .withMessage('Invalid role'),

  body('status')
    .optional()
    .isIn(['active', 'suspended', 'inactive'])
    .withMessage('Invalid status'),

  body('statusReason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Status reason must be less than 500 characters'),

  validateRequest
];

// Validation for user status update (admin)
const validateUserStatusUpdate = [
  body('status')
    .isIn(['active', 'suspended', 'inactive'])
    .withMessage('Invalid status'),

  body('statusReason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Status reason must be less than 500 characters'),

  validateRequest
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  validateAddress,
  validateAddressId,
  validateUserQueries,
  validateUserId,
  validateUserUpdate,
  validateUserStatusUpdate
}; 