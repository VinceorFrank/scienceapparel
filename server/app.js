const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/database');
const config = require('./config/env');

// Import all models to ensure they are registered
require('./models/User');
require('./models/Product');
require('./models/Order');
require('./models/Category');
require('./models/Cart');
require('./models/ActivityLog');
require('./models/Payment');
require('./models/ShippingSettings');
require('./models/Support');
require('./models/NewsletterCampaign');
require('./models/NewsletterSubscriber');

// Enhanced Error Handling
const { 
  errorHandler, 
  asyncHandler, 
  timeoutHandler,
  notFoundHandler 
} = require('./middlewares/errorHandler/standardizedErrorHandler');

// Enhanced Security Middleware
const { comprehensiveSanitizer } = require('./middlewares/security/enhancedSanitizer');
const { 
  contentSecurityPolicy 
} = require('./middlewares/security/contentSecurityPolicy');
const { 
  validateBodySize, 
  validateHeaders 
} = require('./middlewares/security/requestValidation');

// Enhanced RBAC
const { requirePermission, requireRole } = require('./middlewares/rbac');
const { PERMISSIONS, ROLES } = require('./middlewares/rbac');

// Enhanced Rate Limiting
const { dynamicRateLimiter, trackRateLimitStats } = require('./middlewares/rateLimiter');

// Enhanced Logging and Monitoring
const { requestLogger, errorLogger, logger } = require('./utils/logger');
const { trackRequest, trackConnections } = require('./utils/monitoring');
const { auditLog, AUDIT_EVENTS } = require('./utils/auditLogger');

// Database Optimization
const { dbOptimizer } = require('./utils/databaseOptimizer');

// API Documentation
const { apiDocGenerator } = require('./utils/apiDocumentation');

// Phase 3: Advanced Systems
const { cacheManager } = require('./utils/advancedCache');
const { messageQueue, jobProcessors } = require('./utils/messageQueue');

// Phase 4: Enterprise Features
const { userService } = require('./services/userService');
const { productService } = require('./services/productService');
const { apiGateway } = require('./gateway/apiGateway');
const { serviceMesh } = require('./mesh/serviceMesh');
const { prometheusMetrics } = require('./monitoring/prometheusMetrics');

// Utilities
const logCleanup = require('./utils/logCleanup');
const compression = require('compression');
const hpp = require('hpp');

const app = express();

// Parse JSON bodies FIRST, before any other middleware or routes
app.use(express.json({ limit: '1mb' }));

