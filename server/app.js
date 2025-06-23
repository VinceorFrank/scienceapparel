const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/database');
const config = require('./config/env');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const rateLimiter = require('./middlewares/rateLimiter');
const sanitizer = require('./middlewares/sanitizer-simple');
const { morganRequestLogger } = require('./middlewares/requestLogger');
const compression = require('compression');
const hpp = require('hpp');

const app = express();

// DEBUG: Log all incoming requests
app.use((req, res, next) => {
  console.log('DEBUG: Incoming request', req.method, req.url, req.headers['content-type']);
  next();
});

// Connect to database
connectDB();

// --- START OF CRITICAL CONFIGURATION ---

// 0. Upload route BEFORE body parsers
app.use('/api/upload', require('./routes/upload'));

// 1. JSON and URL-encoded parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply performance and security middleware
app.use(compression());
app.use(hpp());

// 2. CORS Middleware
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));

// 3. Helmet Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// 4. Static File Serving Middleware
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));

// --- END OF CRITICAL CONFIGURATION ---

// Other Middlewares
app.use(rateLimiter);
app.use(sanitizer);
app.use(morganRequestLogger);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV 
  });
});

// API Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/admin/dashboard', require('./routes/dashboard'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/support', require('./routes/support'));
app.use('/api/admin/activity-logs', require('./routes/activityLog'));

// Error Handling Middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
  console.log(`🔗 CORS Origin: ${config.CORS_ORIGIN}`);
});

module.exports = app;





