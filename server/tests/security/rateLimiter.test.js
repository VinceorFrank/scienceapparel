/**
 * Rate Limiter Tests
 */

const request = require('supertest');
const app = require('../../app');
const { rateLimiter } = require('../../middlewares/rateLimiter');

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Clear rate limiter data before each test
    rateLimiter.requests.clear();
  });

  describe('Rate Limiting Functionality', () => {
    test('should allow requests within rate limit', async () => {
      // Make 5 requests (within auth limit)
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'password' });
        
        expect(response.status).not.toBe(429);
      }
    });

    test('should block requests exceeding rate limit', async () => {
      // Make 6 requests (exceeding auth limit of 5)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'password' });
      }

      // 6th request should be blocked
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Too many requests');
    });

    test('should set rate limit headers', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });

    test('should have different limits for different endpoints', async () => {
      // Test auth endpoint (5 requests per 15 minutes)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'password' });
      }

      const authResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });

      expect(authResponse.status).toBe(429);

      // Test general API endpoint (60 requests per minute)
      for (let i = 0; i < 60; i++) {
        await request(app)
          .get('/api/health');
      }

      const apiResponse = await request(app)
        .get('/api/health');

      expect(apiResponse.status).toBe(429);
    });
  });

  describe('Rate Limiter Statistics', () => {
    test('should provide rate limit statistics', async () => {
      // Make some requests
      await request(app).get('/api/health');
      await request(app).get('/api/status');
      await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'password' });

      const stats = rateLimiter.getStats();
      
      expect(stats).toHaveProperty('totalKeys');
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('byType');
      expect(stats.totalRequests).toBeGreaterThan(0);
    });

    test('should track different rate limit types', async () => {
      // Make requests to different endpoint types
      await request(app).get('/api/health'); // api type
      await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'password' }); // auth type

      const stats = rateLimiter.getStats();
      
      expect(stats.byType).toHaveProperty('api');
      expect(stats.byType).toHaveProperty('auth');
    });
  });

  describe('Rate Limiter Cleanup', () => {
    test('should cleanup old rate limit data', async () => {
      // Add some old data
      const oldKey = 'api:user:test-user';
      const oldTime = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
      rateLimiter.requests.set(oldKey, [oldTime]);

      // Add some recent data
      const recentKey = 'api:user:recent-user';
      const recentTime = Date.now();
      rateLimiter.requests.set(recentKey, [recentTime]);

      // Run cleanup
      rateLimiter.cleanup();

      // Old data should be removed
      expect(rateLimiter.requests.has(oldKey)).toBe(false);
      
      // Recent data should remain
      expect(rateLimiter.requests.has(recentKey)).toBe(true);
    });
  });

  describe('Rate Limiter Configuration', () => {
    test('should have correct default configuration', () => {
      expect(rateLimiter.config.default).toEqual({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100
      });

      expect(rateLimiter.config.auth).toEqual({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5
      });

      expect(rateLimiter.config.api).toEqual({
        windowMs: 60 * 1000, // 1 minute
        max: 60
      });
    });
  });
}); 