// Enhanced database initialization with advanced systems
const initializeDatabase = async () => {
  try {
    console.log('🔍 [DEBUG] initializeDatabase: Starting database connection...');
    // Connect to database
    await connectDB();
    console.log('🔍 [DEBUG] initializeDatabase: Database connected successfully');
    
    // Wait for all models to be properly registered
    console.log('🔍 [DEBUG] initializeDatabase: Waiting for models to register...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('🔍 [DEBUG] initializeDatabase: Models registration wait completed');
    
    // Verify models are registered before creating indexes
    const mongoose = require('mongoose');
    const registeredModels = Object.keys(mongoose.models);
    logger.info('Registered models:', { models: registeredModels });
    console.log('🔍 [DEBUG] initializeDatabase: Models verified, creating indexes...');
    
    // Initialize database indexes with enhanced optimizer
    try {
      const indexResults = await dbOptimizer.createIndexes();
      console.log('🔍 [DEBUG] initializeDatabase: Index creation completed');
      
      if (indexResults.created.length > 0) {
        logger.info('✅ Database indexes created successfully', {
          created: indexResults.created.length,
          skipped: indexResults.skipped.length,
          failed: indexResults.failed.length
        });
      } else if (indexResults.skipped.length > 0) {
        logger.info('⏭️ Database indexes already exist', {
          skipped: indexResults.skipped.length
        });
      }
      
      if (indexResults.failed.length > 0) {
        logger.warn('⚠️ Some database indexes failed to create', {
          failed: indexResults.failed
        });
      }
    } catch (indexError) {
      logger.warn('⚠️ Database index creation failed, continuing without indexes', {
        error: indexError.message
      });
    }

    // Start database performance monitoring
    console.log('🔍 [DEBUG] initializeDatabase: Starting performance monitoring...');
    const stopMonitoring = dbOptimizer.startPerformanceMonitoring();
    logger.info('📊 Database performance monitoring started');
    console.log('🔍 [DEBUG] initializeDatabase: Performance monitoring started');

    // Initialize advanced systems with better error handling
    console.log('🔍 [DEBUG] initializeDatabase: Starting advanced systems initialization...');
    try {
      // Initialize cache system with retry logic
      console.log('🔍 [DEBUG] initializeDatabase: Initializing cache system...');
      
      // TEMPORARILY SKIP CACHE INITIALIZATION TO GET SERVER STARTED
      console.log('🔍 [DEBUG] initializeDatabase: SKIPPING cache initialization for now...');
      logger.info('⚠️ Cache initialization skipped for development');
      
      /*
      let cacheInitialized = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      // Add timeout to prevent hanging
      const cacheInitPromise = (async () => {
        while (!cacheInitialized && retryCount < maxRetries) {
          try {
            await cacheManager.initialize();
            cacheInitialized = true;
            logger.info('✅ Cache system initialized');
            console.log('🔍 [DEBUG] initializeDatabase: Cache system initialized successfully');
          } catch (error) {
            retryCount++;
            if (retryCount >= maxRetries) {
              logger.warn('⚠️ Cache system initialization failed after retries, continuing without cache', {
                error: error.message,
                retryCount
              });
              console.log('🔍 [DEBUG] initializeDatabase: Cache system failed after retries, continuing...');
            } else {
              logger.warn(`⚠️ Cache initialization attempt ${retryCount} failed, retrying...`, {
                error: error.message
              });
              console.log(`🔍 [DEBUG] initializeDatabase: Cache attempt ${retryCount} failed, retrying...`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
            }
          }
        }
      })();
      
      // Add timeout to prevent hanging
      const cacheTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Cache initialization timeout')), 10000); // 10 second timeout
      });
      
      try {
        await Promise.race([cacheInitPromise, cacheTimeout]);
      } catch (error) {
        logger.warn('⚠️ Cache initialization timed out, continuing without cache', {
          error: error.message
        });
        console.log('🔍 [DEBUG] initializeDatabase: Cache initialization timed out, continuing...');
      }
      */
      
      // Initialize message queue with better error handling
      console.log('🔍 [DEBUG] initializeDatabase: Starting message queue...');
      try {
        messageQueue.start();
        logger.info('✅ Message queue started');
        console.log('🔍 [DEBUG] initializeDatabase: Message queue started successfully');
        
        // Create default queues with optimized settings
        console.log('🔍 [DEBUG] initializeDatabase: Creating message queues...');
        messageQueue.createQueue('email', { 
          concurrency: 2, 
          retryAttempts: 3, 
          retryDelay: 5000,
          timeout: 30000 
        });
        messageQueue.createQueue('notifications', { 
          concurrency: 3, 
          retryAttempts: 2, 
          retryDelay: 3000,
          timeout: 15000 
        });
        messageQueue.createQueue('exports', { 
          concurrency: 1, 
          retryAttempts: 5, 
          retryDelay: 10000,
          timeout: 60000 
        });
        messageQueue.createQueue('image-processing', { 
          concurrency: 2, 
          retryAttempts: 3, 
          retryDelay: 5000,
          timeout: 45000 
        });
        console.log('🔍 [DEBUG] initializeDatabase: Message queues created');
        
        // Start queue processors
        console.log('🔍 [DEBUG] initializeDatabase: Starting queue processors...');
        messageQueue.processQueue('email', jobProcessors.email);
        messageQueue.processQueue('notifications', jobProcessors.notification);
        messageQueue.processQueue('exports', jobProcessors.export);
        messageQueue.processQueue('image-processing', jobProcessors.imageProcessing);
        
        logger.info('✅ Queue processors started');
        console.log('🔍 [DEBUG] initializeDatabase: Queue processors started successfully');
      } catch (error) {
        logger.warn('⚠️ Message queue initialization failed, continuing without queue', {
          error: error.message
        });
        console.log('🔍 [DEBUG] initializeDatabase: Message queue failed, continuing...');
      }
      
    } catch (error) {
      logger.error('Failed to initialize advanced systems:', error);
      console.log('🔍 [DEBUG] initializeDatabase: Advanced systems failed:', error.message);
      await auditLog(AUDIT_EVENTS.SYSTEM_ERROR, {
        action: 'advanced_systems_initialization_failed',
        error: error.message
      }, null, {
        error: error.message,
        stack: error.stack
      });
    }

    // Initialize Phase 4: Enterprise Features with better error handling
    /*
    try {
      // Initialize Prometheus metrics
      console.log('🔍 [DEBUG] initializeDatabase: Initializing Prometheus metrics...');
      prometheusMetrics.initializeDefaultMetrics();
      logger.info('✅ Prometheus metrics initialized');
      console.log('🔍 [DEBUG] initializeDatabase: Prometheus metrics initialized');

      // Register services in API Gateway
      console.log('🔍 [DEBUG] initializeDatabase: Registering API Gateway services...');
      apiGateway.registerService('user', userService);
      apiGateway.registerService('product', productService);
      logger.info('✅ API Gateway services registered');
      console.log('🔍 [DEBUG] initializeDatabase: API Gateway services registered');

      // Register services in Service Mesh
      console.log('🔍 [DEBUG] initializeDatabase: Registering Service Mesh services...');
      serviceMesh.registerService('user-service', {
        instances: [
          { id: 'user-1', url: 'http://user-service-1:3001' },
          { id: 'user-2', url: 'http://user-service-2:3002' }
        ],
        loadBalancer: 'round-robin',
        circuitBreaker: { failureThreshold: 3, timeout: 30000 }
      });

      serviceMesh.registerService('product-service', {
        instances: [
          { id: 'product-1', url: 'http://product-service-1:3003' },
          { id: 'product-2', url: 'http://product-service-2:3004' }
        ],
        loadBalancer: 'least-connections',
        circuitBreaker: { failureThreshold: 5, timeout: 60000 }
      });
      console.log('🔍 [DEBUG] initializeDatabase: Service Mesh services registered');

      // Start service mesh
      console.log('🔍 [DEBUG] initializeDatabase: Starting service mesh...');
      serviceMesh.start();
      logger.info('✅ Service mesh started');
      console.log('🔍 [DEBUG] initializeDatabase: Service mesh started');

      // Setup API Gateway routes
      console.log('🔍 [DEBUG] initializeDatabase: Setting up API Gateway routes...');
      apiGateway.setupRoutes();
      logger.info('✅ API Gateway routes configured');
      console.log('🔍 [DEBUG] initializeDatabase: API Gateway routes configured');

    } catch (error) {
      logger.error('Failed to initialize enterprise features:', error);
      console.log('🔍 [DEBUG] initializeDatabase: Enterprise features failed:', error.message);
      await auditLog(AUDIT_EVENTS.SYSTEM_ERROR, {
        action: 'enterprise_features_initialization_failed',
        error: error.message
      }, null, {
        error: error.message,
        stack: error.stack
      });
    }
    */

    // Generate API documentation
    console.log('🔍 [DEBUG] initializeDatabase: Generating API documentation...');
    try {
      const docFiles = await apiDocGenerator.saveDocumentation('./docs');
      logger.info('📚 API documentation generated successfully', { files: docFiles });
      console.log('🔍 [DEBUG] initializeDatabase: API documentation generated');
    } catch (docError) {
      logger.warn('⚠️ API documentation generation failed', { error: docError.message });
      console.log('🔍 [DEBUG] initializeDatabase: API documentation failed:', docError.message);
    }

    console.log('🔍 [DEBUG] initializeDatabase: All initialization completed successfully');
    return stopMonitoring;
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    console.log('🔍 [DEBUG] initializeDatabase: Failed with error:', error.message);
    if (config.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

// Database will be initialized in startServer function

// Schedule log cleanup (run every 24 hours)
logCleanup.scheduleCleanup(24);

// Schedule cart cleanup (run every 24 hours)
const { scheduleCartCleanup } = require('./utils/cartCleanup');
scheduleCartCleanup(24);

// Newsletter Scheduler (Secure Implementation)
const newsletterScheduler = require('./utils/newsletterScheduler');

// Start newsletter scheduler with proper error handling
try {
  newsletterScheduler.start(1); // Run every minute
  logger.info('Newsletter scheduler initialized successfully');
} catch (error) {
  logger.error('Failed to start newsletter scheduler', {
    error: error.message,
    stack: error.stack
  });
}

// --- START OF CRITICAL CONFIGURATION ---

// 0. Upload route BEFORE body parsers
app.use('/api/upload', require('./routes/upload'));

// 1. JSON and URL-encoded parser middleware
// app.use(express.urlencoded({ extended: true, limit: '1mb' })); // Disabled to fix array/object issue for JSON APIs

// Apply performance and security middleware
app.use(compression());
app.use(hpp());

// 2. CORS Middleware
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));

// 3. Advanced Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// 4. Content Security Policy
app.use(contentSecurityPolicy);

// 5. Enhanced input sanitization
const sanitizerMiddlewares = comprehensiveSanitizer({
  removeHtml: true,
  removeScripts: true,
  removeMongoOperators: true,
  maxDepth: 10
});

sanitizerMiddlewares.forEach(middleware => {
  app.use(middleware);
});

// 6. Request validation
app.use(validateBodySize(2 * 1024 * 1024)); // 2MB limit
app.use(validateHeaders);

// 7. Static File Serving Middleware
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));

