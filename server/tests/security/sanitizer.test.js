/**
 * Input Sanitizer Tests
 */

const request = require('supertest');
const app = require('../../app');
const { sanitizers } = require('../../middlewares/sanitizer');

describe('Input Sanitizer', () => {
  describe('String Sanitization', () => {
    test('should sanitize XSS attempts', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = sanitizers.string(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert("xss")');
      expect(sanitized).toContain('Hello World');
    });

    test('should remove null bytes', () => {
      const inputWithNulls = 'Hello\0World\0Test';
      const sanitized = sanitizers.string(inputWithNulls);
      
      expect(sanitized).not.toContain('\0');
      expect(sanitized).toBe('HelloWorldTest');
    });

    test('should remove control characters', () => {
      const inputWithControls = 'Hello\x00\x01\x02World';
      const sanitized = sanitizers.string(inputWithControls);
      
      expect(sanitized).toBe('HelloWorld');
    });

    test('should trim whitespace', () => {
      const inputWithWhitespace = '  Hello World  ';
      const sanitized = sanitizers.string(inputWithWhitespace);
      
      expect(sanitized).toBe('Hello World');
    });
  });

  describe('Email Validation', () => {
    test('should accept valid emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        const sanitized = sanitizers.email(email);
        expect(sanitized).toBe(email.toLowerCase());
      });
    });

    test('should reject invalid emails', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com'
      ];

      invalidEmails.forEach(email => {
        const sanitized = sanitizers.email(email);
        expect(sanitized).toBeNull();
      });
    });

    test('should reject emails with suspicious patterns', () => {
      const suspiciousEmails = [
        'test<script>@example.com',
        'testjavascript:alert(1)@example.com',
        'testdata:text/html@example.com'
      ];

      suspiciousEmails.forEach(email => {
        const sanitized = sanitizers.email(email);
        expect(sanitized).toBeNull();
      });
    });
  });

  describe('URL Validation', () => {
    test('should accept valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://subdomain.example.org/path',
        'https://example.com:8080/api'
      ];

      validUrls.forEach(url => {
        const sanitized = sanitizers.url(url);
        expect(sanitized).toBe(url);
      });
    });

    test('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>'
      ];

      invalidUrls.forEach(url => {
        const sanitized = sanitizers.url(url);
        expect(sanitized).toBeNull();
      });
    });

    test('should reject URLs with suspicious protocols', () => {
      const suspiciousUrls = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox("test")'
      ];

      suspiciousUrls.forEach(url => {
        const sanitized = sanitizers.url(url);
        expect(sanitized).toBeNull();
      });
    });
  });

  describe('ObjectId Validation', () => {
    test('should accept valid ObjectIds', () => {
      const validObjectIds = [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013'
      ];

      validObjectIds.forEach(id => {
        const sanitized = sanitizers.objectId(id);
        expect(sanitized).toBe(id);
      });
    });

    test('should reject invalid ObjectIds', () => {
      const invalidObjectIds = [
        'invalid-id',
        '507f1f77bcf86cd79943901', // too short
        '507f1f77bcf86cd7994390111', // too long
        '507f1f77bcf86cd79943901g', // invalid character
        '507f1f77bcf86cd79943901G' // invalid character
      ];

      invalidObjectIds.forEach(id => {
        const sanitized = sanitizers.objectId(id);
        expect(sanitized).toBeNull();
      });
    });
  });

  describe('File Upload Validation', () => {
    test('should accept valid files', () => {
      const validFiles = [
        {
          mimetype: 'image/jpeg',
          size: 1024 * 1024, // 1MB
          name: 'test.jpg',
          originalname: 'test.jpg'
        },
        {
          mimetype: 'image/png',
          size: 2 * 1024 * 1024, // 2MB
          name: 'test.png',
          originalname: 'test.png'
        }
      ];

      validFiles.forEach(file => {
        const sanitized = sanitizers.file(file);
        expect(sanitized).not.toBeNull();
        expect(sanitized.name).toBe(file.name);
      });
    });

    test('should reject invalid file types', () => {
      const invalidFiles = [
        {
          mimetype: 'application/exe',
          size: 1024,
          name: 'test.exe',
          originalname: 'test.exe'
        },
        {
          mimetype: 'text/html',
          size: 1024,
          name: 'test.html',
          originalname: 'test.html'
        }
      ];

      invalidFiles.forEach(file => {
        const sanitized = sanitizers.file(file);
        expect(sanitized).toBeNull();
      });
    });

    test('should reject oversized files', () => {
      const oversizedFile = {
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024, // 10MB (over 5MB limit)
        name: 'large.jpg',
        originalname: 'large.jpg'
      };

      const sanitized = sanitizers.file(oversizedFile);
      expect(sanitized).toBeNull();
    });

    test('should sanitize filenames', () => {
      const fileWithSpecialChars = {
        mimetype: 'image/jpeg',
        size: 1024,
        name: 'test<script>.jpg',
        originalname: 'test<script>.jpg'
      };

      const sanitized = sanitizers.file(fileWithSpecialChars);
      expect(sanitized).not.toBeNull();
      expect(sanitized.name).not.toContain('<script>');
    });
  });

  describe('Query Parameter Sanitization', () => {
    test('should sanitize query parameters', () => {
      const query = {
        page: '1',
        limit: '10',
        sort: 'name,asc',
        category: '507f1f77bcf86cd799439011',
        search: '<script>alert(1)</script>test'
      };

      const sanitized = sanitizers.query(query);
      
      expect(sanitized.page).toBe(1);
      expect(sanitized.limit).toBe(10);
      expect(sanitized.sort).toBe('name,asc');
      expect(sanitized.category).toBe('507f1f77bcf86cd799439011');
      expect(sanitized.search).not.toContain('<script>');
    });

    test('should handle invalid query parameters', () => {
      const query = {
        page: 'invalid',
        limit: '-5',
        category: 'invalid-id',
        sort: 'name<script>'
      };

      const sanitized = sanitizers.query(query);
      
      expect(sanitized.page).toBeUndefined();
      expect(sanitized.limit).toBeUndefined();
      expect(sanitized.category).toBeUndefined();
      expect(sanitized.sort).toBeUndefined();
    });
  });

  describe('Request Body Sanitization', () => {
    test('should sanitize request body', () => {
      const body = {
        name: '<script>alert(1)</script>Product Name',
        email: 'test@example.com',
        price: '99.99',
        category: '507f1f77bcf86cd799439011',
        featured: 'true',
        tags: ['tag1', '<script>tag2</script>', 'tag3']
      };

      const sanitized = sanitizers.body(body);
      
      expect(sanitized.name).not.toContain('<script>');
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.price).toBe(99.99);
      expect(sanitized.category).toBe('507f1f77bcf86cd799439011');
      expect(sanitized.featured).toBe(true);
      expect(sanitized.tags).toContain('tag1');
      expect(sanitized.tags).not.toContain('<script>tag2</script>');
      expect(sanitized.tags).toContain('tag3');
    });

    test('should handle nested objects', () => {
      const body = {
        user: {
          name: '<script>alert(1)</script>John',
          email: 'john@example.com'
        },
        address: {
          street: '123<script>Main</script> St',
          city: 'Test City'
        }
      };

      const sanitized = sanitizers.body(body);
      
      expect(sanitized.user.name).not.toContain('<script>');
      expect(sanitized.user.email).toBe('john@example.com');
      expect(sanitized.address.street).not.toContain('<script>');
      expect(sanitized.address.city).toBe('Test City');
    });
  });

  describe('Integration Tests', () => {
    test('should sanitize XSS in product creation', async () => {
      const maliciousProduct = {
        name: '<script>alert("xss")</script>Test Product',
        description: 'Test<script>alert("xss")</script> description',
        price: 99.99,
        category: '507f1f77bcf86cd799439011'
      };

      const response = await request(app)
        .post('/api/products')
        .send(maliciousProduct);

      // Should not contain script tags in response
      expect(response.body).not.toContain('<script>');
      expect(response.body).not.toContain('alert("xss")');
    });

    test('should sanitize XSS in user registration', async () => {
      const maliciousUser = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: '<script>alert("xss")</script>John',
        lastName: 'Doe<script>alert("xss")</script>'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(maliciousUser);

      // Should not contain script tags in response
      expect(response.body).not.toContain('<script>');
      expect(response.body).not.toContain('alert("xss")');
    });
  });
}); 