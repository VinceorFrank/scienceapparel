/**
 * Performance monitoring utility
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: new Map(),
      queries: new Map(),
      errors: new Map(),
      slowQueries: [],
      responseTimes: []
    };
    
    this.config = {
      slowQueryThreshold: 1000, // 1 second
      maxSlowQueries: 100,
      maxResponseTimes: 1000
    };
  }

  /**
   * Start timing a request
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {string} userId - User ID (optional)
   * @returns {string} Request ID
   */
  startRequest(method, url, userId = null) {
    const requestId = `${method}:${url}:${Date.now()}`;
    const startTime = process.hrtime.bigint();
    
    this.metrics.requests.set(requestId, {
      method,
      url,
      userId,
      startTime,
      status: 'pending'
    });

    return requestId;
  }

  /**
   * End timing a request
   * @param {string} requestId - Request ID
   * @param {number} statusCode - HTTP status code
   * @param {number} responseSize - Response size in bytes
   */
  endRequest(requestId, statusCode, responseSize = 0) {
    const request = this.metrics.requests.get(requestId);
    
    if (!request) return;

    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - request.startTime) / 1000000; // Convert to milliseconds

    request.status = 'completed';
    request.duration = duration;
    request.statusCode = statusCode;
    request.responseSize = responseSize;
    request.endTime = new Date();

    // Track response times
    this.trackResponseTime(duration, request.url);

    // Clean up old requests
    this.cleanupRequests();
  }

  /**
   * Track database query performance
   * @param {string} operation - Database operation (find, update, etc.)
   * @param {string} collection - Collection name
   * @param {Object} filter - Query filter
   * @param {number} duration - Query duration in milliseconds
   * @param {number} resultCount - Number of results
   */
  trackQuery(operation, collection, filter, duration, resultCount = 0) {
    const queryKey = `${operation}:${collection}`;
    
    if (!this.metrics.queries.has(queryKey)) {
      this.metrics.queries.set(queryKey, {
        operation,
        collection,
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        totalResults: 0
      });
    }

    const query = this.metrics.queries.get(queryKey);
    query.count++;
    query.totalDuration += duration;
    query.avgDuration = query.totalDuration / query.count;
    query.minDuration = Math.min(query.minDuration, duration);
    query.maxDuration = Math.max(query.maxDuration, duration);
    query.totalResults += resultCount;

    // Track slow queries
    if (duration > this.config.slowQueryThreshold) {
      this.trackSlowQuery(operation, collection, filter, duration, resultCount);
    }
  }

  /**
   * Track slow queries
   * @param {string} operation - Database operation
   * @param {string} collection - Collection name
   * @param {Object} filter - Query filter
   * @param {number} duration - Query duration
   * @param {number} resultCount - Number of results
   */
  trackSlowQuery(operation, collection, filter, duration, resultCount) {
    const slowQuery = {
      operation,
      collection,
      filter: JSON.stringify(filter).substring(0, 200), // Truncate for storage
      duration,
      resultCount,
      timestamp: new Date()
    };

    this.metrics.slowQueries.push(slowQuery);

    // Keep only the most recent slow queries
    if (this.metrics.slowQueries.length > this.config.maxSlowQueries) {
      this.metrics.slowQueries.shift();
    }
  }

  /**
   * Track response times
   * @param {number} duration - Response duration in milliseconds
   * @param {string} url - Request URL
   */
  trackResponseTime(duration, url) {
    const responseTime = {
      duration,
      url,
      timestamp: new Date()
    };

    this.metrics.responseTimes.push(responseTime);

    // Keep only the most recent response times
    if (this.metrics.responseTimes.length > this.config.maxResponseTimes) {
      this.metrics.responseTimes.shift();
    }
  }

  /**
   * Track errors
   * @param {string} error - Error message
   * @param {string} url - Request URL
   * @param {number} statusCode - HTTP status code
   */
  trackError(error, url, statusCode) {
    const errorKey = `${statusCode}:${error}`;
    
    if (!this.metrics.errors.has(errorKey)) {
      this.metrics.errors.set(errorKey, {
        error,
        statusCode,
        count: 0,
        urls: new Set(),
        firstSeen: new Date(),
        lastSeen: new Date()
      });
    }

    const errorMetric = this.metrics.errors.get(errorKey);
    errorMetric.count++;
    errorMetric.urls.add(url);
    errorMetric.lastSeen = new Date();
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance statistics
   */
  getStats() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Calculate response time statistics
    const recentResponseTimes = this.metrics.responseTimes.filter(
      rt => rt.timestamp.getTime() > oneHourAgo
    );

    const responseTimeStats = recentResponseTimes.length > 0 ? {
      count: recentResponseTimes.length,
      avg: recentResponseTimes.reduce((sum, rt) => sum + rt.duration, 0) / recentResponseTimes.length,
      min: Math.min(...recentResponseTimes.map(rt => rt.duration)),
      max: Math.max(...recentResponseTimes.map(rt => rt.duration)),
      p95: this.calculatePercentile(recentResponseTimes.map(rt => rt.duration), 95),
      p99: this.calculatePercentile(recentResponseTimes.map(rt => rt.duration), 99)
    } : null;

    // Calculate query statistics
    const queryStats = Array.from(this.metrics.queries.values()).map(query => ({
      operation: query.operation,
      collection: query.collection,
      count: query.count,
      avgDuration: query.avgDuration,
      minDuration: query.minDuration,
      maxDuration: query.maxDuration,
      totalResults: query.totalResults,
      avgResults: query.totalResults / query.count
    }));

    // Calculate error statistics
    const errorStats = Array.from(this.metrics.errors.values()).map(error => ({
      error: error.error,
      statusCode: error.statusCode,
      count: error.count,
      urls: Array.from(error.urls),
      firstSeen: error.firstSeen,
      lastSeen: error.lastSeen
    }));

    return {
      responseTimes: responseTimeStats,
      queries: queryStats,
      errors: errorStats,
      slowQueries: this.metrics.slowQueries.slice(-10), // Last 10 slow queries
      activeRequests: Array.from(this.metrics.requests.values()).filter(r => r.status === 'pending').length
    };
  }

  /**
   * Calculate percentile
   * @param {Array} values - Array of values
   * @param {number} percentile - Percentile (0-100)
   * @returns {number} Percentile value
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Clean up old requests
   */
  cleanupRequests() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [requestId, request] of this.metrics.requests.entries()) {
      if (request.endTime && request.endTime.getTime() < oneHourAgo) {
        this.metrics.requests.delete(requestId);
      }
    }
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics.requests.clear();
    this.metrics.queries.clear();
    this.metrics.errors.clear();
    this.metrics.slowQueries = [];
    this.metrics.responseTimes = [];
  }
}

