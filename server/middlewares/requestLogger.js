/**
 * Request logging middleware for audit trails and security monitoring
 */

const fs = require('fs');
const path = require('path');

class RequestLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get log file path for today
   * @returns {string} Log file path
   */
  getLogFilePath() {
    const today = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `requests-${today}.log`);
  }

  /**
   * Get log file path for security events
   * @returns {string} Security log file path
   */
  getSecurityLogFilePath() {
    const today = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `security-${today}.log`);
  }

  /**
   * Format log entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} responseTime - Response time in milliseconds
   * @returns {Object} Formatted log entry
   */
  formatLogEntry(req, res, responseTime) {
    const timestamp = new Date().toISOString();
    const userAgent = req.get('User-Agent') || 'Unknown';
    const referer = req.get('Referer') || 'Direct';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    
    // Extract user information
    const userId = req.user ? req.user._id : 'anonymous';
    const userEmail = req.user ? req.user.email : 'anonymous';
    const userRole = req.user ? req.user.role : 'anonymous';

    // Determine if this is a security-sensitive request
    const securitySensitive = this.isSecuritySensitive(req);

    return {
      timestamp,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      ip,
      userAgent,
      referer,
      userId,
      userEmail,
      userRole,
      requestBody: this.sanitizeRequestBody(req.body),
      queryParams: this.sanitizeQueryParams(req.query),
      headers: this.sanitizeHeaders(req.headers),
      securitySensitive
    };
  }

  /**
   * Check if request is security sensitive
   * @param {Object} req - Express request object
   * @returns {boolean} True if security sensitive
   */
  isSecuritySensitive(req) {
    const sensitivePaths = [
      '/auth/login',
      '/auth/register',
      '/auth/logout',
      '/auth/password',
      '/admin',
      '/api/users',
      '/api/orders',
      '/upload'
    ];

    const sensitiveMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

    return sensitivePaths.some(path => req.originalUrl.includes(path)) ||
           sensitiveMethods.includes(req.method);
  }

  /**
   * Sanitize request body for logging
   * @param {Object} body - Request body
   * @returns {Object} Sanitized body
   */
  sanitizeRequestBody(body) {
    if (!body) return null;

    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitize query parameters for logging
   * @param {Object} query - Query parameters
   * @returns {Object} Sanitized query
   */
  sanitizeQueryParams(query) {
    if (!query || Object.keys(query).length === 0) return null;

    const sanitized = { ...query };
    
    // Remove sensitive query parameters
    const sensitiveParams = ['token', 'key', 'secret', 'password'];
    sensitiveParams.forEach(param => {
      if (sanitized[param]) {
        sanitized[param] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitize headers for logging
   * @param {Object} headers - Request headers
   * @returns {Object} Sanitized headers
   */
  sanitizeHeaders(headers) {
    if (!headers) return null;

    const sanitized = { ...headers };
    
    // Remove sensitive headers
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Write log entry to file
   * @param {Object} logEntry - Log entry to write
   * @param {boolean} isSecurity - Whether this is a security log
   */
  writeLog(logEntry, isSecurity = false) {
    const logFilePath = isSecurity ? this.getSecurityLogFilePath() : this.getLogFilePath();
    const logLine = JSON.stringify(logEntry) + '\n';

    try {
      fs.appendFileSync(logFilePath, logLine);
    } catch (error) {
      console.error('Error writing to log file:', error.message);
    }
  }

  /**
   * Log security event
   * @param {string} event - Security event type
   * @param {Object} details - Event details
   * @param {Object} req - Express request object
   */
  logSecurityEvent(event, details, req) {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    const userAgent = req.get('User-Agent') || 'Unknown';
    const userId = req.user ? req.user._id : 'anonymous';
    const userEmail = req.user ? req.user.email : 'anonymous';

    const securityLog = {
      timestamp,
      event,
      details,
      ip,
      userAgent,
      userId,
      userEmail,
      url: req.originalUrl,
      method: req.method,
      headers: this.sanitizeHeaders(req.headers)
    };

    this.writeLog(securityLog, true);
    console.warn(`🚨 Security Event: ${event}`, securityLog);
  }

  /**
   * Get log statistics
   * @returns {Object} Log statistics
   */
  getLogStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const requestLogPath = this.getLogFilePath();
      const securityLogPath = this.getSecurityLogFilePath();

      let requestCount = 0;
      let securityCount = 0;

      if (fs.existsSync(requestLogPath)) {
        const requestLogContent = fs.readFileSync(requestLogPath, 'utf8');
        requestCount = requestLogContent.split('\n').filter(line => line.trim()).length;
      }

      if (fs.existsSync(securityLogPath)) {
        const securityLogContent = fs.readFileSync(securityLogPath, 'utf8');
        securityCount = securityLogContent.split('\n').filter(line => line.trim()).length;
      }

      return {
        date: today,
        requestLogs: requestCount,
        securityLogs: securityCount,
        logDirectory: this.logDir
      };
    } catch (error) {
      console.error('Error getting log stats:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Clean up old log files
   * @param {number} daysToKeep - Number of days to keep logs
   */
  cleanupOldLogs(daysToKeep = 30) {
    try {
      const files = fs.readdirSync(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted old log file: ${file}`);
        }
      });
    } catch (error) {
      console.error('Error cleaning up old logs:', error.message);
    }
  }
}

// Create global request logger instance
const requestLogger = new RequestLogger();

/**
 * Request logging middleware
 * @returns {Function} Express middleware
 */
const logRequests = () => {
  return (req, res, next) => {
    const startTime = Date.now();

    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const responseTime = Date.now() - startTime;
      
      // Log the request
      const logEntry = requestLogger.formatLogEntry(req, res, responseTime);
      requestLogger.writeLog(logEntry, logEntry.securitySensitive);

      // Log security events for specific status codes
      if (res.statusCode >= 400) {
        const event = res.statusCode >= 500 ? 'server_error' : 'client_error';
        requestLogger.logSecurityEvent(event, {
          statusCode: res.statusCode,
          responseTime,
          error: chunk ? chunk.toString() : 'No error details'
        }, req);
      }

      // Call original end method
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};

/**
 * Security event logging middleware
 * @param {string} event - Security event type
 * @returns {Function} Express middleware
 */
const logSecurityEvent = (event) => {
  return (req, res, next) => {
    requestLogger.logSecurityEvent(event, {
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    }, req);
    next();
  };
};

// Clean up old logs daily
setInterval(() => {
  requestLogger.cleanupOldLogs();
}, 24 * 60 * 60 * 1000);

module.exports = {
  requestLogger,
  logRequests,
  logSecurityEvent
}; 