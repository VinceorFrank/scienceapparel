# Security Enhancements Documentation

## Overview

This document outlines the comprehensive security enhancements implemented in the ecommerce API to protect against various threats and vulnerabilities.

## 🔒 Security Features Implemented

### 1. Rate Limiting (`middlewares/rateLimiter.js`)

**Purpose**: Prevents API abuse and brute force attacks by limiting request frequency.

**Features**:
- **Dynamic Rate Limiting**: Different limits for different types of requests
- **User-based Limits**: Different limits for admins vs regular users
- **IP-based Tracking**: Fallback to IP address for anonymous users
- **Configurable Windows**: Different time windows for different endpoints

**Rate Limits**:
- **Authentication**: 5 attempts per 15 minutes
- **General API**: 60 requests per minute
- **Admin API**: 200 requests per minute
- **File Uploads**: 10 uploads per minute
- **Search**: 30 searches per minute

**Usage**:
```javascript
const { dynamicRateLimiter } = require('./middlewares/rateLimiter');
app.use(dynamicRateLimiter());
```

### 2. Input Sanitization (`middlewares/sanitizer.js`)

**Purpose**: Prevents XSS, injection attacks, and malicious input.

**Features**:
- **XSS Protection**: Removes script tags and dangerous HTML
- **SQL Injection Prevention**: Sanitizes query parameters
- **File Upload Validation**: Validates file types and sizes
- **Email Validation**: Comprehensive email format checking
- **URL Validation**: Secure URL parsing and validation
- **ObjectId Validation**: MongoDB ObjectId format checking

**Sanitization Types**:
- String sanitization with XSS protection
- Email validation with suspicious pattern detection
- URL validation with protocol restrictions
- File upload validation (5MB max, specific MIME types)
- Query parameter sanitization
- Request body sanitization

**Usage**:
```javascript
const { sanitizeInput } = require('./middlewares/sanitizer');
app.use(sanitizeInput());
```

### 3. Enhanced Authentication (`middlewares/auth.js`)

**Purpose**: Strengthens authentication security with multiple layers of protection.

**Features**:
- **Brute Force Protection**: Tracks failed login attempts
- **Account Lockout**: Temporary lockout after 5 failed attempts
- **Enhanced JWT**: Additional security claims and validation
- **Token Sanitization**: Validates token format and size
- **User Status Checking**: Verifies account is active
- **Resource Ownership**: Ensures users can only access their own resources

**Security Measures**:
- Failed attempt tracking with 15-minute lockout
- JWT with issuer, audience, and unique token ID
- Token age validation (max 7 days)
- User account status verification
- Resource ownership validation

**Usage**:
```javascript
const { protect, admin, requireRole, requireOwnership } = require('./middlewares/auth');

// Protect routes
app.use('/api/protected', protect);

// Admin only routes
app.use('/api/admin', protect, admin);

// Role-based access
app.use('/api/managers', protect, requireRole(['manager', 'admin']));

// Resource ownership
app.use('/api/orders/:id', protect, requireOwnership(Order));
```

### 4. Request Logging (`middlewares/requestLogger.js`)

**Purpose**: Comprehensive audit trails for security monitoring and debugging.

**Features**:
- **Request Logging**: All API requests logged with metadata
- **Security Event Logging**: Special logging for security-sensitive events
- **Performance Monitoring**: Response time tracking
- **Error Logging**: Detailed error logging with context
- **Log Rotation**: Automatic cleanup of old log files
- **Sensitive Data Redaction**: Removes passwords and tokens from logs

**Log Types**:
- **Request Logs**: `logs/requests-YYYY-MM-DD.log`
- **Security Logs**: `logs/security-YYYY-MM-DD.log`

**Logged Information**:
- Request method, URL, status code
- Response time and user information
- IP address and user agent
- Sanitized request body and headers
- Security event details

**Usage**:
```javascript
const { logRequests, logSecurityEvent } = require('./middlewares/requestLogger');
app.use(logRequests());
```

### 5. Security Headers (`middlewares/security.js`)

**Purpose**: Protects against common web vulnerabilities through HTTP headers.

**Features**:
- **Content Security Policy**: Prevents XSS and injection attacks
- **CORS Configuration**: Controlled cross-origin access
- **HSTS**: Forces HTTPS connections
- **Frame Options**: Prevents clickjacking
- **XSS Protection**: Browser-level XSS protection
- **Request Size Limiting**: Prevents large payload attacks

