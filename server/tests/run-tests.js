/**
 * Test Runner Script
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.MONGO_URI = 'mongodb://localhost:27017/ecommerce-test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.LOG_RETENTION_DAYS = '1';
process.env.SECURITY_LOG_ENABLED = 'true';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';
process.env.PASSWORD_MIN_LENGTH = '8';
process.env.PASSWORD_REQUIRE_SPECIAL_CHARS = 'true';
process.env.CACHE_TTL = '300';
process.env.CACHE_MAX_SIZE = '100';
process.env.PERFORMANCE_SLOW_QUERY_THRESHOLD = '100';
process.env.PERFORMANCE_SLOW_REQUEST_THRESHOLD = '1000';
process.env.CREATE_INDEXES = 'false';

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Starting Test Suite...\n');

try {
  // Run all tests
  console.log('📋 Running all tests...');
  execSync('npm test', { stdio: 'inherit' });
  
  console.log('\n✅ All tests completed successfully!');
} catch (error) {
  console.error('\n❌ Tests failed:', error.message);
  process.exit(1);
} 