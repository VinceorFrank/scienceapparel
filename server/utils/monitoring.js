/**
 * Enhanced Monitoring System
 * Provides comprehensive monitoring for performance, health, and system metrics
 */

const os = require('os');
const { logger } = require('./logger');
const { getStats: getCacheStats } = require('./cache');
const { getRateLimitStats } = require('../middlewares/rateLimiter');

class MonitoringSystem {
  constructor() {
    this.startTime = Date.now();
    this.requestCounts = {
      total: 0,
      byMethod: {},
      byEndpoint: {},
      byStatus: {}
    };
    this.responseTimes = [];
    this.errorCounts = {
      total: 0,
      byType: {},
      byEndpoint: {}
    };
    this.activeConnections = 0;
    this.peakConnections = 0;
  }

  /**
   * Record a request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} duration - Request duration in milliseconds
   */
  recordRequest(req, res, duration) {
    const method = req.method;
    const endpoint = req.path;
    const statusCode = res.statusCode;

    // Update request counts
    this.requestCounts.total++;
    
    this.requestCounts.byMethod[method] = (this.requestCounts.byMethod[method] || 0) + 1;
    this.requestCounts.byEndpoint[endpoint] = (this.requestCounts.byEndpoint[endpoint] || 0) + 1;
    this.requestCounts.byStatus[statusCode] = (this.requestCounts.byStatus[statusCode] || 0) + 1;

    // Record response time
    this.responseTimes.push(duration);
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift(); // Keep only last 1000 requests
    }

