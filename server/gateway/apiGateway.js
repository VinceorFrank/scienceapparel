/**
 * API Gateway - Centralized API management
 * Handles routing, authentication, rate limiting, and cross-cutting concerns
 */

const express = require('express');
const { logger } = require('../utils/logger');
const { auditLog, AUDIT_EVENTS } = require('../utils/auditLogger');
const { cacheManager } = require('../utils/advancedCache');
const { messageQueue } = require('../utils/messageQueue');
const { userService } = require('../services/userService');
const { productService } = require('../services/productService');

class APIGateway {
  constructor() {
    this.router = express.Router();
    this.services = new Map();
    this.middleware = new Map();
    this.routes = new Map();
    this.cachePrefix = 'gateway:';
  }

  /**
   * Register a service
   */
  registerService(name, service) {
    this.services.set(name, service);
    logger.info(`Service registered: ${name}`);
  }

  /**
   * Register middleware
   */
  registerMiddleware(name, middleware) {
    this.middleware.set(name, middleware);
    logger.info(`Middleware registered: ${name}`);
  }

  /**
   * Register route
   */
  registerRoute(path, method, handler, options = {}) {
    const routeKey = `${method.toUpperCase()}:${path}`;
    this.routes.set(routeKey, {
      handler,
      options,
      path,
      method: method.toUpperCase()
    });
    logger.info(`Route registered: ${routeKey}`);
  }

  /**
   * Authentication middleware
   */
  async authenticate(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Try cache first
      const cacheKey = `${this.cachePrefix}auth:${token}`;
      const cachedUser = await cacheManager.get(cacheKey);
      
      if (cachedUser) {
        req.user = cachedUser;
        return next();
      }

      // Verify token
      const user = await userService.verifyToken(token);
      req.user = user;

      // Cache user data
      await cacheManager.set(cacheKey, user, { ttl: 1800 }); // 30 minutes

      next();
    } catch (error) {
      logger.error('Authentication failed:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  /**
   * Authorization middleware
   */
  authorize(requiredRole) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (req.user.role !== requiredRole && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    };
  }

  /**
   * Rate limiting middleware
   */
  rateLimit(options = {}) {
    const { windowMs = 15 * 60 * 1000, max = 100 } = options;
    const requests = new Map();

    return (req, res, next) => {
      const key = req.ip;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old requests
      if (requests.has(key)) {
        requests.set(key, requests.get(key).filter(time => time > windowStart));
      } else {
        requests.set(key, []);
      }

      const userRequests = requests.get(key);
      
      if (userRequests.length >= max) {
        return res.status(429).json({ error: 'Too many requests' });
      }

      userRequests.push(now);
      next();
    };
  }

  /**
   * Request logging middleware
   */
  logRequest(req, res, next) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      logger.info('API Request', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id
      });

