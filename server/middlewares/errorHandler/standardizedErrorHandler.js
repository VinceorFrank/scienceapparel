/**
 * Standardized Error Handling System
 * Provides consistent error responses and proper logging
 */

const { logger } = require('../../utils/logger');
const { auditLog, AUDIT_EVENTS, SEVERITY_LEVELS } = require('../../utils/auditLogger');
const { sendError, sendValidationError } = require('../../utils/responseHandler');

// Define error types and their corresponding HTTP status codes
const ERROR_TYPES = {
  VALIDATION_ERROR: { statusCode: 400, category: 'validation' },
  AUTHENTICATION_ERROR: { statusCode: 401, category: 'authentication' },
  AUTHORIZATION_ERROR: { statusCode: 403, category: 'authorization' },
  NOT_FOUND_ERROR: { statusCode: 404, category: 'not_found' },
  CONFLICT_ERROR: { statusCode: 409, category: 'conflict' },
  RATE_LIMIT_ERROR: { statusCode: 429, category: 'rate_limit' },
  CLIENT_ERROR: { statusCode: 400, category: 'client_error' },
  SERVER_ERROR: { statusCode: 500, category: 'server_error' },
  DATABASE_ERROR: { statusCode: 503, category: 'database_error' },
  EXTERNAL_SERVICE_ERROR: { statusCode: 502, category: 'external_service' }
};

// Define common error messages
const ERROR_MESSAGES = {
  VALIDATION_ERROR: 'Validation failed',
  AUTHENTICATION_ERROR: 'Authentication required',
  AUTHORIZATION_ERROR: 'Access denied',
  NOT_FOUND_ERROR: 'Resource not found',
  CONFLICT_ERROR: 'Resource conflict',
  RATE_LIMIT_ERROR: 'Too many requests',
  CLIENT_ERROR: 'Bad request',
  SERVER_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Service temporarily unavailable',
  EXTERNAL_SERVICE_ERROR: 'External service error'
};

/**
 * Custom error class with standardized properties
 */
class StandardizedError extends Error {
  constructor(message, type = 'SERVER_ERROR', details = null, code = null) {
    super(message);
    this.name = 'StandardizedError';
    this.type = type;
    this.details = details;
    this.code = code || type;
    this.statusCode = ERROR_TYPES[type]?.statusCode || 500;
    this.category = ERROR_TYPES[type]?.category || 'unknown';
    this.timestamp = new Date();
  }
}

/**
 * Create specific error types
 */
const createValidationError = (message, details = null) => {
  return new StandardizedError(message, 'VALIDATION_ERROR', details, 'VALIDATION_FAILED');
};

const createAuthenticationError = (message = ERROR_MESSAGES.AUTHENTICATION_ERROR) => {
  return new StandardizedError(message, 'AUTHENTICATION_ERROR', null, 'AUTHENTICATION_FAILED');
};

const createAuthorizationError = (message = ERROR_MESSAGES.AUTHORIZATION_ERROR) => {
  return new StandardizedError(message, 'AUTHORIZATION_ERROR', null, 'AUTHORIZATION_FAILED');
};

const createNotFoundError = (resource = 'Resource') => {
  return new StandardizedError(`${resource} not found`, 'NOT_FOUND_ERROR', null, 'NOT_FOUND');
};

const createConflictError = (resource = 'Resource') => {
  return new StandardizedError(`${resource} already exists`, 'CONFLICT_ERROR', null, 'CONFLICT');
};

const createRateLimitError = (message = ERROR_MESSAGES.RATE_LIMIT_ERROR) => {
  return new StandardizedError(message, 'RATE_LIMIT_ERROR', null, 'RATE_LIMIT_EXCEEDED');
};

const createDatabaseError = (message = ERROR_MESSAGES.DATABASE_ERROR) => {
  return new StandardizedError(message, 'DATABASE_ERROR', null, 'DATABASE_ERROR');
};

/**
 * Enhanced error logging with context
 */
