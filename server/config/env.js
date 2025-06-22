// Environment configuration with defaults
require('dotenv').config();

const config = {
  // Database
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-jwt-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
  
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173'
};

// Validate critical environment variables
const validateConfig = () => {
  const required = ['MONGO_URI', 'JWT_SECRET'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.warn('⚠️  Warning: Missing environment variables:', missing.join(', '));
    console.warn('💡 Using fallback values. For production, set these in your .env file');
  }
  
  return config;
};

module.exports = {
  ...validateConfig(),
  validateConfig
}; 