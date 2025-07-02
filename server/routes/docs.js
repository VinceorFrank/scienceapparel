/**
 * API Documentation Routes
 * Serves Swagger UI and API documentation
 */

const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../utils/swagger');

// Serve Swagger UI
router.use('/', swaggerUi.serve);

// Swagger UI setup with custom options
router.get('/', swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2c3e50; font-size: 2.5em; }
    .swagger-ui .info .description { font-size: 1.2em; color: #7f8c8d; }
    .swagger-ui .scheme-container { background: #ecf0f1; padding: 10px; border-radius: 5px; }
    .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #61affe; }
    .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #49cc90; }
    .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #fca130; }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #f93e3e; }
    .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #50e3c2; }
  `,
  customSiteTitle: 'Ecommerce API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true,
    requestInterceptor: (request) => {
      // Add authorization header if available
      const token = localStorage.getItem('authToken');
      if (token) {
        request.headers.Authorization = `Bearer ${token}`;
      }
      return request;
    }
  }
}));

// Get raw OpenAPI specification
router.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API documentation info
router.get('/info', (req, res) => {
  res.json({
    title: 'Ecommerce API Documentation',
    version: '1.0.0',
    description: 'Comprehensive API documentation for the ecommerce backend',
    endpoints: {
      documentation: '/api/docs',
      swaggerSpec: '/api/docs/swagger.json',
      health: '/api/health'
    },
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>'
    },
    rateLimiting: {
      description: 'Rate limiting is applied to all endpoints',
      headers: {
        'X-RateLimit-Limit': 'Requests per window',
        'X-RateLimit-Remaining': 'Remaining requests',
        'X-RateLimit-Reset': 'Reset time'
      }
    }
  });
});

module.exports = router; 