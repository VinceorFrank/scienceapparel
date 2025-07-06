/**
 * API Documentation Generator
 * Automatically generates comprehensive API documentation from route definitions
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

/**
 * API Documentation Generator Class
 */
class APIDocumentationGenerator {
  constructor() {
    this.routes = [];
    this.schemas = {};
    this.examples = {};
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
  }

  /**
   * Register a route for documentation
   */
  registerRoute(route) {
    this.routes.push({
      ...route,
      id: this.generateRouteId(route),
      examples: this.examples[route.path] || [],
      schema: this.schemas[route.path] || {}
    });
  }

  /**
   * Generate unique route ID
   */
  generateRouteId(route) {
    return `${route.method.toLowerCase()}-${route.path.replace(/[^a-zA-Z0-9]/g, '-')}`;
  }

  /**
   * Add schema for a route
   */
  addSchema(path, method, schema) {
    const key = `${method.toUpperCase()}-${path}`;
    this.schemas[key] = schema;
  }

  /**
   * Add example for a route
   */
  addExample(path, method, example) {
    const key = `${method.toUpperCase()}-${path}`;
    if (!this.examples[key]) {
      this.examples[key] = [];
    }
    this.examples[key].push(example);
  }

  /**
   * Generate OpenAPI/Swagger specification
   */
  generateOpenAPISpec() {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'E-commerce API',
        description: 'Comprehensive API for e-commerce platform management',
        version: '1.0.0',
        contact: {
          name: 'API Support',
          email: 'support@ecommerce.com'
        }
      },
      servers: [
        {
          url: this.baseUrl,
          description: 'Development server'
        }
      ],
      paths: {},
      components: {
        schemas: this.generateSchemas(),
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ],
      tags: this.generateTags()
    };

    // Generate paths from routes
    for (const route of this.routes) {
      const pathKey = route.path;
      if (!spec.paths[pathKey]) {
        spec.paths[pathKey] = {};
      }

      spec.paths[pathKey][route.method.toLowerCase()] = {
        tags: [route.tag || 'General'],
        summary: route.summary || `${route.method} ${route.path}`,
        description: route.description || '',
        operationId: route.id,
        parameters: this.generateParameters(route),
        requestBody: this.generateRequestBody(route),
        responses: this.generateResponses(route),
        security: route.security || [],
        deprecated: route.deprecated || false
      };
    }

    return spec;
  }

  /**
   * Generate component schemas
   */
  generateSchemas() {
    return {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          role: { type: 'string', enum: ['customer', 'admin'], example: 'customer' },
          status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Product: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
          name: { type: 'string', example: 'Scientific Calculator' },
          description: { type: 'string', example: 'Advanced scientific calculator' },
          price: { type: 'number', example: 29.99 },
          category: { type: 'string', example: '507f1f77bcf86cd799439013' },
          image: { type: 'string', example: 'calculator.jpg' },
          featured: { type: 'boolean', example: false },
          archived: { type: 'boolean', example: false },
          rating: { type: 'number', example: 4.5 },
          numReviews: { type: 'number', example: 10 }
        }
      },
      Order: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439014' },
          user: { type: 'string', example: '507f1f77bcf86cd799439011' },
          orderItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product: { type: 'string', example: '507f1f77bcf86cd799439012' },
                quantity: { type: 'number', example: 2 },
                price: { type: 'number', example: 29.99 }
              }
            }
          },
          shippingAddress: {
            type: 'object',
            properties: {
              address: { type: 'string', example: '123 Main St' },
              city: { type: 'string', example: 'New York' },
              postalCode: { type: 'string', example: '10001' },
              country: { type: 'string', example: 'USA' }
            }
          },
          paymentMethod: { type: 'string', example: 'PayPal' },
          totalPrice: { type: 'number', example: 59.98 },
          isPaid: { type: 'boolean', example: false },
          isShipped: { type: 'boolean', example: false },
          status: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], example: 'pending' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error message' },
          code: { type: 'string', example: 'ERROR_CODE' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    };
  }

  /**
   * Generate parameters for a route
   */
  generateParameters(route) {
    const parameters = [];

    // Path parameters
    const pathParams = route.path.match(/:[^/]+/g) || [];
    for (const param of pathParams) {
      const paramName = param.slice(1);
      parameters.push({
        name: paramName,
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: `${paramName} identifier`
      });
    }

    // Query parameters
    if (route.queryParams) {
      for (const [name, config] of Object.entries(route.queryParams)) {
        parameters.push({
          name,
          in: 'query',
          required: config.required || false,
          schema: { type: config.type || 'string' },
          description: config.description || `${name} parameter`
        });
      }
    }

    return parameters;
  }

  /**
   * Generate request body for a route
   */
  generateRequestBody(route) {
    if (!route.requestBody) return null;

    return {
      required: route.requestBody.required || false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: route.requestBody.properties || {},
            required: route.requestBody.required || []
          },
          examples: route.requestBody.examples || {}
        }
      }
    };
  }

  /**
   * Generate responses for a route
   */
  generateResponses(route) {
    const responses = {
      '200': {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string' },
                data: route.responseSchema || { type: 'object' }
              }
            }
          }
        }
      },
      '400': {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      '401': {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      '403': {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      '404': {
        description: 'Not Found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      '500': {
        description: 'Internal Server Error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    };

    return responses;
  }

  /**
   * Generate API tags
   */
  generateTags() {
    const tags = [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Products',
        description: 'Product catalog management'
      },
      {
        name: 'Orders',
        description: 'Order management and processing'
      },
      {
        name: 'Cart',
        description: 'Shopping cart operations'
      },
      {
        name: 'Categories',
        description: 'Product category management'
      },
      {
        name: 'Admin',
        description: 'Administrative operations'
      },
      {
        name: 'Analytics',
        description: 'Data analytics and reporting'
      }
    ];

    return tags;
  }

  /**
   * Generate Markdown documentation
   */
  generateMarkdownDocs() {
    let markdown = `# E-commerce API Documentation

## Overview

This API provides comprehensive functionality for managing an e-commerce platform, including user management, product catalog, order processing, and administrative operations.

## Base URL

\`${this.baseUrl}\`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Endpoints

`;

    // Group routes by tag
    const routesByTag = {};
    for (const route of this.routes) {
      const tag = route.tag || 'General';
      if (!routesByTag[tag]) {
        routesByTag[tag] = [];
      }
      routesByTag[tag].push(route);
    }

    // Generate documentation for each tag
    for (const [tag, routes] of Object.entries(routesByTag)) {
      markdown += `\n### ${tag}\n\n`;

      for (const route of routes) {
        markdown += this.generateRouteMarkdown(route);
      }
    }

    markdown += `\n## Error Responses

All endpoints may return the following error responses:

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

## Rate Limiting

API requests are rate-limited to prevent abuse. Limits are applied per IP address and user account.

## Support

For API support, contact: support@ecommerce.com

`;

    return markdown;
  }

  /**
   * Generate markdown for a single route
   */
  generateRouteMarkdown(route) {
    let markdown = `#### ${route.method.toUpperCase()} ${route.path}\n\n`;

    if (route.description) {
      markdown += `${route.description}\n\n`;
    }

    // Authentication
    if (route.security && route.security.length > 0) {
      markdown += `**Authentication:** Required\n\n`;
    } else {
      markdown += `**Authentication:** Not required\n\n`;
    }

    // Parameters
    if (route.parameters && route.parameters.length > 0) {
      markdown += `**Parameters:**\n\n`;
      markdown += `| Name | Type | Required | Description |\n`;
      markdown += `|------|------|----------|-------------|\n`;
      
      for (const param of route.parameters) {
        markdown += `| ${param.name} | ${param.schema.type} | ${param.required ? 'Yes' : 'No'} | ${param.description} |\n`;
      }
      markdown += `\n`;
    }

    // Request Body
    if (route.requestBody) {
      markdown += `**Request Body:**\n\n`;
      markdown += `\`\`\`json\n${JSON.stringify(route.requestBody.example || {}, null, 2)}\n\`\`\`\n\n`;
    }

    // Response
    markdown += `**Response:**\n\n`;
    markdown += `\`\`\`json\n${JSON.stringify(route.responseExample || { success: true, message: 'Success' }, null, 2)}\n\`\`\`\n\n`;

    // Examples
    if (route.examples && route.examples.length > 0) {
      markdown += `**Examples:**\n\n`;
      for (const example of route.examples) {
        markdown += `**${example.title}:**\n\n`;
        markdown += `\`\`\`bash\n${example.curl}\n\`\`\`\n\n`;
      }
    }

    markdown += `---\n\n`;

    return markdown;
  }

  /**
   * Generate interactive HTML documentation
   */
  generateHTMLDocs() {
    const openAPISpec = this.generateOpenAPISpec();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-commerce API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    <style>
        body { margin: 0; padding: 0; }
        .swagger-ui .topbar { display: none; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                spec: ${JSON.stringify(openAPISpec)},
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
            });
        };
    </script>
</body>
</html>`;
  }

  /**
   * Save documentation to files
   */
  async saveDocumentation(outputDir = './docs') {
    try {
      // Create output directory
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Save OpenAPI spec
      const openAPISpec = this.generateOpenAPISpec();
      fs.writeFileSync(
        path.join(outputDir, 'openapi.json'),
        JSON.stringify(openAPISpec, null, 2)
      );

      // Save Markdown docs
      const markdownDocs = this.generateMarkdownDocs();
      fs.writeFileSync(
        path.join(outputDir, 'README.md'),
        markdownDocs
      );

      // Save HTML docs
      const htmlDocs = this.generateHTMLDocs();
      fs.writeFileSync(
        path.join(outputDir, 'index.html'),
        htmlDocs
      );

      logger.info('API documentation generated successfully', {
        outputDir,
        files: ['openapi.json', 'README.md', 'index.html']
      });

      return {
        openapi: path.join(outputDir, 'openapi.json'),
        markdown: path.join(outputDir, 'README.md'),
        html: path.join(outputDir, 'index.html')
      };
    } catch (error) {
      logger.error('Failed to save API documentation', { error: error.message });
      throw error;
    }
  }

  /**
   * Auto-discover routes from Express app
   */
  discoverRoutes(app) {
    const routes = [];
    
    const extractRoutes = (stack, basePath = '') => {
      for (const layer of stack) {
        if (layer.route) {
          const path = basePath + layer.route.path;
          const methods = Object.keys(layer.route.methods);
          
          for (const method of methods) {
            routes.push({
              path,
              method: method.toUpperCase(),
              stack: layer.route.stack
            });
          }
        } else if (layer.name === 'router') {
          const routerPath = layer.regexp.source.replace('^\\/','').replace('\\/?(?=\\/|$)','');
          extractRoutes(layer.handle.stack, basePath + '/' + routerPath);
        }
      }
    };

    extractRoutes(app._router.stack);
    return routes;
  }
}

// Create singleton instance
const apiDocGenerator = new APIDocumentationGenerator();

module.exports = {
  APIDocumentationGenerator,
  apiDocGenerator
}; 