    // Track errors
    if (statusCode >= 400) {
      this.errorCounts.total++;
      this.errorCounts.byType[statusCode] = (this.errorCounts.byType[statusCode] || 0) + 1;
      this.errorCounts.byEndpoint[endpoint] = (this.errorCounts.byEndpoint[endpoint] || 0) + 1;
    }
  }

  /**
   * Update connection count
   * @param {number} count - Current active connections
   */
  updateConnections(count) {
    this.activeConnections = count;
    if (count > this.peakConnections) {
      this.peakConnections = count;
    }
  }

  /**
   * Get system metrics
   * @returns {Object} System metrics
   */
  getSystemMetrics() {
    const uptime = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      uptime: {
        milliseconds: uptime,
        seconds: Math.floor(uptime / 1000),
        minutes: Math.floor(uptime / 60000),
        hours: Math.floor(uptime / 3600000),
        days: Math.floor(uptime / 86400000)
      },
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      os: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg()
      }
    };
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    const avgResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;

    const sortedResponseTimes = [...this.responseTimes].sort((a, b) => a - b);
    const p95 = sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.95)] || 0;
    const p99 = sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.99)] || 0;

    return {
      requests: {
        total: this.requestCounts.total,
        byMethod: this.requestCounts.byMethod,
        byEndpoint: this.requestCounts.byEndpoint,
        byStatus: this.requestCounts.byStatus
      },
      responseTimes: {
        average: Math.round(avgResponseTime),
        p95: Math.round(p95),
        p99: Math.round(p99),
        min: Math.round(Math.min(...this.responseTimes) || 0),
        max: Math.round(Math.max(...this.responseTimes) || 0),
        samples: this.responseTimes.length
      },
      errors: {
        total: this.errorCounts.total,
        rate: this.requestCounts.total > 0 
          ? ((this.errorCounts.total / this.requestCounts.total) * 100).toFixed(2) + '%'
          : '0%',
        byType: this.errorCounts.byType,
        byEndpoint: this.errorCounts.byEndpoint
      },
      connections: {
        active: this.activeConnections,
        peak: this.peakConnections
      }
    };
  }

  /**
   * Get cache metrics
   * @returns {Object} Cache metrics
   */
  getCacheMetrics() {
    return getCacheStats();
  }

  /**
   * Get rate limit metrics
   * @returns {Object} Rate limit metrics
   */
  getRateLimitMetrics() {
    return getRateLimitStats();
  }

  /**
   * Get comprehensive health status
   * @returns {Object} Health status
   */
  getHealthStatus() {
    const systemMetrics = this.getSystemMetrics();
    const performanceMetrics = this.getPerformanceMetrics();
    const cacheMetrics = this.getCacheMetrics();
    const rateLimitMetrics = this.getRateLimitMetrics();

    // Determine overall health
    const memoryUsagePercent = (systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal) * 100;
    const errorRate = parseFloat(performanceMetrics.errors.rate);
    const avgResponseTime = performanceMetrics.responseTimes.average;

    let status = 'healthy';
    let issues = [];

    // Check memory usage
    if (memoryUsagePercent > 90) {
      status = 'critical';
      issues.push('High memory usage');
    } else if (memoryUsagePercent > 80) {
      status = 'warning';
      issues.push('Elevated memory usage');
    }

    // Check error rate
    if (errorRate > 10) {
      status = 'critical';
      issues.push('High error rate');
    } else if (errorRate > 5) {
      status = 'warning';
      issues.push('Elevated error rate');
    }

    // Check response time
    if (avgResponseTime > 5000) {
      status = 'critical';
      issues.push('Slow response times');
    } else if (avgResponseTime > 2000) {
      status = 'warning';
      issues.push('Elevated response times');
    }

    // Check rate limiting
    if (rateLimitMetrics.blockedRequests > 100) {
      status = 'warning';
      issues.push('High rate limiting activity');
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: systemMetrics.uptime,
      issues,
      metrics: {
        system: systemMetrics,
        performance: performanceMetrics,
        cache: cacheMetrics,
        rateLimit: rateLimitMetrics
      }
    };
  }

  /**
   * Get monitoring dashboard data
   * @returns {Object} Dashboard data
   */
  getDashboardData() {
    return {
      health: this.getHealthStatus(),
      system: this.getSystemMetrics(),
      performance: this.getPerformanceMetrics(),
      cache: this.getCacheMetrics(),
      rateLimit: this.getRateLimitMetrics()
    };
  }

  /**
   * Reset monitoring data
   */
  reset() {
    this.startTime = Date.now();
    this.requestCounts = {
      total: 0,
      byMethod: {},
      byEndpoint: {},
      byStatus: {}
    };
    this.responseTimes = [];
    this.errorCounts = {
      total: 0,
      byType: {},
      byEndpoint: {}
    };
    this.activeConnections = 0;
    this.peakConnections = 0;
  }

  /**
   * Log monitoring data
   */
  logMetrics() {
    const health = this.getHealthStatus();
    const performance = this.getPerformanceMetrics();

    logger.info('Monitoring metrics', {
      status: health.status,
      uptime: health.uptime,
      requests: performance.requests.total,
      avgResponseTime: performance.responseTimes.average,
      errorRate: performance.errors.rate,
      memoryUsage: `${((health.metrics.system.memory.heapUsed / health.metrics.system.memory.heapTotal) * 100).toFixed(2)}%`,
      activeConnections: performance.connections.active
    });

    if (health.issues.length > 0) {
      logger.warn('Health issues detected', {
        issues: health.issues,
        status: health.status
      });
    }
  }
}

// Create singleton instance
const monitoringSystem = new MonitoringSystem();

// Middleware to track requests
const trackRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    monitoringSystem.recordRequest(req, res, duration);
  });
  
  next();
};

// Middleware to track connections
const trackConnections = (server) => {
  let connectionCount = 0;
  
  server.on('connection', () => {
    connectionCount++;
    monitoringSystem.updateConnections(connectionCount);
  });
  
  server.on('disconnect', () => {
    connectionCount--;
    monitoringSystem.updateConnections(connectionCount);
  });
};

// Schedule periodic logging
setInterval(() => {
  monitoringSystem.logMetrics();
}, 5 * 60 * 1000); // Every 5 minutes

module.exports = {
  monitoringSystem,
  trackRequest,
  trackConnections
}; 