/**
 * Test setup and configuration
 */

// Load environment variables for testing
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
};

// Test utilities
global.testUtils = {
  // Generate test data
  generateTestUser: (overrides = {}) => ({
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'customer',
    isAdmin: false,
    ...overrides
  }),

  generateTestProduct: (overrides = {}) => ({
    name: `Test Product ${Date.now()}`,
    description: 'Test product description',
    price: 99.99,
    stock: 10,
    category: 'test-category',
    image: 'https://example.com/image.jpg',
    featured: false,
    archived: false,
    ...overrides
  }),

  generateTestOrder: (overrides = {}) => ({
    user: '507f1f77bcf86cd799439011',
    products: [
      {
        product: '507f1f77bcf86cd799439012',
        quantity: 2,
        price: 99.99
      }
    ],
    totalPrice: 199.98,
    status: 'pending',
    shippingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country'
    },
    ...overrides
  }),

  // Generate JWT token for testing
  generateTestToken: (user = {}) => {
    const jwt = require('jsonwebtoken');
    const testUser = {
      id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      isAdmin: false,
      role: 'customer',
      ...user
    };
    return jwt.sign(testUser, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  },

  // Clean up test data
  cleanupTestData: async () => {
    const mongoose = require('mongoose');
    const collections = Object.keys(mongoose.connection.collections);
    
    for (const collectionName of collections) {
      const collection = mongoose.connection.collections[collectionName];
      await collection.deleteMany({});
    }
  },

  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock request object
  mockRequest: (overrides = {}) => ({
    method: 'GET',
    url: '/api/test',
    originalUrl: '/api/test',
    path: '/api/test',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'Jest Test Agent',
      ...overrides.headers
    },
    body: {},
    query: {},
    params: {},
    ip: '127.0.0.1',
    user: null,
    ...overrides
  }),

  // Mock response object
  mockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.set = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    res.removeHeader = jest.fn().mockReturnValue(res);
    res.header = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
  },

  // Mock next function
  mockNext: () => jest.fn(),

  // Test database connection
  connectTestDB: async () => {
    const mongoose = require('mongoose');
    const testURI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ecommerce-test';
    
    // Close existing connection if it exists
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    try {
      await mongoose.connect(testURI);
      console.log('✅ Test database connected');
    } catch (error) {
      console.error('❌ Test database connection failed:', error);
      throw error;
    }
  },

  // Disconnect test database
  disconnectTestDB: async () => {
    const mongoose = require('mongoose');
    try {
      await mongoose.connection.close();
      console.log('✅ Test database disconnected');
    } catch (error) {
      console.error('❌ Test database disconnection failed:', error);
    }
  }
};

// Global test hooks
beforeAll(async () => {
  // Connect to test database
  await global.testUtils.connectTestDB();
});

afterAll(async () => {
  // Disconnect from test database
  await global.testUtils.disconnectTestDB();
});

afterEach(async () => {
  // Clean up test data after each test
  await global.testUtils.cleanupTestData();
});

// Export test utilities for use in test files
module.exports = global.testUtils; 