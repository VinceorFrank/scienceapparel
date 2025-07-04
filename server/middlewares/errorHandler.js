const { validationResult } = require('express-validator');
const { logger, businessLogger, securityLogger } = require('../utils/logger');

// Custom error classes for different types of errors
class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code || this.constructor.name.toUpperCase();
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(errors, details = null) {
    super('Validation failed', 400, 'VALIDATION_ERROR', details);
    this.errors = errors;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource', details = null) {
    super(`${resource} not found`, 404, 'NOT_FOUND', details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access', details = null) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden', details = null) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

class ConflictError extends AppError {
  constructor(resource = 'Resource', details = null) {
    super(`${resource} already exists`, 409, 'CONFLICT', details);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests', details = null) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', details = null) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

class CacheError extends AppError {
  constructor(message = 'Cache operation failed', details = null) {
    super(message, 500, 'CACHE_ERROR', details);
  }
}

// Validation middleware with enhanced logging
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Log validation errors for debugging
    logger.warn('Validation failed', {
      errors: errors.array(),
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      query: req.query,
      params: req.params,
      userId: req.user ? req.user._id : 'anonymous',
      userEmail: req.user ? req.user.email : 'anonymous',
      userRole: req.user ? req.user.role : 'anonymous'
    });

    const { sendValidationError } = require('../utils/responseHandler');
    return sendValidationError(res, errors.array());
  }
  next();
};

// Global error handling middleware with enhanced categorization
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Enhanced error logging with categorization
  const logData = {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user ? req.user._id : 'anonymous',
    userEmail: req.user ? req.user.email : 'anonymous',
    userRole: req.user ? req.user.role : 'anonymous',
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    errorCode: err.code || 'UNKNOWN_ERROR',
    errorType: err.constructor.name
  };

  // Categorize errors for different logging levels
  if (err.statusCode >= 500) {
    logger.error('Server error occurred', logData);
  } else if (err.statusCode >= 400) {
    logger.warn('Client error occurred', logData);
  } else {
    logger.info('Application error occurred', logData);
  }

  const { sendError, sendNotFound, sendUnauthorized, sendConflict, sendValidationError } = require('../utils/responseHandler');

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return sendNotFound(res, 'Resource');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    return sendConflict(res, field);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return sendError(res, 400, message, null, 'VALIDATION_ERROR');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    securityLogger('invalid_token', { token: req.headers.authorization }, req);
    return sendUnauthorized(res, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    securityLogger('expired_token', { token: req.headers.authorization }, req);
    return sendUnauthorized(res, 'Token expired');
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    securityLogger('rate_limit_exceeded', { 
      limit: err.limit,
      windowMs: err.windowMs,
      retryAfter: err.retryAfter 
    }, req);
    return sendError(res, 429, 'Too many requests', err, 'RATE_LIMIT_EXCEEDED');
  }

  // Database connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    logger.error('Database connection error', logData);
    return sendError(res, 503, 'Service temporarily unavailable', err, 'DATABASE_CONNECTION_ERROR');
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const code = error.code || 'INTERNAL_ERROR';

  return sendError(res, statusCode, message, err, code);
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

// Business logic error handler for specific operations
const handleBusinessError = (operation, error, req, res, next) => {
  businessLogger(operation, { 
    error: error.message, 
    statusCode: error.statusCode || 500 
  }, req);
  next(error);
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  CacheError,
  validateRequest,
  errorHandler,
  notFound,
  handleBusinessError
}; 