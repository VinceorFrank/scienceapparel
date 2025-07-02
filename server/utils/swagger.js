/**
 * Swagger/OpenAPI Configuration
 * Comprehensive API documentation for the ecommerce backend
 */

const swaggerJsdoc = require('swagger-jsdoc');

// Swagger configuration options
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ecommerce API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the ecommerce backend',
      contact: {
        name: 'API Support',
        email: 'support@ecommerce.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.ecommerce.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        }
      },
      schemas: {
        // User schemas
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            phone: { type: 'string', example: '+1234567890' },
            isAdmin: { type: 'boolean', example: false },
            role: { type: 'string', enum: ['customer', 'admin'], example: 'customer' },
            status: { type: 'string', enum: ['active', 'suspended', 'inactive'], example: 'active' },
            createdAt: { type: 'string', format: 'date-time' },
            lastLogin: { type: 'string', format: 'date-time' }
          }
        },
        UserRegistration: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 50, example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', minLength: 8, example: 'SecurePass123!' },
            phone: { type: 'string', example: '+1234567890' }
          }
        },
        UserLogin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', example: 'SecurePass123!' }
          }
        },
        Address: {
          type: 'object',
          required: ['type', 'firstName', 'lastName', 'address', 'city', 'state', 'postalCode', 'country'],
          properties: {
            type: { type: 'string', enum: ['shipping', 'billing'], example: 'shipping' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            address: { type: 'string', example: '123 Main St' },
            city: { type: 'string', example: 'New York' },
            state: { type: 'string', example: 'NY' },
            postalCode: { type: 'string', example: '10001' },
            country: { type: 'string', example: 'USA' },
            phone: { type: 'string', example: '+1234567890' },
            company: { type: 'string', example: 'Acme Corp' },
            isDefault: { type: 'boolean', example: true }
          }
        },

        // Product schemas
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Wireless Headphones' },
            description: { type: 'string', example: 'High-quality wireless headphones' },
            price: { type: 'number', example: 99.99 },
            category: { type: 'string', example: 'Electronics' },
            images: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['headphones1.jpg', 'headphones2.jpg']
            },
            stock: { type: 'number', example: 50 },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        ProductCreate: {
          type: 'object',
          required: ['name', 'description', 'price', 'category'],
          properties: {
            name: { type: 'string', example: 'Wireless Headphones' },
            description: { type: 'string', example: 'High-quality wireless headphones' },
            price: { type: 'number', minimum: 0, example: 99.99 },
            category: { type: 'string', example: 'Electronics' },
            stock: { type: 'number', minimum: 0, example: 50 },
            images: { 
              type: 'array', 
              items: { type: 'string' }
            }
          }
        },

        // Order schemas
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            user: { type: 'string', example: '507f1f77bcf86cd799439012' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: { type: 'string', example: '507f1f77bcf86cd799439013' },
                  quantity: { type: 'number', example: 2 },
                  price: { type: 'number', example: 99.99 }
                }
              }
            },
            total: { type: 'number', example: 199.98 },
            status: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], example: 'pending' },
            shippingAddress: { $ref: '#/components/schemas/Address' },
            paymentStatus: { type: 'string', enum: ['pending', 'paid', 'failed'], example: 'pending' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        OrderCreate: {
          type: 'object',
          required: ['items', 'shippingAddress'],
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['product', 'quantity'],
                properties: {
                  product: { type: 'string', example: '507f1f77bcf86cd799439013' },
                  quantity: { type: 'number', minimum: 1, example: 2 }
                }
              }
            },
            shippingAddress: { $ref: '#/components/schemas/Address' },
            notes: { type: 'string', example: 'Please deliver after 6 PM' }
          }
        },

        // Cart schemas
        CartItem: {
          type: 'object',
          properties: {
            product: { type: 'string', example: '507f1f77bcf86cd799439013' },
            quantity: { type: 'number', example: 2 },
            price: { type: 'number', example: 99.99 }
          }
        },
        Cart: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            user: { type: 'string', example: '507f1f77bcf86cd799439012' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/CartItem' }
            },
            total: { type: 'number', example: 199.98 },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        // Category schemas
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Electronics' },
            description: { type: 'string', example: 'Electronic devices and accessories' },
            image: { type: 'string', example: 'electronics.jpg' },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' }
          }
        },

        // Response schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' },
            data: { type: 'object' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'An error occurred' },
            error: { type: 'string', example: 'VALIDATION_ERROR' },
            details: { type: 'object' }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Data retrieved successfully' },
            data: { type: 'object' },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                total: { type: 'number', example: 100 },
                pages: { type: 'number', example: 10 }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './routes/users/*.js'
  ]
};

// Generate Swagger specification
const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec; 