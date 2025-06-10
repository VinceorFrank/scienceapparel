// server/middlewares/validators/productValidators.js
const { body } = require('express-validator');

const validateProductUpdate = [
  body('name')
    .optional()
    .isString().withMessage('Name must be a string')
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),

  body('price')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Price must be a number greater than 0'),

  body('category')
    .optional()
    .isString().withMessage('Category must be a string'),

  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),

  body('description')
    .optional()
    .isString().withMessage('Description must be a string'),

  // Add more optional fields as needed, like 'image'
];

module.exports = { validateProductUpdate };