**Security Headers**:
- `Content-Security-Policy`: Restricts resource loading
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-XSS-Protection`: Browser XSS protection
- `Strict-Transport-Security`: HTTPS enforcement
- `Referrer-Policy`: Controls referrer information

**Usage**:
```javascript
const { securityMiddleware } = require('./middlewares/security');
app.use(securityMiddleware());
```

### 6. Password Policies (`middlewares/passwordPolicy.js`)

**Purpose**: Enforces strong password requirements and secure password handling.

**Features**:
- **Password Strength Validation**: Comprehensive strength checking
- **Common Password Blocking**: Prevents weak passwords
- **Secure Hashing**: PBKDF2 with salt
- **Password Generation**: Secure random password generation
- **Change Validation**: Ensures new passwords are different

**Password Requirements**:
- Minimum 8 characters, maximum 128
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- No common passwords
- No sequential characters
- No repeating characters

**Security Features**:
- PBKDF2 hashing with 10,000 iterations
- 32-byte random salt
- SHA-512 hashing algorithm
- Secure password generation
- Strength scoring system

**Usage**:
```javascript
const { validatePasswordField, validatePasswordChange } = require('./middlewares/passwordPolicy');

// Validate password in registration
app.post('/api/register', validatePasswordField('password'), registerUser);

// Validate password change
app.put('/api/users/password', protect, validatePasswordChange(), changePassword);
```

## 🛡️ Security Endpoints

### Health Check
```
GET /api/health
```
Returns server status and uptime information.

### Security Status
```
GET /api/status
```
Returns API operational status.

### Performance Metrics
```
GET /api/performance
```
Returns performance monitoring statistics.

### Rate Limit Statistics
```
GET /api/rate-limits
```
Returns rate limiting statistics and blocked requests.

### Log Statistics
```
GET /api/logs
```
Returns request and security log statistics.

### Password Requirements
```
GET /api/password-requirements
```
Returns password policy requirements and examples.

### Cache Statistics
```
GET /api/cache
```
Returns caching system statistics.

### Database Indexes
```
GET /api/database-indexes
```
Returns database index information and performance metrics.

## 🔧 Configuration

### Environment Variables

```env
# Security Configuration
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Password Policy
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_SPECIAL_CHARS=true

# Logging
LOG_RETENTION_DAYS=30
SECURITY_LOG_ENABLED=true
```

### Security Headers Configuration

```javascript
// Content Security Policy
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:"],
    scriptSrc: ["'self'"],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"]
  }
}
```

## 🚨 Security Monitoring

### Log Analysis

Monitor these log files for security events:
- `logs/security-YYYY-MM-DD.log`: Security-specific events
- `logs/requests-YYYY-MM-DD.log`: All API requests

### Key Security Events to Monitor

1. **Failed Authentication Attempts**
   - Multiple failed logins from same IP
   - Account lockouts
   - Invalid token attempts

2. **Rate Limit Violations**
   - Excessive requests from single source
   - API abuse patterns
   - Brute force attempts

3. **Suspicious Requests**
   - XSS attempts in input
   - SQL injection patterns
   - Directory traversal attempts

4. **Performance Anomalies**
   - Slow response times
   - High error rates
   - Database query performance issues

### Security Alerts

The system automatically logs security events with these patterns:
- `🚨 Security Event`: Critical security events
- `⚠️ Potential security issue`: Suspicious activities
- `🐌 Slow request detected`: Performance issues

## 🔍 Security Testing

### Manual Testing

1. **Rate Limiting Test**
   ```bash
   # Test rate limiting
   for i in {1..10}; do curl -X POST http://localhost:5000/api/auth/login; done
   ```

2. **XSS Protection Test**
   ```bash
   # Test XSS protection
   curl -X POST http://localhost:5000/api/products \
     -H "Content-Type: application/json" \
     -d '{"name": "<script>alert(\"xss\")</script>"}'
   ```

3. **Password Strength Test**
   ```bash
   # Test password validation
   curl -X POST http://localhost:5000/api/users/register \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "weak"}'
   ```

### Automated Testing

Consider implementing automated security tests:
- OWASP ZAP integration
- Security header validation
- Rate limiting verification
- Input sanitization testing

## 📋 Security Checklist

### Before Production Deployment

- [ ] Change default JWT secret
- [ ] Configure proper CORS origins
- [ ] Set up log monitoring
- [ ] Configure rate limiting thresholds
- [ ] Test all security features
- [ ] Review password policies
- [ ] Set up security alerts
- [ ] Configure SSL/TLS
- [ ] Review database security
- [ ] Set up backup and recovery

### Regular Security Maintenance

- [ ] Monitor security logs daily
- [ ] Review rate limiting statistics weekly
- [ ] Update dependencies monthly
- [ ] Review access logs quarterly
- [ ] Conduct security audits annually
- [ ] Update security policies as needed

## 🆘 Incident Response

### Security Incident Response Plan

1. **Detection**: Monitor logs and alerts
2. **Assessment**: Evaluate threat level
3. **Containment**: Block malicious IPs/users
4. **Investigation**: Analyze logs and evidence
5. **Recovery**: Restore affected systems
6. **Post-incident**: Document lessons learned

### Emergency Contacts

- Security Team: security@company.com
- System Administrator: admin@company.com
- Incident Response: incident@company.com

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practices-security.html)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintainer**: Security Team 