require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // ✅ added
const helmet = require('helmet'); // Security middleware
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { performanceMiddleware } = require('./utils/performance');
const { createAllIndexes } = require('./utils/databaseIndexes');
// const fileUpload = require('express-fileupload');
console.log('Loaded PORT:', process.env.PORT);

// Import security middlewares
const { dynamicRateLimiter } = require('./middlewares/rateLimiter');
const { sanitizeInput } = require('./middlewares/sanitizer');
const { logRequests } = require('./middlewares/requestLogger');
const { securityMiddleware } = require('./middlewares/security');
const { passwordPolicyMiddleware } = require('./middlewares/passwordPolicy');

// Import error handling and validation
const { validateRequest } = require('./middlewares/validators');

// Import performance and caching
const { cacheMiddleware, generateCacheKey } = require('./utils/cache');

// Helper function to safely require routes
const safeRequireRoute = (routePath) => {
  try {
    return require(routePath);
  } catch (error) {
    console.warn(`⚠️ Route file not found: ${routePath}`);
    return null;
  }
};

// Import routes safely
const productRoutes = safeRequireRoute('./routes/products');
const userRoutes = safeRequireRoute('./routes/users');
const orderRoutes = safeRequireRoute('./routes/orders');
const categoryRoutes = safeRequireRoute('./routes/categories');
const dashboardRoutes = safeRequireRoute('./routes/dashboard');
const newsletterRoutes = safeRequireRoute('./routes/newsletter');
const supportRoutes = safeRequireRoute('./routes/support');
const paymentRoutes = safeRequireRoute('./routes/payment');
const uploadRoutes = safeRequireRoute('./routes/upload');

const app = express();

// Apply security middleware first
app.use(securityMiddleware());

// Configure CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Apply rate limiting
app.use(dynamicRateLimiter());

// Apply input sanitization
app.use(sanitizeInput());

// Apply request logging
app.use(logRequests());

// Apply password policy middleware
app.use(passwordPolicyMiddleware());

// Performance monitoring middleware
app.use(performanceMiddleware());

// Basic middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(helmet());
// app.use(fileUpload({
//   limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
//   useTempFiles: true,
//   tempFileDir: '/tmp/'
// }));

// Database connection with enhanced error handling
mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log('✅ MongoDB connected successfully');
  
  // Create database indexes for optimal performance
  if (process.env.NODE_ENV === 'production' || process.env.CREATE_INDEXES === 'true') {
    await createAllIndexes();
  }
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1); // Exit if database connection fails
});

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
});

// Serve static files with CORS headers for images
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:5173');
  }
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Performance metrics endpoint
app.get('/api/performance', (req, res) => {
  const { performanceMonitor } = require('./utils/performance');
  const stats = performanceMonitor.getStats();
  res.json({
    success: true,
    data: stats
  });
});

// Rate limit statistics endpoint
app.get('/api/rate-limits', (req, res) => {
  const { rateLimiter } = require('./middlewares/rateLimiter');
  const stats = rateLimiter.getStats();
  res.json({
    success: true,
    data: stats
  });
});

// Log statistics endpoint
app.get('/api/logs', (req, res) => {
  const { requestLogger } = require('./middlewares/requestLogger');
  const stats = requestLogger.getLogStats();
  res.json({
    success: true,
    data: stats
  });
});

// Password requirements endpoint
app.get('/api/password-requirements', (req, res) => {
  const { getPasswordRequirements } = require('./middlewares/passwordPolicy');
  const requirements = getPasswordRequirements();
  res.json({
    success: true,
    data: requirements
  });
});

// Cache statistics endpoint
app.get('/api/cache', (req, res) => {
  const { cache } = require('./utils/cache');
  const stats = cache.getStats();
  res.json({
    success: true,
    data: stats
  });
});

// Database index information endpoint
app.get('/api/database-indexes', (req, res) => {
  const { getIndexInfo } = require('./utils/databaseIndexes');
  getIndexInfo().then(indexInfo => {
    res.json({
      success: true,
      data: indexInfo
    });
  }).catch(error => {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get database index information',
        statusCode: 500
      }
    });
  });
});

// Mount API routes
if (userRoutes) app.use('/api/users', userRoutes);
if (productRoutes) app.use('/api/products', productRoutes);
if (orderRoutes) app.use('/api/orders', orderRoutes);
if (categoryRoutes) app.use('/api/categories', categoryRoutes);
if (dashboardRoutes) app.use('/api/dashboard', dashboardRoutes);
if (newsletterRoutes) app.use('/api/newsletter', newsletterRoutes);
if (supportRoutes) app.use('/api/support', supportRoutes);
if (paymentRoutes) app.use('/api/payment', paymentRoutes);
if (uploadRoutes) app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Only start server if this is the main module (not during tests)
if (require.main === module) {
  // Start server
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📈 Performance metrics: http://localhost:${PORT}/api/performance`);
    console.log(`🗂️ Database indexes: http://localhost:${PORT}/api/database-indexes`);
    console.log(`🔒 Security enhancements active`);
    console.log(`📝 Request logging enabled`);
    console.log(`⚡ Rate limiting active`);
    console.log(`🧹 Input sanitization active`);
    console.log(`🔐 Password policies enforced`);
    console.log(`💾 Caching system active`);
    console.log(`🗄️ Database indexes optimized`);
  });

  // Handle server errors
  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });

  // Graceful server shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      mongoose.connection.close(() => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      });
    });
  });
}

// Export app for testing
module.exports = app;