// --- END OF CRITICAL CONFIGURATION ---

// Enhanced health check endpoint with advanced system status
app.get('/api/health', asyncHandler(async (req, res) => {
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    }
  };

  // Check database connection
  const db = require('mongoose').connection;
  if (db.readyState === 1) {
    healthStatus.database = 'connected';
  } else {
    healthStatus.database = 'disconnected';
    healthStatus.status = 'WARNING';
  }

  // Check cache system
  try {
    const cacheStatus = await cacheManager.healthCheck();
    healthStatus.cache = cacheStatus;
  } catch (error) {
    healthStatus.cache = { status: 'error', error: error.message };
  }

  // Check message queue
  try {
    const queueStatus = messageQueue.getStats();
    healthStatus.messageQueue = {
      status: queueStatus.isRunning ? 'running' : 'stopped',
      activeWorkers: queueStatus.jobs.activeWorkers,
      totalJobs: queueStatus.jobs.totalJobs
    };
  } catch (error) {
    healthStatus.messageQueue = { status: 'error', error: error.message };
  }

  // Check service mesh
  try {
    const meshStatus = serviceMesh.getMeshStatus();
    healthStatus.serviceMesh = {
      status: meshStatus.isRunning ? 'running' : 'stopped',
      services: meshStatus.services,
      policies: meshStatus.policies
    };
  } catch (error) {
    healthStatus.serviceMesh = { status: 'error', error: error.message };
  }

  // Check API Gateway
  try {
    const gatewayStats = await apiGateway.getGatewayStats();
    healthStatus.apiGateway = {
      status: gatewayStats.services > 0 ? 'active' : 'inactive',
      services: gatewayStats.services,
      routes: gatewayStats.routes
    };
  } catch (error) {
    healthStatus.apiGateway = { status: 'error', error: error.message };
  }

  // Check metrics
  try {
    const metricsSummary = prometheusMetrics.getMetricsSummary();
    healthStatus.metrics = {
      status: metricsSummary.totalMetrics > 0 ? 'active' : 'inactive',
      totalMetrics: metricsSummary.totalMetrics,
      uptime: metricsSummary.uptime
    };
  } catch (error) {
    healthStatus.metrics = { status: 'error', error: error.message };
  }

  const statusCode = healthStatus.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(healthStatus);
}));

