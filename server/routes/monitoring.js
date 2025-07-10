/**
 * Admin-only Database Monitoring Routes
 * Provides real-time database health, stats, and performance monitoring
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const { 
  checkDatabaseHealth, 
  getDatabaseStats, 
  getSlowQueryStats, 
  setQueryProfiling,
  optimizeDatabase 
} = require('../config/database');
const { getRateLimitStats } = require('../middlewares/rateLimiter');
// Cache stats will be retrieved from the advanced cache manager
const { getIndexInfo } = require('../utils/databaseIndexes');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { logger } = require('../utils/logger');
const { CodeQualityAnalyzer, RouteDocumentation, EndpointValidator } = require('../utils/codeDocumentation');
const path = require('path');
const fs = require('fs');
const { auditLog, AUDIT_EVENTS } = require('../utils/auditLogger');
const { requirePermission } = require('../middlewares/rbac');
const { PERMISSIONS } = require('../middlewares/rbac');
// Removed enhancedSanitizer import - using consolidated sanitizer instead
const { validateHeaders } = require('../middlewares/security/requestValidation');
const { asyncHandler } = require('../middlewares/errorHandler/standardizedErrorHandler');
const { trackRequest } = require('../utils/monitoring');
const { dbOptimizer } = require('../utils/databaseOptimizer');
const { cacheManager } = require('../utils/advancedCache');
const { messageQueue } = require('../utils/messageQueue');
const { prometheusMetrics } = require('../monitoring/prometheusMetrics');

// Apply admin authentication to all monitoring routes
router.use(requireAuth, requireAdmin);

/**
 * GET /api/monitoring/db/health
 * Get database health status
 */
router.get('/db/health', async (req, res) => {
  try {
    const health = await checkDatabaseHealth();
    
    logger.info('Database health check requested', {
      userId: req.user._id,
      status: health.status
    });
    
    return sendSuccess(res, 'Database health retrieved successfully', health);
  } catch (error) {
    logger.error('Database health check failed:', error);
    return sendError(res, 500, 'Failed to check database health', error.message);
  }
});

/**
 * GET /api/monitoring/db/stats
 * Get comprehensive database statistics
 */
router.get('/db/stats', async (req, res) => {
  try {
    const stats = await getDatabaseStats();
    
    if (!stats) {
      return sendError(res, 503, 'Database not available');
    }
    
    logger.info('Database stats requested', {
      userId: req.user._id,
      collections: stats.collections,
      dataSize: stats.dataSize
    });
    
    return sendSuccess(res, 'Database statistics retrieved successfully', stats);
  } catch (error) {
    logger.error('Database stats retrieval failed:', error);
    return sendError(res, 500, 'Failed to get database statistics', error.message);
  }
});

/**
 * GET /api/monitoring/db/indexes
 * Get database index information
 */
router.get('/db/indexes', async (req, res) => {
  try {
    const indexInfo = await getIndexInfo();
    
    if (!indexInfo) {
      return sendError(res, 503, 'Database not available');
    }
    
    logger.info('Database index info requested', {
      userId: req.user._id,
      collections: Object.keys(indexInfo).length
    });
    
    return sendSuccess(res, 'Database index information retrieved successfully', indexInfo);
  } catch (error) {
    logger.error('Database index info retrieval failed:', error);
    return sendError(res, 500, 'Failed to get database index information', error.message);
  }
});

/**
 * GET /api/monitoring/db/slow-queries
 * Get slow query statistics and recent slow queries
 */
router.get('/db/slow-queries', async (req, res) => {
  try {
    const slowQueryStats = await getSlowQueryStats();
    
    if (!slowQueryStats) {
      return sendError(res, 503, 'Database not available');
    }
    
    logger.info('Slow query stats requested', {
      userId: req.user._id,
      slowQueriesCount: slowQueryStats.slowQueries.length
    });
    
    return sendSuccess(res, 'Slow query statistics retrieved successfully', slowQueryStats);
  } catch (error) {
    logger.error('Slow query stats retrieval failed:', error);
    return sendError(res, 500, 'Failed to get slow query statistics', error.message);
  }
});

/**
 * POST /api/monitoring/db/profiling
 * Enable/disable query profiling
 */
