# Testing Guide

## Overview

This guide explains how to run tests for the ecommerce API and what each test covers. The testing infrastructure includes unit tests, integration tests, and security tests.

## 🧪 Test Structure

```
tests/
├── setup.js                 # Test configuration and utilities
├── security/               # Security-specific tests
│   ├── rateLimiter.test.js
│   ├── sanitizer.test.js
│   └── passwordPolicy.test.js
├── integration/            # API integration tests
│   └── api.test.js
└── unit/                   # Unit tests (to be added)
```

## 🚀 Quick Start

### Prerequisites

1. **Install dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Start MongoDB** (if not already running):
   ```bash
   # On Windows
   mongod
   
   # On macOS/Linux
   sudo systemctl start mongod
   ```

3. **Run all tests**:
   ```bash
   npm test
   ```

## 📋 Test Commands

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test Categories
```bash
# Security tests only
npm run test:security

# Integration tests only
npm run test:integration

# Unit tests only
npm run test:unit
```

## 🔒 Security Tests

### Rate Limiter Tests (`tests/security/rateLimiter.test.js`)

**What it tests**:
- Rate limiting functionality
- Different limits for different endpoints
- Rate limit headers
- Statistics tracking
- Data cleanup

**Key test scenarios**:
- ✅ Allows requests within rate limit
- ❌ Blocks requests exceeding rate limit
- 📊 Provides rate limit statistics
- 🧹 Cleans up old rate limit data

**Manual testing**:
```bash
# Test rate limiting manually
for i in {1..10}; do curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password"}'; done
```

### Input Sanitizer Tests (`tests/security/sanitizer.test.js`)

**What it tests**:
- XSS protection
- Email validation
- URL validation
- File upload validation
- ObjectId validation
- Query parameter sanitization
- Request body sanitization

**Key test scenarios**:
- ✅ Sanitizes XSS attempts
- ✅ Validates email formats
- ✅ Rejects malicious URLs
- ✅ Validates file uploads
- ✅ Sanitizes query parameters

**Manual testing**:
```bash
# Test XSS protection
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(\"xss\")</script>Test Product"}'

# Test email validation
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","password":"TestPassword123!"}'
```

### Password Policy Tests (`tests/security/passwordPolicy.test.js`)

**What it tests**:
- Password strength validation
- Password hashing and verification
- Secure password generation
- Password requirements enforcement

**Key test scenarios**:
- ✅ Accepts strong passwords
- ❌ Rejects weak passwords
- 🔐 Hashes passwords securely
- 🔑 Generates secure passwords
- 📊 Provides strength scoring

**Manual testing**:
```bash
# Test password validation
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"weak"}'

# Get password requirements
curl http://localhost:5000/api/password-requirements
```

## 🔗 Integration Tests

### API Integration Tests (`tests/integration/api.test.js`)

**What it tests**:
- Health and status endpoints
- Security endpoints
- Security headers
- CORS configuration
- Error handling
- Request size limiting
- Input sanitization integration
- Rate limiting integration
- Logging integration
- Performance monitoring
- Cache integration

**Key test scenarios**:
- ✅ Health check endpoint works
- ✅ Security headers are present
- ✅ CORS is configured correctly
- ✅ Error handling works properly
- ✅ Rate limiting is enforced
- ✅ Input sanitization is active

## 🛠️ Manual Testing Guide

### Step-by-Step Testing for Beginners

#### 1. Start the Server
```bash
cd server
npm run dev
```

#### 2. Test Basic Functionality

**Health Check**:
```bash
curl http://localhost:5000/api/health
```
**Expected**: Should return server status and uptime

**API Status**:
```bash
curl http://localhost:5000/api/status
```
**Expected**: Should return operational status

#### 3. Test Security Features

**Rate Limiting**:
```bash
# Make multiple requests quickly
for i in {1..10}; do curl http://localhost:5000/api/health; done
```
**Expected**: After 6 requests, you should get a 429 error

