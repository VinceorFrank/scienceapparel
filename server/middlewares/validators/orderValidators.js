/**
 * Order Validation Middleware
 * Comprehensive validation for order creation and updates
 */

const { body, param, query } = require('express-validator');
const { validateRequest } = require('../errorHandler');

// Validation for creating a new order
const validateCreateOrder = [
  body('orderItems')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item')
    .custom((items) => {
      if (!Array.isArray(items)) {
        throw new Error('Order items must be an array');
      }
      
      for (const item of items) {
        if (!item.product || !item.name || !item.qty || !item.price) {
          throw new Error('Each order item must have product, name, qty, and price');
        }
        
        if (item.qty <= 0) {
          throw new Error('Quantity must be greater than 0');
        }
        
        if (item.price <= 0) {
          throw new Error('Price must be greater than 0');
        }
        
        if (typeof item.name !== 'string' || item.name.trim().length === 0) {
          throw new Error('Product name is required');
        }
      }
      
      return true;
    }),

  body('shippingAddress')
    .isObject()
    .withMessage('Shipping address is required')
    .custom((address) => {
      const required = ['address', 'city', 'postalCode', 'country'];
      for (const field of required) {
        if (!address[field] || typeof address[field] !== 'string' || address[field].trim().length === 0) {
          throw new Error(`Shipping address ${field} is required`);
        }
      }
      return true;
    }),

  body('paymentMethod')
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Payment method is required')
    .isIn(['PayPal', 'Stripe', 'Credit Card', 'Bank Transfer'])
    .withMessage('Invalid payment method'),

  body('itemsPrice')
    .isFloat({ min: 0 })
    .withMessage('Items price must be a positive number'),

  body('taxPrice')
    .isFloat({ min: 0 })
    .withMessage('Tax price must be a positive number'),

  body('shippingPrice')
    .isFloat({ min: 0 })
    .withMessage('Shipping price must be a positive number'),

  body('totalPrice')
    .isFloat({ min: 0 })
    .withMessage('Total price must be a positive number')
    .custom((total, { req }) => {
      const calculated = (req.body.itemsPrice || 0) + (req.body.taxPrice || 0) + (req.body.shippingPrice || 0);
      if (Math.abs(total - calculated) > 0.01) {
        throw new Error('Total price does not match calculated total');
      }
      return true;
    }),

  validateRequest
];

// Validation for updating order status (admin only)
const validateUpdateOrderStatus = [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID'),

  body('orderStatus')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Invalid order status'),

  body('isPaid')
    .optional()
    .isBoolean()
    .withMessage('isPaid must be a boolean'),

  body('isDelivered')
    .optional()
    .isBoolean()
    .withMessage('isDelivered must be a boolean'),

  body('cancellationReason')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Cancellation reason must be between 1 and 500 characters'),

  body('shipping.trackingNumber')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Tracking number must be between 1 and 100 characters'),

  body('shipping.status')
    .optional()
    .isIn(['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'failed'])
    .withMessage('Invalid shipping status'),

  validateRequest
];

// Validation for order queries (admin)
const validateOrderQueries = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'paid', 'unpaid'])
    .withMessage('Invalid status filter'),

  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid ISO date'),

  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid ISO date'),

  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min amount must be a positive number'),

  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max amount must be a positive number')
    .custom((maxAmount, { req }) => {
      if (req.query.minAmount && parseFloat(maxAmount) < parseFloat(req.query.minAmount)) {
        throw new Error('Max amount cannot be less than min amount');
      }
      return true;
    }),

  validateRequest
];

// Validation for order ID parameter
const validateOrderId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID'),

  validateRequest
];

module.exports = {
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateOrderQueries,
  validateOrderId
}; 