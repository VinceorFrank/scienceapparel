const express = require('express');
const router = express.Router();
const { logger, businessLogger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Middleware to ensure admin access
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: { message: 'Admin access required' } 
    });
  }
  next();
};

// Get system health and statistics
router.get('/health', requireAdmin, async (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg()
      },
      environment: process.env.NODE_ENV || 'development'
    };

    businessLogger('health_check', { status: 'success' }, req);
    
    res.json({
      success: true,
      data: healthData
    });
  } catch (error) {
    logger.error('Error getting health data', { error: error.message });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get health data' }
    });
  }
});

// Get log statistics
router.get('/logs/stats', requireAdmin, async (req, res) => {
  try {
    const logsDir = path.join(__dirname, '../logs');
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      fileTypes: {},
      recentErrors: 0,
      recentWarnings: 0,
      recentInfo: 0
    };

    if (fs.existsSync(logsDir)) {
      const files = fs.readdirSync(logsDir);
      stats.totalFiles = files.length;

      files.forEach(file => {
        const filePath = path.join(logsDir, file);
        const fileStats = fs.statSync(filePath);
        stats.totalSize += fileStats.size;

        const fileType = path.extname(file);
        stats.fileTypes[fileType] = (stats.fileTypes[fileType] || 0) + 1;
      });
    }

    businessLogger('log_stats_retrieved', { fileCount: stats.totalFiles }, req);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting log statistics', { error: error.message });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get log statistics' }
    });
  }
});

// Get recent log entries (last 100 lines)
router.get('/logs/recent', requireAdmin, async (req, res) => {
  try {
    const { type = 'combined', lines = 100 } = req.query;
    const logsDir = path.join(__dirname, '../logs');
    
    // Determine which log file to read
    let logFile;
    const today = new Date().toISOString().split('T')[0];
    
    switch (type) {
      case 'error':
        logFile = path.join(logsDir, `error-${today}.log`);
        break;
      case 'http':
        logFile = path.join(logsDir, `http-${today}.log`);
        break;
      default:
        logFile = path.join(logsDir, `combined-${today}.log`);
    }

    let logEntries = [];
    
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      // Parse JSON lines and get the last N entries
      logEntries = lines
        .slice(-parseInt(lines))
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            return { raw: line };
          }
        })
        .reverse(); // Most recent first
    }

    businessLogger('recent_logs_retrieved', { 
      type, 
      count: logEntries.length 
    }, req);

    res.json({
      success: true,
      data: {
        type,
        count: logEntries.length,
        entries: logEntries
      }
    });
  } catch (error) {
    logger.error('Error getting recent logs', { error: error.message });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get recent logs' }
    });
  }
});

// Get performance metrics
router.get('/performance', requireAdmin, async (req, res) => {
  try {
    const performanceData = {
      timestamp: new Date().toISOString(),
      memory: {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss
      },
      cpu: {
        loadAverage: os.loadavg(),
        uptime: os.uptime()
      },
      process: {
        uptime: process.uptime(),
        pid: process.pid,
        version: process.version,
        platform: process.platform
      }
    };

    businessLogger('performance_metrics_retrieved', { status: 'success' }, req);

    res.json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    logger.error('Error getting performance metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get performance metrics' }
    });
  }
});

// Get rate limit status
router.get('/rate-limits', requireAdmin, async (req, res) => {
  try {
    // This would typically come from your rate limiter implementation
    const rateLimitData = {
      timestamp: new Date().toISOString(),
      status: 'active',
      limits: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
      },
      blockedIPs: 0, // This would be tracked by your rate limiter
      totalRequests: 0 // This would be tracked by your rate limiter
    };

    businessLogger('rate_limit_status_retrieved', { status: 'success' }, req);

    res.json({
      success: true,
      data: rateLimitData
    });
  } catch (error) {
    logger.error('Error getting rate limit status', { error: error.message });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get rate limit status' }
    });
  }
});

// Get password policy status
router.get('/password-requirements', requireAdmin, async (req, res) => {
  try {
    const passwordPolicy = {
      timestamp: new Date().toISOString(),
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true,
      maxAge: 90 // days
    };

    businessLogger('password_policy_retrieved', { status: 'success' }, req);

    res.json({
      success: true,
      data: passwordPolicy
    });
  } catch (error) {
    logger.error('Error getting password policy', { error: error.message });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get password policy' }
    });
  }
});

// Get cache status
router.get('/cache', requireAdmin, async (req, res) => {
  try {
    const cacheData = {
      timestamp: new Date().toISOString(),
      status: 'active',
      type: 'memory',
      hits: 0, // This would be tracked by your cache implementation
      misses: 0, // This would be tracked by your cache implementation
      size: 0 // This would be tracked by your cache implementation
    };

    businessLogger('cache_status_retrieved', { status: 'success' }, req);

    res.json({
      success: true,
      data: cacheData
    });
  } catch (error) {
    logger.error('Error getting cache status', { error: error.message });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get cache status' }
    });
  }
});

// Get database indexes status
router.get('/database-indexes', requireAdmin, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    const collections = await db.listCollections().toArray();
    const indexData = {
      timestamp: new Date().toISOString(),
      collections: collections.length,
      indexes: {}
    };

    for (const collection of collections) {
      const indexes = await db.collection(collection.name).indexes();
      indexData.indexes[collection.name] = indexes.length;
    }

    businessLogger('database_indexes_retrieved', { 
      collectionCount: collections.length 
    }, req);

    res.json({
      success: true,
      data: indexData
    });
  } catch (error) {
    logger.error('Error getting database indexes', { error: error.message });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get database indexes' }
    });
  }
});

module.exports = router; 