const logError = async (error, req = null) => {
  const errorContext = {
    error: {
      message: error.message,
      type: error.type || 'UNKNOWN',
      code: error.code,
      statusCode: error.statusCode || 500,
      stack: error.stack
    },
    request: req ? {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?._id,
      userEmail: req.user?.email,
      userRole: req.user?.role
    } : null,
    timestamp: new Date()
  };

  // Determine log level based on error type
  let logLevel = 'error';
  let auditSeverity = SEVERITY_LEVELS.HIGH;

  if (error.statusCode < 500) {
    logLevel = 'warn';
    auditSeverity = SEVERITY_LEVELS.MEDIUM;
  }

  if (error.statusCode >= 500) {
    logLevel = 'error';
    auditSeverity = SEVERITY_LEVELS.CRITICAL;
  }

  // Log to console
  logger[logLevel](`${error.type || 'ERROR'} occurred`, errorContext);

  // Log to audit system if request context is available
  if (req) {
    try {
      await auditLog(AUDIT_EVENTS.SUSPICIOUS_ACTIVITY, {
        action: 'error_occurred',
        errorType: error.type,
        errorCode: error.code,
        statusCode: error.statusCode
      }, req, {
        severity: auditSeverity,
        category: 'error',
        error: error
      });
    } catch (auditError) {
      logger.error('Failed to log error to audit system', { error: auditError.message });
    }
  }
};

/**
 * Standardized error response formatter
 */
const formatErrorResponse = (error, includeDetails = false) => {
  const response = {
    success: false,
    message: error.message || ERROR_MESSAGES[error.type] || ERROR_MESSAGES.SERVER_ERROR,
    code: error.code || error.type || 'UNKNOWN_ERROR',
    timestamp: error.timestamp || new Date().toISOString()
  };

  // Include additional details in development
  if (includeDetails && process.env.NODE_ENV === 'development') {
    response.details = {
      type: error.type,
      statusCode: error.statusCode,
      stack: error.stack
    };
  }

  return response;
};

/**
 * Main error handling middleware
 */
const errorHandler = async (error, req, res, next) => {
  // Log the error
  await logError(error, req);

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return sendValidationError(res, error.details || [error.message]);
  }

  if (error.name === 'CastError') {
    return sendError(res, 400, 'Invalid ID format', null, 'INVALID_ID');
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return sendError(res, 409, `${field} already exists`, null, 'DUPLICATE_KEY');
  }

  if (error.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid token', null, 'INVALID_TOKEN');
  }

  if (error.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Token expired', null, 'TOKEN_EXPIRED');
  }

  // Handle custom standardized errors
  if (error instanceof StandardizedError) {
    return sendError(
      res,
      error.statusCode,
      error.message,
      error.details,
      error.code
    );
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || ERROR_MESSAGES.SERVER_ERROR;
  const code = error.code || 'INTERNAL_ERROR';

  return sendError(res, statusCode, message, null, code);
};

/**
 * Async error wrapper for route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Error boundary for specific routes
 */
const errorBoundary = (errorType, handler) => {
  return (req, res, next) => {
    try {
      return handler(req, res, next);
    } catch (error) {
      if (error.type === errorType) {
        return next(error);
      }
      throw error;
    }
  };
};

/**
 * Validation error handler
 */
const validationErrorHandler = (req, res, next) => {
  const errors = req.validationErrors;
  if (errors && errors.length > 0) {
    const error = createValidationError('Validation failed', errors);
    return next(error);
  }
  next();
};

/**
 * Database error handler
 */
const databaseErrorHandler = (error, req, res, next) => {
  if (error.name === 'MongoError' || error.name === 'MongooseError') {
    const dbError = createDatabaseError('Database operation failed');
    return next(dbError);
  }
  next(error);
};

/**
 * Rate limit error handler
 */
const rateLimitErrorHandler = (error, req, res, next) => {
  if (error.statusCode === 429) {
    const rateLimitError = createRateLimitError('Too many requests');
    return next(rateLimitError);
  }
  next(error);
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const error = createNotFoundError(`Route ${req.originalUrl}`);
  next(error);
};

/**
 * Request timeout handler
 */
const timeoutHandler = (timeout = 30000) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      const error = new StandardizedError(
        'Request timeout',
        'CLIENT_ERROR',
        null,
        'REQUEST_TIMEOUT'
      );
      error.statusCode = 408;
      next(error);
    }, timeout);

    res.on('finish', () => clearTimeout(timer));
    next();
  };
};

module.exports = {
  StandardizedError,
  ERROR_TYPES,
  ERROR_MESSAGES,
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createNotFoundError,
  createConflictError,
  createRateLimitError,
  createDatabaseError,
  logError,
  formatErrorResponse,
  errorHandler,
  asyncHandler,
  errorBoundary,
  validationErrorHandler,
  databaseErrorHandler,
  rateLimitErrorHandler,
  notFoundHandler,
  timeoutHandler
}; 