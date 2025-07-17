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
require('./models/PageAsset');

// Enhanced Error Handling
const { 
  errorHandler, 
  asyncHandler, 
  timeoutHandler,
  notFoundHandler 
} = require('./middlewares/errorHandler/standardizedErrorHandler');

// Enhanced Security Middleware
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

// Advanced Systems
const { cacheManager } = require('./utils/advancedCache');
const { messageQueue, jobProcessors } = require('./utils/messageQueue');

// Services
const { userService } = require('./services/userService');
const { productService } = require('./services/productService');

// Utilities
const logCleanup = require('./utils/logCleanup');
const compression = require('compression');
const hpp = require('hpp');

const app = express();

// Parse JSON bodies FIRST, before any other middleware or routes
app.use(express.json({ limit: '1mb' }));

// Enhanced database initialization with proper error handling
const initializeDatabase = async () => {
  try {
    logger.info('Starting database initialization...');
    console.log('>>> [initDB] Connecting to DB');
    await connectDB();
    logger.info('Database connected successfully');
    console.log('>>> [initDB] DB connected');

    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('>>> [initDB] Models registered');

    // Verify models are registered before creating indexes
    const mongoose = require('mongoose');
    const registeredModels = Object.keys(mongoose.models);
    logger.info('Registered models:', { models: registeredModels });
    console.log('>>> [initDB] Registered models:', registeredModels);

    // Initialize database indexes with enhanced optimizer
    try {
      const indexResults = await dbOptimizer.createIndexes();
      console.log('>>> [initDB] Indexes created');
      if (indexResults.created.length > 0) {
        logger.info('Database indexes created successfully', {
          created: indexResults.created.length,
          skipped: indexResults.skipped.length,
          failed: indexResults.failed.length
        });
      } else if (indexResults.skipped.length > 0) {
        logger.info('Database indexes already exist', {
          skipped: indexResults.skipped.length
        });
      }
      if (indexResults.failed.length > 0) {
        logger.warn('Some database indexes failed to create', {
          failed: indexResults.failed
        });
      }
    } catch (indexError) {
      logger.warn('Database index creation failed, continuing without indexes', {
        error: indexError.message
      });
      console.error('>>> [initDB] Index creation failed:', indexError);
    }

    // Start database performance monitoring
    const stopMonitoring = dbOptimizer.startPerformanceMonitoring();
    logger.info('Database performance monitoring started');
    console.log('>>> [initDB] Performance monitoring started');

    // Initialize cache system with proper error handling and timeout
    try {
      const cacheInitPromise = cacheManager.initialize();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Cache initialization timed out')), 2000));
      await Promise.race([cacheInitPromise, timeoutPromise]);
      logger.info('Cache system initialized successfully');
      console.log('>>> [initDB] Cache system initialized');
    } catch (cacheError) {
      logger.warn('Cache system initialization failed or timed out, continuing without cache', {
        error: cacheError.message
      });
      console.error('>>> [initDB] Cache system failed or timed out:', cacheError);
    }

    // Initialize message queue with proper error handling
    try {
      messageQueue.start();
      logger.info('Message queue started successfully');
      console.log('>>> [initDB] Message queue started');
      // Create default queues with optimized settings
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
      // Start queue processors
      messageQueue.processQueue('email', jobProcessors.email);
      messageQueue.processQueue('notifications', jobProcessors.notification);
      messageQueue.processQueue('exports', jobProcessors.export);
      messageQueue.processQueue('image-processing', jobProcessors.imageProcessing);
      logger.info('Queue processors started successfully');
      console.log('>>> [initDB] Queue processors started');
    } catch (queueError) {
      logger.warn('Message queue initialization failed, continuing without queue', {
        error: queueError.message
      });
      console.error('>>> [initDB] Message queue failed:', queueError);
    }

    // Generate API documentation
    try {
      const docFiles = await apiDocGenerator.saveDocumentation('./docs');
      logger.info('API documentation generated successfully', { files: docFiles });
      console.log('>>> [initDB] API documentation generated');
    } catch (docError) {
      logger.warn('API documentation generation failed', { error: docError.message });
      console.error('>>> [initDB] API documentation failed:', docError);
    }

    logger.info('Database initialization completed successfully');
    console.log('>>> [initDB] Database initialization completed successfully');
    return stopMonitoring;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    console.error('Database initialization failed:', error);
    if (config.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

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
const sanitizer = require('./middlewares/sanitizer');
app.use(sanitizer);

// 6. Request validation
app.use(validateBodySize(2 * 1024 * 1024)); // 2MB limit
app.use(validateHeaders);

// 7. Static File Serving Middleware
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));

// --- END OF CRITICAL CONFIGURATION ---

// Enhanced health check endpoint
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
app.use('/api/pages', require('./routes/pageAssetRoutes'));

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
    logger.info('Starting server initialization...');
    console.log('>>> Before initializeDatabase');
    // Initialize database and optimizations
    stopMonitoring = await initializeDatabase();
    console.log('>>> After initializeDatabase');
    // Start server
    console.log('>>> About to call app.listen');
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info('Server started successfully', {
        port: PORT,
        environment: config.NODE_ENV,
        corsOrigin: config.CORS_ORIGIN,
        documentation: `http://localhost:${PORT}/docs`,
        healthCheck: `http://localhost:${PORT}/api/health`,
        cacheStats: `http://localhost:${PORT}/api/cache/stats`,
        queueStats: `http://localhost:${PORT}/api/queue/stats`
      });
      console.log('>>> app.listen callback called');
    });
    console.log('>>> app.listen returned, server object:', !!server);
    
    server.on('error', (err) => {
      logger.error('Server failed to start:', err);
      console.error('Server failed to start:', err);
    });

    // Enable connection tracking
    trackConnections(server);

    // Enhanced graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, starting graceful shutdown`);
      
      try {
        // Stop accepting new requests
        server.close(() => {
          logger.info('HTTP server closed');
        });

        // Stop message queue
        await messageQueue.stop();
        logger.info('Message queue stopped');
        
        // Close cache connections
        await cacheManager.close();
        logger.info('Cache connections closed');

        // Stop performance monitoring
        if (stopMonitoring) {
          stopMonitoring();
          logger.info('Performance monitoring stopped');
        }

        // Close database connection
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Global unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('Unhandled Rejection at:', { promise, reason });
});

module.exports = app;





