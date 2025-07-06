/**
 * Comprehensive Test Suite
 * Tests all security, validation, and optimization systems
 */

const mongoose = require('mongoose');
const { logger } = require('./logger');
const { auditLog, AUDIT_EVENTS } = require('./auditLogger');
const { dbOptimizer } = require('./databaseOptimizer');
const { apiDocGenerator } = require('./apiDocumentation');
const { 
  StandardizedError,
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createNotFoundError,
  createConflictError,
  createRateLimitError,
  createDatabaseError
} = require('../middlewares/errorHandler/standardizedErrorHandler');

/**
 * Test Suite Class
 */
class TestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  /**
   * Run a single test
   */
  async runTest(name, testFn) {
    this.results.total++;
    
    try {
      await testFn();
      this.results.passed++;
      this.results.details.push({
        name,
        status: 'PASSED',
        timestamp: new Date().toISOString()
      });
      logger.info(`✅ Test passed: ${name}`);
    } catch (error) {
      this.results.failed++;
      this.results.details.push({
        name,
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      logger.error(`❌ Test failed: ${name}`, { error: error.message });
    }
  }

  /**
   * Test database optimization
   */
  async testDatabaseOptimization() {
    await this.runTest('Database Index Creation', async () => {
      const results = await dbOptimizer.createIndexes();
      if (results.failed.length > 0) {
        throw new Error(`Failed to create ${results.failed.length} indexes`);
      }
    });

    await this.runTest('Database Performance Monitoring', async () => {
      const stats = dbOptimizer.getQueryStats();
      if (typeof stats !== 'object') {
        throw new Error('Performance monitoring not working');
      }
    });

    await this.runTest('Database Connection Stats', async () => {
      const stats = await dbOptimizer.getConnectionStats();
      if (!stats.totalConnections && stats.totalConnections !== 0) {
        throw new Error('Connection stats not available');
      }
    });
  }

  /**
   * Test error handling system
   */
  async testErrorHandling() {
    await this.runTest('Standardized Error Creation', async () => {
      const errors = [
        createValidationError('Test validation error'),
        createAuthenticationError('Test auth error'),
        createAuthorizationError('Test authorization error'),
        createNotFoundError('Test not found error'),
        createConflictError('Test conflict error'),
        createRateLimitError('Test rate limit error'),
        createDatabaseError('Test database error')
      ];

      for (const error of errors) {
        if (!(error instanceof StandardizedError)) {
          throw new Error('Error not instanceof StandardizedError');
        }
        if (!error.statusCode) {
          throw new Error('Error missing statusCode');
        }
      }
    });

    await this.runTest('Error Type Validation', async () => {
      const validationError = createValidationError('Test');
      if (validationError.statusCode !== 400) {
        throw new Error('Validation error should have 400 status code');
      }

      const authError = createAuthenticationError('Test');
      if (authError.statusCode !== 401) {
        throw new Error('Authentication error should have 401 status code');
      }

      const authzError = createAuthorizationError('Test');
      if (authzError.statusCode !== 403) {
        throw new Error('Authorization error should have 403 status code');
      }
    });
  }

  /**
   * Test audit logging system
   */
  async testAuditLogging() {
    await this.runTest('Audit Log Creation', async () => {
      const testEvent = {
        action: 'test_action',
        details: { test: true }
      };

      await auditLog(AUDIT_EVENTS.DATA_VIEWED, testEvent, null, {
        userId: 'test-user',
        userEmail: 'test@example.com',
        userRole: 'customer'
      });
    });

    await this.runTest('Audit Log Retrieval', async () => {
      const ActivityLog = require('../models/ActivityLog');
      const logs = await ActivityLog.find({ action: 'test_action' }).limit(1);
      if (logs.length === 0) {
        throw new Error('Audit log not created');
      }
    });
  }

  /**
   * Test API documentation generation
   */
  async testAPIDocumentation() {
    await this.runTest('OpenAPI Spec Generation', async () => {
      const spec = apiDocGenerator.generateOpenAPISpec();
      if (!spec.openapi || !spec.info || !spec.paths) {
        throw new Error('Invalid OpenAPI specification');
      }
    });

    await this.runTest('Markdown Documentation Generation', async () => {
      const markdown = apiDocGenerator.generateMarkdownDocs();
      if (!markdown.includes('# E-commerce API Documentation')) {
        throw new Error('Invalid markdown documentation');
      }
    });

    await this.runTest('HTML Documentation Generation', async () => {
      const html = apiDocGenerator.generateHTMLDocs();
      if (!html.includes('<!DOCTYPE html>')) {
        throw new Error('Invalid HTML documentation');
      }
    });
  }

  /**
   * Test security middleware
   */
  async testSecurityMiddleware() {
    await this.runTest('Input Sanitization', async () => {
      const { comprehensiveSanitizer } = require('../middlewares/security/enhancedSanitizer');
      
      const testData = {
        name: '<script>alert("xss")</script>John',
        email: 'test@example.com',
        description: 'Test description with <script> tags'
      };

      const sanitized = comprehensiveSanitizer({
        removeHtml: true,
        removeScripts: true,
        removeMongoOperators: true
      })(testData);

      if (sanitized.name.includes('<script>')) {
        throw new Error('XSS sanitization failed');
      }
    });

    await this.runTest('Content Security Policy', async () => {
      const { contentSecurityPolicy } = require('../middlewares/security/contentSecurityPolicy');
      
      const req = { headers: {} };
      const res = {
        set: (header, value) => {
          if (header === 'Content-Security-Policy' && !value.includes("default-src")) {
            throw new Error('CSP header not properly set');
          }
        }
      };
      const next = () => {};

      contentSecurityPolicy(req, res, next);
    });
  }

  /**
   * Test validation system
   */
  async testValidationSystem() {
    await this.runTest('Unified Validators', async () => {
      const {
        validateString,
        validateNumber,
        validateEmail,
        validateObjectId,
        handleValidationResult
      } = require('../middlewares/validators/unifiedValidators');

      const req = {
        body: {
          name: 'Test User',
          email: 'test@example.com',
          age: 25,
          userId: '507f1f77bcf86cd799439011'
        },
        validationErrors: []
      };

      const res = {
        status: (code) => ({ json: (data) => data }),
        json: (data) => data
      };

      // Test string validation
      validateString('name', { min: 1, max: 50 })(req, res, () => {});
      if (req.validationErrors.length > 0) {
        throw new Error('String validation failed');
      }

      // Test email validation
      validateEmail('email')(req, res, () => {});
      if (req.validationErrors.length > 0) {
        throw new Error('Email validation failed');
      }

      // Test number validation
      validateNumber('age', { min: 0, max: 120 })(req, res, () => {});
      if (req.validationErrors.length > 0) {
        throw new Error('Number validation failed');
      }

      // Test ObjectId validation
      validateObjectId('userId')(req, res, () => {});
      if (req.validationErrors.length > 0) {
        throw new Error('ObjectId validation failed');
      }
    });
  }

  /**
   * Test RBAC system
   */
  async testRBACSystem() {
    await this.runTest('RBAC Permissions', async () => {
      const { PERMISSIONS, ROLES } = require('../middlewares/rbac');
      
      if (!PERMISSIONS.VIEW_OWN_ORDERS) {
        throw new Error('RBAC permissions not defined');
      }
      
      if (!ROLES.ADMIN) {
        throw new Error('RBAC roles not defined');
      }
    });

    await this.runTest('RBAC Middleware', async () => {
      const { requirePermission, requireRole } = require('../middlewares/rbac');
      
      const req = {
        user: {
          _id: 'test-user',
          role: 'customer',
          permissions: ['view_own_orders']
        }
      };

      const res = {
        status: (code) => ({ json: (data) => data }),
        json: (data) => data
      };

      let nextCalled = false;
      const next = () => { nextCalled = true; };

      // Test permission middleware
      requirePermission('view_own_orders')(req, res, next);
      if (!nextCalled) {
        throw new Error('Permission middleware not working');
      }
    });
  }

  /**
   * Test database queries
   */
  async testDatabaseQueries() {
    await this.runTest('Query Builder', async () => {
      const queryBuilder = dbOptimizer.createQueryBuilder();
      const User = require('../models/User');
      
      const query = queryBuilder.find(User, { role: 'customer' }, {
        page: 1,
        limit: 10,
        sort: { createdAt: -1 },
        select: 'name email'
      });

      if (!query.skip || !query.limit) {
        throw new Error('Query builder not working');
      }
    });

    await this.runTest('Query Optimizer', async () => {
      const queryOptimizer = dbOptimizer.createQueryOptimizer();
      
      const testData = { test: 'data' };
      const cachedData = await queryOptimizer.cachedQuery('test-key', () => testData);
      
      if (JSON.stringify(cachedData) !== JSON.stringify(testData)) {
        throw new Error('Query optimizer caching not working');
      }
    });
  }

  /**
   * Test performance monitoring
   */
  async testPerformanceMonitoring() {
    await this.runTest('Query Performance Monitoring', async () => {
      const startTime = Date.now();
      
      // Simulate a query
      dbOptimizer.monitorQuery('users', 'find', { role: 'customer' }, 50, 10);
      
      const stats = dbOptimizer.getQueryStats();
      const userStats = stats['users.find'];
      
      if (!userStats || userStats.count !== 1) {
        throw new Error('Performance monitoring not tracking queries');
      }
    });
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    logger.info('🧪 Starting comprehensive test suite...');

    // Test all systems
    await this.testDatabaseOptimization();
    await this.testErrorHandling();
    await this.testAuditLogging();
    await this.testAPIDocumentation();
    await this.testSecurityMiddleware();
    await this.testValidationSystem();
    await this.testRBACSystem();
    await this.testDatabaseQueries();
    await this.testPerformanceMonitoring();

    // Generate test report
    const report = {
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: ((this.results.passed / this.results.total) * 100).toFixed(2) + '%'
      },
      details: this.results.details,
      timestamp: new Date().toISOString()
    };

    logger.info('📊 Test suite completed', report);

    if (this.results.failed > 0) {
      logger.warn(`⚠️ ${this.results.failed} tests failed`);
    } else {
      logger.info('🎉 All tests passed!');
    }

    return report;
  }

  /**
   * Generate detailed test report
   */
  generateTestReport() {
    const report = {
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: ((this.results.passed / this.results.total) * 100).toFixed(2) + '%'
      },
      details: this.results.details,
      timestamp: new Date().toISOString(),
      recommendations: []
    };

    // Generate recommendations based on test results
    if (this.results.failed > 0) {
      report.recommendations.push('Review failed tests and fix issues');
    }

    if (this.results.passed < this.results.total * 0.8) {
      report.recommendations.push('Consider improving test coverage');
    }

    return report;
  }
}

// Create singleton instance
const testSuite = new TestSuite();

module.exports = {
  TestSuite,
  testSuite
}; 