// Cache statistics endpoint
app.get('/api/cache/stats', asyncHandler(async (req, res) => {
  try {
    const stats = cacheManager.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Cache stats error:', error);
    res.status(500).json({ error: error.message });
  }
}));

// Message queue statistics endpoint
app.get('/api/queue/stats', asyncHandler(async (req, res) => {
  try {
    const stats = messageQueue.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Queue stats error:', error);
    res.status(500).json({ error: error.message });
  }
}));

// Service mesh statistics endpoint
app.get('/api/mesh/stats', asyncHandler(async (req, res) => {
  try {
    const stats = serviceMesh.getMeshStatus();
    res.json(stats);
  } catch (error) {
    logger.error('Service mesh stats error:', error);
    res.status(500).json({ error: error.message });
  }
}));

// API Gateway statistics endpoint
app.get('/api/gateway/stats', asyncHandler(async (req, res) => {
  try {
    const stats = await apiGateway.getGatewayStats();
    res.json(stats);
  } catch (error) {
    logger.error('API Gateway stats error:', error);
    res.status(500).json({ error: error.message });
  }
}));

// Prometheus metrics endpoint
app.get('/metrics', asyncHandler(async (req, res) => {
  try {
    const metrics = prometheusMetrics.generatePrometheusFormat();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('Metrics error:', error);
    res.status(500).json({ error: error.message });
  }
}));

