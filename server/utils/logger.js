/**
 * Winston-based logging configuration for production-ready logging
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Custom log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Custom colors for different log levels
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(logColors);

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };
    
    if (stack) {
      logEntry.stack = stack;
    }
    
    return JSON.stringify(logEntry);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure transports based on environment
const transports = [];

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug'
    })
  );
}

// File transports for all environments
transports.push(
  // Error logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  }),
  
  // Combined logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true
  }),
  
  // HTTP request logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '7d',
    zippedArchive: true
  })
);

// Create the logger instance
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// Add request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log the request
  logger.http('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user._id : 'anonymous',
    userEmail: req.user ? req.user.email : 'anonymous',
    userRole: req.user ? req.user.role : 'anonymous'
  });
  
  // Override res.end to log the response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    logger.http('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      userId: req.user ? req.user._id : 'anonymous',
      userEmail: req.user ? req.user.email : 'anonymous',
      userRole: req.user ? req.user.role : 'anonymous'
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Add error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Application error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user ? req.user._id : 'anonymous',
    userEmail: req.user ? req.user.email : 'anonymous',
    userRole: req.user ? req.user.role : 'anonymous',
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  next(err);
};

// Add security event logging
const securityLogger = (event, details, req) => {
  logger.warn('Security event', {
    event,
    details,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user._id : 'anonymous',
    userEmail: req.user ? req.user.email : 'anonymous',
    userRole: req.user ? req.user.role : 'anonymous'
  });
};

// Add business logic logging
const businessLogger = (action, details, req) => {
  logger.info('Business action', {
    action,
    details,
    method: req.method,
    url: req.originalUrl,
    userId: req.user ? req.user._id : 'anonymous',
    userEmail: req.user ? req.user.email : 'anonymous',
    userRole: req.user ? req.user.role : 'anonymous'
  });
};

// Add performance logging
const performanceLogger = (operation, duration, details = {}) => {
  logger.info('Performance metric', {
    operation,
    duration: `${duration}ms`,
    ...details
  });
};

// Add database operation logging
const dbLogger = (operation, collection, duration, details = {}) => {
  logger.debug('Database operation', {
    operation,
    collection,
    duration: `${duration}ms`,
    ...details
  });
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  logger.end(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  logger.end(() => {
    process.exit(0);
  });
});

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  securityLogger,
  businessLogger,
  performanceLogger,
  dbLogger
}; 