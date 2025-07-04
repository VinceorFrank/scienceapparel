// Environment configuration with enhanced security validation
require('dotenv').config();

const config = {
  // Database
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce',
  
  // JWT - Enhanced security with multiple secrets for rotation
  JWT_SECRET: process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' 
    ? 'dev-jwt-key-2024-super-secure-development-only-not-for-production-use-at-least-64-chars-long'
    : null),
  JWT_SECRET_BACKUP: process.env.JWT_SECRET_BACKUP, // For secret rotation
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // JWT Security Settings
  JWT_ALGORITHM: process.env.JWT_ALGORITHM || 'HS256',
  JWT_ISSUER: process.env.JWT_ISSUER || 'ecommerce-api',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'ecommerce-users',
  
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12, // Increased from 10 to 12
  SESSION_SECRET: process.env.SESSION_SECRET,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  
  // Database Connection Pooling
  DB_POOL_SIZE: parseInt(process.env.DB_POOL_SIZE) || 10,
  
  // Security Headers
  SECURITY_HEADERS_ENABLED: process.env.SECURITY_HEADERS_ENABLED !== 'false',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_RETENTION_DAYS: parseInt(process.env.LOG_RETENTION_DAYS) || 30,
  
  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  
  // API Security
  API_KEY_REQUIRED: process.env.API_KEY_REQUIRED === 'true',
  API_KEY_HEADER: process.env.API_KEY_HEADER || 'x-api-key'
};

// Enhanced JWT secret validation
const validateJWTSecrets = () => {
  const errors = [];
  const warnings = [];
  
  // Check if JWT_SECRET exists
  if (!config.JWT_SECRET) {
    errors.push('JWT_SECRET is required');
    return { errors, warnings };
  }
  
  // Check minimum length (increased for production)
  const minLength = config.NODE_ENV === 'production' ? 64 : 32;
  if (config.JWT_SECRET.length < minLength) {
    errors.push(`JWT_SECRET must be at least ${minLength} characters long for ${config.NODE_ENV} environment`);
  }
  
  // Check for weak secrets (only warn in production or if explicitly set)
  if (config.NODE_ENV === 'production' || (process.env.JWT_SECRET && process.env.JWT_SECRET !== config.JWT_SECRET)) {
    const weakPatterns = [
      'default', 'secret', 'password', 'admin', 'test', 'demo',
      '123456', 'abcdef', 'qwerty', 'asdfgh', 'zxcvbn'
    ];
    
    const secretLower = config.JWT_SECRET.toLowerCase();
    for (const pattern of weakPatterns) {
      if (secretLower.includes(pattern)) {
        warnings.push(`JWT_SECRET should not contain common weak patterns like "${pattern}"`);
      }
    }
    
    // Check for entropy (basic check)
    const uniqueChars = new Set(config.JWT_SECRET).size;
    if (uniqueChars < 20) {
      warnings.push('JWT_SECRET should have higher entropy (more unique characters)');
    }
  }
  
  // Check for backup secret in production
  if (config.NODE_ENV === 'production' && !config.JWT_SECRET_BACKUP) {
    warnings.push('JWT_SECRET_BACKUP is recommended for production secret rotation');
  }
  
  // Validate JWT algorithm
  const validAlgorithms = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'];
  if (!validAlgorithms.includes(config.JWT_ALGORITHM)) {
    errors.push(`JWT_ALGORITHM must be one of: ${validAlgorithms.join(', ')}`);
  }
  
  // Production-specific JWT validations
  if (config.NODE_ENV === 'production') {
    if (config.JWT_EXPIRES_IN === '30d') {
      warnings.push('Consider reducing JWT_EXPIRES_IN for production (e.g., 24h or 7d)');
    }
    
    if (config.JWT_REFRESH_EXPIRES_IN === '7d') {
      warnings.push('Consider reducing JWT_REFRESH_EXPIRES_IN for production (e.g., 30d)');
    }
  }
  
  return { errors, warnings };
};

