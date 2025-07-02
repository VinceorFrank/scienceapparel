/**
 * Standardized Response Handler
 * Ensures consistent API responses across all endpoints
 */

const { logger } = require('./logger');

/**
 * Standard success response format
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message
 * @param {*} data - Response data
 * @param {Object} meta - Additional metadata (pagination, etc.)
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    ...(data !== null && { data }),
    ...(meta && { meta })
  };

  logger.info('API Success Response', {
    statusCode,
    message,
    dataType: data ? typeof data : 'null',
    hasMeta: !!meta
  });

  return res.status(statusCode).json(response);
};

/**
 * Standard error response format
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} message - Error message
 * @param {*} error - Error details
 * @param {string} code - Error code for client handling
 */
const sendError = (res, statusCode = 500, message = 'Internal Server Error', error = null, code = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    ...(code && { code }),
    ...(error && process.env.NODE_ENV === 'development' && { error })
  };

  logger.error('API Error Response', {
    statusCode,
    message,
    code,
    error: error?.message || error,
    stack: error?.stack
  });

  return res.status(statusCode).json(response);
};

/**
 * Validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation errors array
 */
const sendValidationError = (res, errors) => {
  const response = {
    success: false,
    message: 'Validation failed',
    timestamp: new Date().toISOString(),
    code: 'VALIDATION_ERROR',
    errors: errors.map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }))
  };

  logger.warn('API Validation Error', {
    statusCode: 400,
    errorCount: errors.length,
    errors: response.errors
  });

  return res.status(400).json(response);
};

/**
 * Not found error response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name
 */
const sendNotFound = (res, resource = 'Resource') => {
  return sendError(res, 404, `${resource} not found`, null, 'NOT_FOUND');
};

/**
 * Unauthorized error response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message
 */
const sendUnauthorized = (res, message = 'Access denied. Authentication required.') => {
  return sendError(res, 401, message, null, 'UNAUTHORIZED');
};

/**
 * Forbidden error response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message
 */
const sendForbidden = (res, message = 'Access denied. Insufficient permissions.') => {
  return sendError(res, 403, message, null, 'FORBIDDEN');
};

/**
 * Conflict error response (duplicate resource)
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name
 */
const sendConflict = (res, resource = 'Resource') => {
  return sendError(res, 409, `${resource} already exists`, null, 'CONFLICT');
};

/**
 * Rate limit exceeded response
 * @param {Object} res - Express response object
 * @param {number} retryAfter - Seconds to wait before retry
 */
const sendRateLimitExceeded = (res, retryAfter = 60) => {
  res.setHeader('Retry-After', retryAfter);
  return sendError(res, 429, 'Too many requests. Please try again later.', null, 'RATE_LIMIT_EXCEEDED');
};

/**
 * Paginated response helper
 * @param {Object} res - Express response object
 * @param {Array} data - Data array
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @param {string} message - Success message
 */
const sendPaginated = (res, data, page, limit, total, message = 'Data retrieved successfully') => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const meta = {
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext,
      hasPrev,
      ...(hasNext && { nextPage: page + 1 }),
      ...(hasPrev && { prevPage: page - 1 })
    }
  };

  return sendSuccess(res, 200, message, data, meta);
};

/**
 * Created response (201)
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {*} data - Created resource data
 */
const sendCreated = (res, message = 'Resource created successfully', data = null) => {
  return sendSuccess(res, 201, message, data);
};

/**
 * Updated response (200)
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {*} data - Updated resource data
 */
const sendUpdated = (res, message = 'Resource updated successfully', data = null) => {
  return sendSuccess(res, 200, message, data);
};

/**
 * Deleted response (200)
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 */
const sendDeleted = (res, message = 'Resource deleted successfully') => {
  return sendSuccess(res, 200, message);
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendConflict,
  sendRateLimitExceeded,
  sendPaginated,
  sendCreated,
  sendUpdated,
  sendDeleted
}; 