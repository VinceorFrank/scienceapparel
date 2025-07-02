/**
 * Content Security Policy Middleware
 * Implements comprehensive CSP headers for enhanced security
 */

/**
 * Generate CSP header based on environment and configuration
 */
function generateCSP(environment = 'production') {
  const baseCSP = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for React development
      "'unsafe-eval'",   // Required for React development
      'https://cdn.jsdelivr.net',
      'https://unpkg.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind CSS
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:'
    ],
    'connect-src': [
      "'self'",
      'https://api.stripe.com',
      'https://maps.googleapis.com',
      'wss://localhost:*', // WebSocket for development
      'ws://localhost:*'   // WebSocket for development
    ],
    'frame-src': [
      "'self'",
      'https://js.stripe.com',
      'https://hooks.stripe.com'
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
    'upgrade-insecure-requests': [],
    'block-all-mixed-content': [],
    'referrer-policy': ['strict-origin-when-cross-origin']
  };

  // Development-specific CSP
  if (environment === 'development') {
    baseCSP['script-src'].push(
      "'unsafe-inline'",
      "'unsafe-eval'",
      'http://localhost:*',
      'https://localhost:*'
    );
    baseCSP['connect-src'].push(
      'http://localhost:*',
      'https://localhost:*',
      'ws://localhost:*',
      'wss://localhost:*'
    );
    baseCSP['style-src'].push("'unsafe-inline'");
  }

  // Convert to CSP string
  const cspParts = [];
  for (const [directive, sources] of Object.entries(baseCSP)) {
    if (sources.length > 0) {
      cspParts.push(`${directive} ${sources.join(' ')}`);
    }
  }

  return cspParts.join('; ');
}

/**
 * CSP middleware
 */
function contentSecurityPolicy(req, res, next) {
  const environment = process.env.NODE_ENV || 'development';
  const cspHeader = generateCSP(environment);
  
  res.setHeader('Content-Security-Policy', cspHeader);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
}

/**
 * Strict CSP for sensitive routes
 */
function strictCSP(req, res, next) {
  const strictCSPHeader = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
    "block-all-mixed-content"
  ].join('; ');

  res.setHeader('Content-Security-Policy', strictCSPHeader);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
}

/**
 * Report-only CSP for monitoring
 */
function reportOnlyCSP(req, res, next) {
  const environment = process.env.NODE_ENV || 'development';
  const cspHeader = generateCSP(environment);
  
  res.setHeader('Content-Security-Policy-Report-Only', cspHeader);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
}

module.exports = {
  contentSecurityPolicy,
  strictCSP,
  reportOnlyCSP,
  generateCSP
}; 