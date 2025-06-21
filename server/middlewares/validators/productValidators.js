// server/middlewares/validators/productValidators.js
const { body, param, query } = require('express-validator');

// Validation for creating a new product
const validateProductCreate = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Product name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_.,&()]+$/).withMessage('Product name contains invalid characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Product description is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0.01, max: 999999.99 }).withMessage('Price must be between $0.01 and $999,999.99')
    .custom(value => {
      if (value <= 0) throw new Error('Price must be greater than 0');
      return true;
    }),

  body('stock')
    .notEmpty().withMessage('Stock quantity is required')
    .isInt({ min: 0, max: 999999 }).withMessage('Stock must be a non-negative integer between 0 and 999,999'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Invalid category ID format'),

  body('image')
    .optional()
    .custom(value => {
      // Accept URLs or file paths
      if (!value) return true;
      if (value.startsWith('http://') || value.startsWith('https://')) {
        // URL validation
        const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        if (!urlRegex.test(value)) {
          throw new Error('Invalid image URL format');
        }
      } else {
        // File path validation: matches either 'filename.jpg' or 'images/filename.jpg'
        const pathRegex = /^(?:images\/)?[\w.-]+\.(?:jpg|jpeg|png|gif|webp)$/i;
        if (!pathRegex.test(value)) {
          throw new Error('Invalid image path format');
        }
      }
      return true;
    })
    .isLength({ max: 500 }).withMessage('Image URL/path is too long'),

  body('featured')
    .optional()
    .isBoolean().withMessage('Featured must be a boolean value'),

  body('archived')
    .optional()
    .isBoolean().withMessage('Archived must be a boolean value'),

  body('discountPrice')
    .optional()
    .isFloat({ min: 0, max: 999999.99 }).withMessage('Discount price must be between $0 and $999,999.99')
    .custom((value, { req }) => {
      if (value && req.body.price && value >= req.body.price) {
        throw new Error('Discount price must be less than regular price');
      }
      return true;
    }),

  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom(tags => {
      if (tags && tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      if (tags) {
        for (let tag of tags) {
          if (typeof tag !== 'string' || tag.length < 1 || tag.length > 20) {
            throw new Error('Each tag must be a string between 1 and 20 characters');
          }
        }
      }
      return true;
    })
];

// Validation for updating a product
const validateProductUpdate = [
  param('id')
    .isMongoId().withMessage('Invalid product ID format'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Product name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_.,&()]+$/).withMessage('Product name contains invalid characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),

  body('price')
    .optional()
    .isFloat({ min: 0.01, max: 999999.99 }).withMessage('Price must be between $0.01 and $999,999.99'),

  body('stock')
    .optional()
    .isInt({ min: 0, max: 999999 }).withMessage('Stock must be a non-negative integer between 0 and 999,999'),

  body('category')
    .optional()
    .isMongoId().withMessage('Invalid category ID format'),

  body('image')
    .optional()
    .custom(value => {
      // Accept URLs or file paths
      if (!value) return true;
      if (value.startsWith('http://') || value.startsWith('https://')) {
        // URL validation
        const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        if (!urlRegex.test(value)) {
          throw new Error('Invalid image URL format');
        }
      } else {
        // File path validation: matches either 'filename.jpg' or 'images/filename.jpg'
        const pathRegex = /^(?:images\/)?[\w.-]+\.(?:jpg|jpeg|png|gif|webp)$/i;
        if (!pathRegex.test(value)) {
          throw new Error('Invalid image path format');
        }
      }
      return true;
    })
    .isLength({ max: 500 }).withMessage('Image URL/path is too long'),

  body('featured')
    .optional()
    .isBoolean().withMessage('Featured must be a boolean value'),

  body('archived')
    .optional()
    .isBoolean().withMessage('Archived must be a boolean value'),

  body('discountPrice')
    .optional()
    .isFloat({ min: 0, max: 999999.99 }).withMessage('Discount price must be between $0 and $999,999.99')
    .custom((value, { req }) => {
      if (value && req.body.price && value >= req.body.price) {
        throw new Error('Discount price must be less than regular price');
      }
      return true;
    }),

  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom(tags => {
      if (tags && tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      if (tags) {
        for (let tag of tags) {
          if (typeof tag !== 'string' || tag.length < 1 || tag.length > 20) {
            throw new Error('Each tag must be a string between 1 and 20 characters');
          }
        }
      }
      return true;
    })
];

// Validation for product queries (search, filter, pagination)
const validateProductQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('Page must be a positive integer between 1 and 1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('keyword')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('Keyword must be between 1 and 100 characters'),

  query('category')
    .optional()
    .custom((value) => {
      // If value is empty or undefined, skip validation
      if (!value || value.trim() === '') {
        return true;
      }
      // If value exists, validate it's a MongoDB ID
      const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!mongoIdRegex.test(value)) {
        throw new Error('Invalid category ID format');
      }
      return true;
    }),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Minimum price must be a non-negative number'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Maximum price must be a non-negative number')
    .custom((value, { req }) => {
      if (value && req.query.minPrice && parseFloat(value) < parseFloat(req.query.minPrice)) {
        throw new Error('Maximum price must be greater than minimum price');
      }
      return true;
    }),

  query('sort')
    .optional()
    .isIn(['price', '-price', 'name', '-name', 'createdAt', '-createdAt', 'rating', '-rating', 'numReviews', '-numReviews'])
    .withMessage('Invalid sort field'),

  query('featured')
    .optional()
    .isBoolean().withMessage('Featured filter must be a boolean value'),

  query('archived')
    .optional()
    .isBoolean().withMessage('Archived filter must be a boolean value')
];

// Validation for product ID parameter
const validateProductId = [
  param('id')
    .isMongoId().withMessage('Invalid product ID format')
];

// Validation for adding a review
const validateReviewCreate = [
  param('id')
    .isMongoId().withMessage('Invalid product ID format'),

  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

  body('comment')
    .trim()
    .notEmpty().withMessage('Comment is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Comment must be between 10 and 1000 characters')
    .matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/).withMessage('Comment contains invalid characters')
];

module.exports = {
  validateProductCreate,
  validateProductUpdate,
  validateProductQuery,
  validateProductId,
  validateReviewCreate
};
