const { body, param, query } = require('express-validator');

// Validation for creating a new order
const validateOrderCreate = [
  body('orderItems')
    .notEmpty().withMessage('Order items are required')
    .isArray({ min: 1 }).withMessage('At least one order item is required')
    .custom(items => {
      for (let item of items) {
        if (!item.product || !item.qty || !item.price) {
          throw new Error('Each order item must have product, qty, and price');
        }
        if (item.qty <= 0) {
          throw new Error('Quantity must be greater than 0');
        }
        if (item.price <= 0) {
          throw new Error('Price must be greater than 0');
        }
      }
      return true;
    }),

  body('shippingAddress')
    .notEmpty().withMessage('Shipping address is required')
    .custom(address => {
      if (!address.address || !address.city || !address.postalCode || !address.country) {
        throw new Error('Shipping address must include address, city, postal code, and country');
      }
      return true;
    }),

  body('shippingAddress.address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 5, max: 200 }).withMessage('Address must be between 5 and 200 characters'),

  body('shippingAddress.city')
    .trim()
    .notEmpty().withMessage('City is required')
    .isLength({ min: 2, max: 50 }).withMessage('City must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('City can only contain letters and spaces'),

  body('shippingAddress.postalCode')
    .trim()
    .notEmpty().withMessage('Postal code is required')
    .isLength({ min: 3, max: 10 }).withMessage('Postal code must be between 3 and 10 characters')
    .matches(/^[a-zA-Z0-9\s\-]+$/).withMessage('Postal code contains invalid characters'),

  body('shippingAddress.country')
    .trim()
    .notEmpty().withMessage('Country is required')
    .isLength({ min: 2, max: 50 }).withMessage('Country must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Country can only contain letters and spaces'),

  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['PayPal', 'Stripe', 'Credit Card', 'Bank Transfer', 'Cash on Delivery'])
    .withMessage('Invalid payment method'),

  body('taxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Tax price must be a non-negative number'),

  body('shippingPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Shipping price must be a non-negative number'),

  body('totalPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Total price must be a non-negative number')
];

// Validation for updating an order
const validateOrderUpdate = [
  param('id')
    .isMongoId().withMessage('Invalid order ID format'),

  body('isPaid')
    .optional()
    .isBoolean().withMessage('isPaid must be a boolean value'),

  body('isDelivered')
    .optional()
    .isBoolean().withMessage('isDelivered must be a boolean value'),

  body('status')
    .optional()
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
    .withMessage('Invalid order status'),

  body('shippingAddress')
    .optional()
    .custom(address => {
      if (address) {
        if (!address.address || !address.city || !address.postalCode || !address.country) {
          throw new Error('Shipping address must include address, city, postal code, and country');
        }
      }
      return true;
    }),

  body('shippingAddress.address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Address must be between 5 and 200 characters'),

  body('shippingAddress.city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('City must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('City can only contain letters and spaces'),

  body('shippingAddress.postalCode')
    .optional()
    .trim()
    .isLength({ min: 3, max: 10 }).withMessage('Postal code must be between 3 and 10 characters')
    .matches(/^[a-zA-Z0-9\s\-]+$/).withMessage('Postal code contains invalid characters'),

  body('shippingAddress.country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Country must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Country can only contain letters and spaces')
];

// Validation for order queries
const validateOrderQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('Page must be a positive integer between 1 and 1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
    .withMessage('Invalid order status filter'),

  query('isPaid')
    .optional()
    .isBoolean().withMessage('isPaid filter must be a boolean value'),

  query('isDelivered')
    .optional()
    .isBoolean().withMessage('isDelivered filter must be a boolean value'),

  query('minTotal')
    .optional()
    .isFloat({ min: 0 }).withMessage('Minimum total must be a non-negative number'),

  query('maxTotal')
    .optional()
    .isFloat({ min: 0 }).withMessage('Maximum total must be a non-negative number')
    .custom((value, { req }) => {
      if (value && req.query.minTotal && parseFloat(value) < parseFloat(req.query.minTotal)) {
        throw new Error('Maximum total must be greater than minimum total');
      }
      return true;
    }),

  query('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (value && req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'totalPrice', '-totalPrice', 'status', '-status'])
    .withMessage('Invalid sort field')
];

// Validation for order ID parameter
const validateOrderId = [
  param('id')
    .isMongoId().withMessage('Invalid order ID format')
];

// Validation for order status update
const validateOrderStatusUpdate = [
  param('id')
    .isMongoId().withMessage('Invalid order ID format'),

  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
    .withMessage('Invalid order status'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
];

module.exports = {
  validateOrderCreate,
  validateOrderUpdate,
  validateOrderQuery,
  validateOrderId,
  validateOrderStatusUpdate
}; 