// Create global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

/**
 * Performance monitoring middleware
 * @returns {Function} Express middleware
 */
const performanceMiddleware = () => {
  return (req, res, next) => {
    const requestId = performanceMonitor.startRequest(
      req.method, 
      req.originalUrl, 
      req.user ? req.user._id : null
    );

    // Store request ID for later use
    req.performanceId = requestId;

    // Override res.json to capture response size
    const originalJson = res.json;
    res.json = function(data) {
      const responseSize = JSON.stringify(data).length;
      performanceMonitor.endRequest(requestId, res.statusCode, responseSize);
      return originalJson.call(this, data);
    };

    // Override res.send to capture response size
    const originalSend = res.send;
    res.send = function(data) {
      const responseSize = typeof data === 'string' ? data.length : JSON.stringify(data).length;
      performanceMonitor.endRequest(requestId, res.statusCode, responseSize);
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Database query monitoring
 * @param {Function} queryFn - Database query function
 * @param {string} operation - Operation name
 * @param {string} collection - Collection name
 * @returns {Function} Wrapped query function
 */
const monitorQuery = (queryFn, operation, collection) => {
  return async (...args) => {
    const startTime = process.hrtime.bigint();
    
    try {
      const result = await queryFn(...args);
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      
      const resultCount = Array.isArray(result) ? result.length : (result ? 1 : 0);
      performanceMonitor.trackQuery(operation, collection, args[0] || {}, duration, resultCount);
      
      return result;
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      
      performanceMonitor.trackQuery(operation, collection, args[0] || {}, duration, 0);
      throw error;
    }
  };
};

module.exports = {
  performanceMonitor,
  performanceMiddleware,
  monitorQuery
}; 