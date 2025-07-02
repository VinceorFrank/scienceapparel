const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/database');
const config = require('./config/env');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { dynamicRateLimiter, trackRateLimitStats } = require('./middlewares/rateLimiter');
const sanitizer = require('./middlewares/sanitizer-simple');
const { requestLogger, errorLogger, logger } = require('./utils/logger');
const { trackRequest, trackConnections } = require('./utils/monitoring');
const logCleanup = require('./utils/logCleanup');
const compression = require('compression');
const hpp = require('hpp');
const { 
  sanitizeWithRateLimit 
} = require('./middlewares/security/inputSanitizer');
const { 
  contentSecurityPolicy 
} = require('./middlewares/security/contentSecurityPolicy');
const { 
  validateBodySize, 
  validateHeaders 
} = require('./middlewares/security/requestValidation');

// Advanced Security Middleware (temporarily disabled for debugging)
// const { sanitizeWithRateLimit } = require('./middlewares/security/inputSanitizer');
// const { contentSecurityPolicy, strictCSP } = require('./middlewares/security/contentSecurityPolicy');
// const { validateBodySize, validateHeaders } = require('./middlewares/security/requestValidation');

const app = express();

// Parse JSON bodies FIRST, before any other middleware or routes
app.use(express.json({ limit: '1mb' }));

// Connect to database
connectDB();

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

// 5. Input sanitization with rate limiting
app.use(sanitizeWithRateLimit(200)); // 200 requests per 15 min per IP

// 6. Request validation
app.use(validateBodySize(2 * 1024 * 1024)); // 2MB limit
app.use(validateHeaders);

// 7. Static File Serving Middleware
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));

// --- END OF CRITICAL CONFIGURATION ---

// Health check endpoint (move here, before other middleware)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV 
  });
});

// Other Middlewares
app.use(trackRateLimitStats);
app.use(trackRequest);
app.use(dynamicRateLimiter);
app.use(sanitizer);
app.use(requestLogger);

// API Routes with Security Levels
// Public routes (basic security)
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/stats', require('./routes/stats'));

// User routes (enhanced security)
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/shipping', require('./routes/shipping'));

// Admin routes (basic security for now)
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/support', require('./routes/support'));
app.use('/api/admin/activity-logs', require('./routes/activityLog'));
app.use('/api/admin/csv-import', require('./routes/csvImport'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/monitoring', require('./routes/monitoring'));
app.use('/api/security', require('./routes/security'));

// API Documentation (public access)
app.use('/api/docs', require('./routes/docs'));

// Error Handling Middleware (must be last)
app.use(notFound);
app.use(errorLogger);
app.use(errorHandler);

const PORT = config.PORT;
const server = app.listen(PORT, () => {
  logger.info('Server started successfully', {
    port: PORT,
    environment: config.NODE_ENV,
    corsOrigin: config.CORS_ORIGIN
  });
});

// Enable connection tracking
trackConnections(server);

module.exports = app;