      // Audit log for sensitive operations
      if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        auditLog(AUDIT_EVENTS.API_REQUEST, {
          action: 'api_request',
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          userId: req.user?.id
        }, req.user, {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode
        });
      }
    });

    next();
  }

  /**
   * Error handling middleware
   */
  errorHandler(err, req, res, next) {
    logger.error('API Gateway Error:', {
      error: err.message,
      stack: err.stack,
      method: req.method,
      path: req.path,
      userId: req.user?.id
    });

    // Audit log for errors
    auditLog(AUDIT_EVENTS.SYSTEM_ERROR, {
      action: 'api_gateway_error',
      error: err.message,
      method: req.method,
      path: req.path,
      userId: req.user?.id
    }, req.user, {
      error: err.message,
      method: req.method,
      path: req.path
    });

    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Service discovery middleware
   */
  async serviceDiscovery(req, res, next) {
    const serviceName = req.path.split('/')[2]; // /api/service/...
    
    if (!this.services.has(serviceName)) {
      return res.status(404).json({ error: 'Service not found' });
    }

    req.service = this.services.get(serviceName);
    next();
  }

  /**
   * Cache middleware for GET requests
   */
  async cacheResponse(req, res, next) {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${this.cachePrefix}${req.originalUrl}`;
    
    try {
      const cachedResponse = await cacheManager.get(cacheKey);
      if (cachedResponse) {
        return res.json(cachedResponse);
      }

      // Store original send method
      const originalSend = res.json;
      
      // Override send method to cache response
      res.json = function(data) {
        cacheManager.set(cacheKey, data, { ttl: 300 }); // 5 minutes
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  }

  /**
   * Load balancing middleware (simple round-robin)
   */
  loadBalance(instances) {
    let currentIndex = 0;
    
    return (req, res, next) => {
      if (instances.length === 0) {
        return res.status(503).json({ error: 'No available instances' });
      }

      req.targetInstance = instances[currentIndex];
      currentIndex = (currentIndex + 1) % instances.length;
      next();
    };
  }

  /**
   * Circuit breaker middleware
   */
  circuitBreaker(options = {}) {
    const { failureThreshold = 5, timeout = 60000 } = options;
    const states = new Map();

    return (req, res, next) => {
      const serviceKey = req.path.split('/')[2];
      const state = states.get(serviceKey) || { failures: 0, lastFailure: 0, state: 'CLOSED' };

      // Check if circuit is open
      if (state.state === 'OPEN') {
        const now = Date.now();
        if (now - state.lastFailure > timeout) {
          state.state = 'HALF_OPEN';
        } else {
          return res.status(503).json({ error: 'Service temporarily unavailable' });
        }
      }

      // Track failures
      const originalSend = res.json;
      res.json = function(data) {
        if (res.statusCode >= 500) {
          state.failures++;
          state.lastFailure = Date.now();
          
          if (state.failures >= failureThreshold) {
            state.state = 'OPEN';
          }
        } else {
          state.failures = 0;
          state.state = 'CLOSED';
        }
        
        states.set(serviceKey, state);
        return originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Request validation middleware
   */
  validateRequest(schema) {
    return (req, res, next) => {
      try {
        const { error } = schema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: error.details[0].message });
        }
        next();
      } catch (error) {
        logger.error('Request validation error:', error);
        res.status(400).json({ error: 'Invalid request data' });
      }
    };
  }

  /**
   * Response transformation middleware
   */
  transformResponse(transformer) {
    return (req, res, next) => {
      const originalSend = res.json;
      
      res.json = function(data) {
        const transformedData = transformer(data, req);
        return originalSend.call(this, transformedData);
      };

      next();
    };
  }

  /**
   * Metrics collection middleware
   */
  collectMetrics(req, res, next) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      // Send metrics to monitoring system
      messageQueue.addJob('metrics', {
        type: 'api_request',
        data: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          userId: req.user?.id,
          timestamp: new Date().toISOString()
        }
      }, { priority: 4 });
    });

    next();
  }

  /**
   * Setup routes
   */
  setupRoutes() {
    // Global middleware
    this.router.use(this.logRequest);
    this.router.use(this.collectMetrics);
    this.router.use(this.rateLimit());
    this.router.use(this.circuitBreaker());
    this.router.use(this.cacheResponse);

    // Service discovery
    this.router.use('/api/:service/*', this.serviceDiscovery);

    // User routes
    this.router.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        const result = await userService.authenticateUser(email, password);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.router.post('/api/auth/register', async (req, res) => {
      try {
        const result = await userService.createUser(req.body);
        res.status(201).json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Protected routes
    this.router.use('/api/users/*', this.authenticate);
    this.router.use('/api/admin/*', this.authenticate, this.authorize('admin'));

    // User profile routes
    this.router.get('/api/users/profile', async (req, res) => {
      try {
        const user = await userService.getUserById(req.user.id);
        res.json(user);
      } catch (error) {
        res.status(404).json({ error: error.message });
      }
    });

    this.router.put('/api/users/profile', async (req, res) => {
      try {
        const user = await userService.updateUser(req.user.id, req.body);
        res.json(user);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Product routes
    this.router.get('/api/products', async (req, res) => {
      try {
        const products = await productService.getProducts(req.query, req.query);
        res.json(products);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.router.get('/api/products/:id', async (req, res) => {
      try {
        const product = await productService.getProductById(req.params.id);
        res.json(product);
      } catch (error) {
        res.status(404).json({ error: error.message });
      }
    });

    this.router.get('/api/products/search/:query', async (req, res) => {
      try {
        const products = await productService.searchProducts(req.params.query, req.query);
        res.json(products);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Admin product routes
    this.router.post('/api/admin/products', this.authorize('admin'), async (req, res) => {
      try {
        const product = await productService.createProduct(req.body);
        res.status(201).json(product);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.router.put('/api/admin/products/:id', this.authorize('admin'), async (req, res) => {
      try {
        const product = await productService.updateProduct(req.params.id, req.body);
        res.json(product);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.router.delete('/api/admin/products/:id', this.authorize('admin'), async (req, res) => {
      try {
        await productService.deleteProduct(req.params.id);
        res.json({ success: true });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Error handling
    this.router.use(this.errorHandler);
  }

  /**
   * Get gateway statistics
   */
  async getGatewayStats() {
    try {
      const stats = {
        services: this.services.size,
        routes: this.routes.size,
        middleware: this.middleware.size,
        timestamp: new Date().toISOString()
      };

      return stats;
    } catch (error) {
      logger.error('Get gateway stats failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const apiGateway = new APIGateway();

module.exports = {
  APIGateway,
  apiGateway
}; 