router.post('/db/profiling', async (req, res) => {
  try {
    const { level = 0 } = req.body;
    
    // Validate profiling level
    if (![0, 1, 2].includes(level)) {
      return sendError(res, 400, 'Invalid profiling level. Must be 0, 1, or 2');
    }
    
    const result = await setQueryProfiling(level);
    
    if (!result.success) {
      return sendError(res, 500, 'Failed to set query profiling', result.error);
    }
    
    logger.info('Query profiling updated', {
      userId: req.user._id,
      level,
      action: level === 0 ? 'disabled' : 'enabled'
    });
    
    return sendSuccess(res, `Query profiling ${level === 0 ? 'disabled' : 'enabled'} successfully`, result);
  } catch (error) {
    logger.error('Query profiling update failed:', error);
    return sendError(res, 500, 'Failed to update query profiling', error.message);
    }
});

/**
 * POST /api/monitoring/db/optimize
 * Run database optimization (compact collections, update stats)
 */
router.post('/db/optimize', async (req, res) => {
  try {
    logger.info('Database optimization requested', {
      userId: req.user._id
    });
    
    const result = await optimizeDatabase();
    
    if (!result.success) {
      return sendError(res, 500, 'Database optimization failed', result.error);
    }
    
    logger.info('Database optimization completed', {
      userId: req.user._id
    });
    
    return sendSuccess(res, 'Database optimization completed successfully', result);
  } catch (error) {
    logger.error('Database optimization failed:', error);
    return sendError(res, 500, 'Failed to optimize database', error.message);
  }
});

/**
 * GET /api/monitoring/rate-limits
 * Get rate limiting statistics
 */
router.get('/rate-limits', async (req, res) => {
  try {
    const rateLimitStats = getRateLimitStats();
    
    logger.info('Rate limit stats requested', {
      userId: req.user._id
    });
    
    return sendSuccess(res, 'Rate limit statistics retrieved successfully', rateLimitStats);
  } catch (error) {
    logger.error('Rate limit stats retrieval failed:', error);
    return sendError(res, 500, 'Failed to get rate limit statistics', error.message);
  }
});

/**
 * GET /api/monitoring/cache
 * Get cache statistics
 */
router.get('/cache', async (req, res) => {
  try {
    const cacheStats = cacheManager.getStats();
    
    logger.info('Cache stats requested', {
      userId: req.user._id
    });
    
    return sendSuccess(res, 'Cache statistics retrieved successfully', cacheStats);
  } catch (error) {
    logger.error('Cache stats retrieval failed:', error);
    return sendError(res, 500, 'Failed to get cache statistics', error.message);
  }
});

/**
 * GET /api/monitoring/system
 * Get comprehensive system monitoring data
 */
