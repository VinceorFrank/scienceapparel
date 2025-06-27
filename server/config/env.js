// Environment configuration with defaults
require('dotenv').config();

const config = {
  // Database
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
  
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS
};

// Validate critical environment variables
const validateConfig = () => {
  const required = ['MONGO_URI', 'JWT_SECRET'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.error('❌ Critical Error: Missing required environment variables:', missing.join(', '));
    console.error('💡 Please set these variables in your .env file');
    
    if (config.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
  
  // Additional production validation
  if (config.NODE_ENV === 'production') {
    const productionRequired = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
    const missingProduction = productionRequired.filter(key => !config[key]);
    
    if (missingProduction.length > 0) {
      console.warn('⚠️  Warning: Missing production environment variables:', missingProduction.join(', '));
      console.warn('💡 Email functionality may not work properly in production');
    }
  }
  
  return config;
};

module.exports = {
  ...validateConfig(),
  validateConfig
}; 