// Enhanced validation function
const validateConfig = () => {
  const errors = [];
  const warnings = [];
  
  // Critical validations
  if (!config.MONGO_URI) {
    errors.push('MONGO_URI is required');
  }
  
  // JWT validation
  const jwtValidation = validateJWTSecrets();
  errors.push(...jwtValidation.errors);
  warnings.push(...jwtValidation.warnings);
  
  // Environment-specific validations
  if (config.NODE_ENV === 'production') {
    // Production-specific requirements
    const productionRequired = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
    const missingProduction = productionRequired.filter(key => !config[key]);
    
    if (missingProduction.length > 0) {
      warnings.push(`Production environment variables missing: ${missingProduction.join(', ')}`);
    }
    
    // Security warnings for production
    if (config.CORS_ORIGIN === 'http://localhost:5173') {
      warnings.push('CORS_ORIGIN should be set to your production domain');
    }
    
    if (config.BCRYPT_ROUNDS < 12) {
      warnings.push('BCRYPT_ROUNDS should be at least 12 for production');
    }
  }
  
  // Database connection validation
  if (config.MONGO_URI && !config.MONGO_URI.includes('mongodb://') && !config.MONGO_URI.includes('mongodb+srv://')) {
    errors.push('MONGO_URI must be a valid MongoDB connection string');
  }
  
  // Port validation
  const port = parseInt(config.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT must be a valid port number between 1 and 65535');
  }
  
  // Rate limiting validation
  if (config.RATE_LIMIT_MAX_REQUESTS < 1) {
    errors.push('RATE_LIMIT_MAX_REQUESTS must be at least 1');
  }
  
  if (config.RATE_LIMIT_WINDOW_MS < 1000) {
    errors.push('RATE_LIMIT_WINDOW_MS must be at least 1000ms');
  }
  
  // Log validation results
  if (errors.length > 0) {
    console.error('❌ Critical Configuration Errors:');
    errors.forEach(error => console.error(`   - ${error}`));
    
    if (config.NODE_ENV === 'production') {
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  Configuration Warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Configuration validation passed');
  }
  
  return config;
};

// Database connection options (updated for modern Mongoose/MongoDB)
const getDatabaseOptions = () => {
  return {
    // Modern MongoDB connection options
    maxPoolSize: config.DB_POOL_SIZE,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    
    // Connection timeouts
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    
    // Write concerns (updated for modern MongoDB)
    w: 'majority',
    journal: true, // Updated from 'j' to 'journal'
    wtimeoutMS: 10000, // Updated from 'wtimeout' to 'wtimeoutMS'
    
    // Read preferences
    readPreference: 'primaryPreferred',
    
    // Retry settings
    retryWrites: true,
    retryReads: true,
    
    // Compression
    compressors: ['zlib'],
    zlibCompressionLevel: 6,
    
    // SSL for production
    ssl: config.NODE_ENV === 'production',
    
    // Authentication
    authSource: 'admin'
  };
};

// Enhanced security configuration
const getSecurityConfig = () => {
  return {
    bcryptRounds: config.BCRYPT_ROUNDS,
    jwtSecret: config.JWT_SECRET,
    jwtSecretBackup: config.JWT_SECRET_BACKUP,
    jwtExpiresIn: config.JWT_EXPIRES_IN,
    jwtRefreshSecret: config.JWT_REFRESH_SECRET,
    jwtRefreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN,
    jwtAlgorithm: config.JWT_ALGORITHM,
    jwtIssuer: config.JWT_ISSUER,
    jwtAudience: config.JWT_AUDIENCE,
    rateLimitWindowMs: config.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: config.RATE_LIMIT_MAX_REQUESTS,
    maxFileSize: config.MAX_FILE_SIZE,
    allowedFileTypes: config.ALLOWED_FILE_TYPES,
    securityHeadersEnabled: config.SECURITY_HEADERS_ENABLED
  };
};

// JWT configuration helper
const getJWTConfig = () => {
  return {
    secret: config.JWT_SECRET,
    secretBackup: config.JWT_SECRET_BACKUP,
    expiresIn: config.JWT_EXPIRES_IN,
    refreshSecret: config.JWT_REFRESH_SECRET,
    refreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN,
    algorithm: config.JWT_ALGORITHM,
    issuer: config.JWT_ISSUER,
    audience: config.JWT_AUDIENCE,
    // Production-specific settings
    production: {
      expiresIn: '24h',
      refreshExpiresIn: '30d',
      algorithm: 'HS512'
    }
  };
};

module.exports = {
  ...validateConfig(),
  validateConfig,
  getDatabaseOptions,
  getSecurityConfig,
  getJWTConfig
}; 