router.get('/system', async (req, res) => {
  try {
    const [dbHealth, dbStats, rateLimitStats, cacheStats, indexInfo] = await Promise.all([
      checkDatabaseHealth(),
      getDatabaseStats(),
      Promise.resolve(getRateLimitStats()),
      Promise.resolve(cacheManager.getStats()),
      getIndexInfo()
    ]);
    
    const systemStats = {
      timestamp: new Date().toISOString(),
      database: {
        health: dbHealth,
        stats: dbStats,
        indexes: indexInfo
      },
      rateLimiting: rateLimitStats,
      cache: cacheStats,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    logger.info('System monitoring data requested', {
      userId: req.user._id
    });

    return sendSuccess(res, 'System monitoring data retrieved successfully', systemStats);
  } catch (error) {
    logger.error('System monitoring failed:', error);
    return sendError(res, 500, 'Failed to get system monitoring data', error.message);
  }
});

/**
 * POST /api/monitoring/rate-limits/reset
 * Reset rate limiting statistics
 */
router.post('/rate-limits/reset', async (req, res) => {
  try {
    const { resetRateLimitStats } = require('../middlewares/rateLimiter');
    resetRateLimitStats();
    
    logger.info('Rate limit stats reset', {
      userId: req.user._id
    });
    
    return sendSuccess(res, 'Rate limit statistics reset successfully');
  } catch (error) {
    logger.error('Rate limit stats reset failed:', error);
    return sendError(res, 500, 'Failed to reset rate limit statistics', error.message);
  }
});

// GET /api/monitoring/code-quality - Get code quality analysis (admin only)
router.get('/code-quality', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const analyzer = new CodeQualityAnalyzer();
    const routesDir = path.join(__dirname, '../routes');
    const utilsDir = path.join(__dirname, '../utils');
    const middlewaresDir = path.join(__dirname, '../middlewares');
    
    // Analyze route files
    const routeFiles = fs.readdirSync(routesDir)
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(routesDir, file));
    
    // Analyze utility files
    const utilFiles = fs.readdirSync(utilsDir)
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(utilsDir, file));
    
    // Analyze middleware files
    const middlewareFiles = fs.readdirSync(middlewaresDir)
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(middlewaresDir, file));
    
    const allFiles = [...routeFiles, ...utilFiles, ...middlewareFiles];
    const analyses = allFiles.map(file => analyzer.analyzeFile(file));
    
    const report = analyzer.generateReport();
    
    businessLogger('code_quality_analysis', {
      filesAnalyzed: allFiles.length,
      totalIssues: report.summary.totalIssues,
      qualityScore: report.summary.qualityScore
    }, req);

    return sendSuccess(res, 200, 'Code quality analysis completed', {
      summary: report.summary,
      analyses: analyses.filter(analysis => !analysis.error),
      recommendations: report.recommendations
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/monitoring/endpoint-validation - Validate API endpoints (admin only)
router.get('/endpoint-validation', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const validator = new EndpointValidator();
    
    // Add known endpoints for validation
    const endpoints = [
      {
        method: 'GET',
        path: '/api/products',
        access: 'Public',
        hasAuthMiddleware: false,
        hasValidation: true,
        hasErrorHandling: true
      },
      {
        method: 'POST',
        path: '/api/products',
        access: 'Admin',
        hasAuthMiddleware: true,
        hasValidation: true,
        hasErrorHandling: true
      },
      {
        method: 'GET',
        path: '/api/orders',
        access: 'Private',
        hasAuthMiddleware: true,
        hasValidation: false,
        hasErrorHandling: true
      },
      {
        method: 'POST',
        path: '/api/orders',
        access: 'Private',
        hasAuthMiddleware: true,
        hasValidation: true,
        hasErrorHandling: true
      }
    ];
    
    endpoints.forEach(endpoint => validator.addEndpoint(endpoint));
    const validationResults = validator.validate();
    
    businessLogger('endpoint_validation', {
      totalEndpoints: validationResults.total,
      validEndpoints: validationResults.valid,
      invalidEndpoints: validationResults.invalid
    }, req);

    return sendSuccess(res, 200, 'Endpoint validation completed', validationResults);
  } catch (err) {
    next(err);
  }
});

// GET /api/monitoring/generate-docs - Generate API documentation (admin only)
router.get('/generate-docs', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const docGenerator = new RouteDocumentation();
    
    // Add route documentation
    docGenerator.addRoute(
      'GET',
      '/api/products',
      'Get all products with pagination and filtering',
      'Public',
      {
        page: { description: 'Page number', type: 'number' },
        limit: { description: 'Items per page', type: 'number' },
        search: { description: 'Search term', type: 'string' },
        category: { description: 'Category ID', type: 'string' }
      },
      {},
      {
        '200': {
          success: true,
          message: 'Products retrieved successfully',
          data: [],
          pagination: {}
        }
      }
    );
    
    docGenerator.addRoute(
      'POST',
      '/api/products',
      'Create a new product',
      'Admin',
      {},
      {
        name: 'string',
        description: 'string',
        price: 'number',
        stock: 'number',
        category: 'string'
      },
      {
        '201': {
          success: true,
          message: 'Product created successfully',
          data: {}
        }
      }
    );
    
    // Generate and save documentation
    const docsPath = path.join(__dirname, '../docs/api-documentation.md');
    docGenerator.saveToFile(docsPath);
    
    businessLogger('api_docs_generated', {
      docsPath: docsPath,
      routesCount: docGenerator.routes.length
    }, req);

    return sendSuccess(res, 200, 'API documentation generated successfully', {
      docsPath: docsPath,
      routesDocumented: docGenerator.routes.length
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router; 