**XSS Protection**:
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(\"xss\")</script>Test Product"}'
```
**Expected**: Should not contain script tags in response

**Password Requirements**:
```bash
curl http://localhost:5000/api/password-requirements
```
**Expected**: Should return password policy requirements

#### 4. Test Security Endpoints

**Performance Metrics**:
```bash
curl http://localhost:5000/api/performance
```
**Expected**: Should return performance statistics

**Rate Limit Statistics**:
```bash
curl http://localhost:5000/api/rate-limits
```
**Expected**: Should return rate limiting statistics

**Log Statistics**:
```bash
curl http://localhost:5000/api/logs
```
**Expected**: Should return log statistics

**Cache Statistics**:
```bash
curl http://localhost:5000/api/cache
```
**Expected**: Should return cache statistics

**Database Indexes**:
```bash
curl http://localhost:5000/api/database-indexes
```
**Expected**: Should return database index information

#### 5. Test Security Headers

```bash
curl -I http://localhost:5000/api/health
```
**Expected Headers**:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-API-Version: 1.0.0`
- `X-Request-ID: [some-id]`

#### 6. Test Error Handling

**Non-existent Route**:
```bash
curl http://localhost:5000/api/non-existent
```
**Expected**: Should return 404 with proper error format

**Malformed JSON**:
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{"invalid": json}'
```
**Expected**: Should return 400 error

#### 7. Test Request Size Limiting

```bash
# Create a large payload (11MB)
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{"data":"'$(printf 'x%.0s' {1..11534336})'"}'
```
**Expected**: Should return 413 error

### Testing Tools

#### Using Postman

1. **Import the collection** (if available)
2. **Set environment variables**:
   - `baseUrl`: `http://localhost:5000`
   - `token`: (leave empty for now)

3. **Test endpoints**:
   - Health Check: `GET {{baseUrl}}/api/health`
   - Rate Limiting: Make multiple requests quickly
   - XSS Protection: Send malicious payloads
   - Security Headers: Check response headers

#### Using Browser Developer Tools

1. **Open browser** and go to `http://localhost:5000/api/health`
2. **Check Network tab** for:
   - Response headers
   - Response time
   - Status codes

3. **Check Console** for any errors

## 📊 Test Coverage

### Current Coverage Areas

- ✅ **Rate Limiting**: 100%
- ✅ **Input Sanitization**: 100%
- ✅ **Password Policies**: 100%
- ✅ **API Integration**: 90%
- ⏳ **Unit Tests**: 0% (to be added)
- ⏳ **Database Tests**: 0% (to be added)

### Coverage Report

Run coverage report:
```bash
npm run test:coverage
```

This will generate:
- Console coverage report
- HTML coverage report in `coverage/` directory
- LCOV report for CI/CD

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
**Error**: `MongoDB connection error`
**Solution**: 
```bash
# Start MongoDB
mongod

# Or check if MongoDB is running
sudo systemctl status mongod
```

#### 2. Port Already in Use
**Error**: `EADDRINUSE`
**Solution**:
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm run dev
```

#### 3. Test Database Issues
**Error**: `Test database connection failed`
**Solution**:
```bash
# Create test database
mongo
use ecommerce-test
exit
```

#### 4. Permission Denied
**Error**: `Permission denied`
**Solution**:
```bash
# Fix file permissions
chmod +x tests/run-tests.js

# Or run with sudo (not recommended)
sudo npm test
```

### Debug Mode

Run tests in debug mode:
```bash
# Debug specific test
npm test -- --testNamePattern="rate limiting"

# Debug with verbose output
npm test -- --verbose

# Debug with console output
DEBUG=* npm test
```

## 📈 Performance Testing

### Load Testing

Install Artillery for load testing:
```bash
npm install -g artillery
```

Run load test:
```bash
artillery quick --count 100 --num 10 http://localhost:5000/api/health
```

### Stress Testing

```bash
# Test rate limiting under load
artillery run tests/stress/rate-limit-test.yml
```

## 🔄 Continuous Integration

### GitHub Actions

Create `.github/workflows/test.yml`:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## 📝 Test Documentation

### Adding New Tests

1. **Create test file** in appropriate directory
2. **Follow naming convention**: `*.test.js`
3. **Use descriptive test names**
4. **Include both positive and negative tests**
5. **Add manual testing instructions**

### Test Best Practices

- ✅ Test both success and failure cases
- ✅ Use descriptive test names
- ✅ Keep tests independent
- ✅ Clean up test data
- ✅ Mock external dependencies
- ✅ Test edge cases
- ✅ Document manual testing steps

---

**Last Updated**: December 2024
**Maintainer**: Development Team 