# E-commerce API Documentation

## Overview

This API provides comprehensive functionality for managing an e-commerce platform, including user management, product catalog, order processing, and administrative operations.

## Base URL

`http://localhost:5000`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints


## Error Responses

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