// Metrics summary endpoint
app.get('/api/metrics/summary', asyncHandler(async (req, res) => {
  try {
    const summary = prometheusMetrics.getMetricsSummary();
    res.json(summary);
  } catch (error) {
    logger.error('Metrics summary error:', error);
    res.status(500).json({ error: error.message });
  }
}));

// API Documentation endpoints
app.get('/api/docs', asyncHandler(async (req, res) => {
  const openAPISpec = apiDocGenerator.generateOpenAPISpec();
  res.json(openAPISpec);
}));

app.get('/docs', asyncHandler(async (req, res) => {
  const htmlDocs = apiDocGenerator.generateHTMLDocs();
  res.set('Content-Type', 'text/html');
  res.send(htmlDocs);
}));

// Other Middlewares
app.use(trackRateLimitStats);
app.use(trackRequest);
app.use(dynamicRateLimiter);
app.use(requestLogger);

// Enhanced API Routes with RBAC and Security
// Public routes (no authentication required)
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));

// User routes (customer authentication required)
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/shipping', require('./routes/shipping'));
app.use('/api/payment', require('./routes/payment'));

// Admin routes (admin authentication and specific permissions required)
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/support', require('./routes/support'));
app.use('/api/admin/activity-logs', require('./routes/activityLog'));
app.use('/api/admin/csv-import', require('./routes/csvImport'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/monitoring', require('./routes/monitoring'));
app.use('/api/security', require('./routes/security'));

// Analytics routes (specific permissions required)
app.use('/api/stats', require('./routes/stats'));

// API Documentation (public access)
app.use('/api/docs', require('./routes/docs'));

// Enhanced Error Handling Middleware (must be last)
app.use(notFoundHandler);
app.use(errorLogger);
app.use(errorHandler);

// Enhanced server startup with graceful shutdown
const PORT = config.PORT;
let stopMonitoring = null;

const startServer = async () => {
  try {
    console.log('🔍 [DEBUG] Starting server initialization...');
    console.log('🔍 [DEBUG] PORT =', PORT);
    console.log('🔍 [DEBUG] config.PORT =', config.PORT);
    
    // Initialize database and optimizations
    console.log('🔍 [DEBUG] Calling initializeDatabase()...');
    stopMonitoring = await initializeDatabase();
    console.log('🔍 [DEBUG] initializeDatabase() completed successfully');
    
    // Start server
    console.log('🔍 [DEBUG] About to call app.listen() on port', PORT);
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info('🚀 Server started successfully', {
        port: PORT,
        environment: config.NODE_ENV,
        corsOrigin: config.CORS_ORIGIN,
        documentation: `http://localhost:${PORT}/docs`,
        healthCheck: `http://localhost:${PORT}/api/health`,
        cacheStats: `http://localhost:${PORT}/api/cache/stats`,
        queueStats: `http://localhost:${PORT}/api/queue/stats`,
        meshStats: `http://localhost:${PORT}/api/mesh/stats`,
        gatewayStats: `http://localhost:${PORT}/api/gateway/stats`,
        metrics: `http://localhost:${PORT}/metrics`,
        metricsSummary: `http://localhost:${PORT}/api/metrics/summary`
      });
      // Fallback plain log for visibility
      console.log(`🚀 [PLAIN LOG] Server started on port ${PORT} (${config.NODE_ENV})`);
    });
    console.log('🔍 [DEBUG] app.listen() called, server object created');

    // Enable connection tracking
    trackConnections(server);

    // Enhanced graceful shutdown with advanced systems cleanup
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, starting graceful shutdown`);
      
      try {
        // Stop accepting new requests
        server.close(() => {
          logger.info('HTTP server closed');
        });

        // Stop message queue
        await messageQueue.stop();
        logger.info('✅ Message queue stopped');
        
        // Close cache connections
        await cacheManager.close();
        logger.info('✅ Cache connections closed');

        // Stop service mesh
        serviceMesh.stop();
        logger.info('✅ Service mesh stopped');

        // Stop performance monitoring
        if (stopMonitoring) {
          stopMonitoring();
          logger.info('Performance monitoring stopped');
        }

        // Close database connection
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');

        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    // Fallback plain error log
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;





