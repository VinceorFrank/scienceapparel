/**
 * Password Policy Tests
 */

const { 
  validatePassword, 
  hashPassword, 
  verifyPassword, 
  generateSecurePassword,
  PASSWORD_REQUIREMENTS 
} = require('../../middlewares/passwordPolicy');

describe('Password Policy', () => {
  describe('Password Validation', () => {
    test('should accept strong passwords', () => {
      const strongPasswords = [
        'TestPassword123!',
        'MySecurePass456#',
        'Complex@Password789',
        'StrongP@ssw0rd!'
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.strength).toBe('strong');
        expect(result.score).toBeGreaterThanOrEqual(60);
      });
    });

    test('should reject weak passwords', () => {
      const weakPasswords = [
        'password',
        '123456',
        'qwerty',
        'abc123'
      ];

      weakPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should enforce minimum length', () => {
      const shortPassword = 'Test1!';
      const result = validatePassword(shortPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    test('should enforce maximum length', () => {
      const longPassword = 'A'.repeat(129) + '1!';
      const result = validatePassword(longPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be no more than 128 characters long');
    });

    test('should require uppercase letters', () => {
      const noUppercase = 'testpassword123!';
      const result = validatePassword(noUppercase);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    test('should require lowercase letters', () => {
      const noLowercase = 'TESTPASSWORD123!';
      const result = validatePassword(noLowercase);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    test('should require numbers', () => {
      const noNumbers = 'TestPassword!';
      const result = validatePassword(noNumbers);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    test('should require special characters', () => {
      const noSpecialChars = 'TestPassword123';
      const result = validatePassword(noSpecialChars);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    test('should reject common passwords', () => {
      const commonPasswords = [
        'password',
        '123456',
        'qwerty',
        'abc123',
        'password123',
        'admin',
        'letmein'
      ];

      commonPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password is too common. Please choose a more unique password');
      });
    });

    test('should warn about sequential characters', () => {
      const sequentialPassword = 'TestPassword123!abc';
      const result = validatePassword(sequentialPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Password contains sequential characters which may weaken security');
      expect(result.score).toBeLessThan(80); // Adjusted expectation for sequential warning
    });

    test('should warn about repeating characters', () => {
      const repeatingPassword = 'TestPassword123!!!';
      const result = validatePassword(repeatingPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Password contains repeating characters which may weaken security');
      expect(result.score).toBeLessThan(80); // Adjusted expectation for repeating warning
    });

    test('should provide detailed validation feedback', () => {
      const password = 'weak';
      const result = validatePassword(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeInstanceOf(Array);
      expect(result.warnings).toBeInstanceOf(Array);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.strength).toBeDefined();
      expect(result.requirements).toBeDefined();
    });

    test('should handle empty string', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required and must be a string');
    });
  });

  describe('Password Hashing', () => {
    test('should hash password with salt', () => {
      const password = 'TestPassword123!';
      const result = hashPassword(password);
      
      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('salt');
      expect(result.hash).not.toBe(password);
      expect(result.salt).toHaveLength(64); // 32 bytes = 64 hex characters
      expect(result.hash).toHaveLength(128); // 64 bytes = 128 hex characters
    });

    test('should generate different hashes for same password', () => {
      const password = 'TestPassword123!';
      const result1 = hashPassword(password);
      const result2 = hashPassword(password);
      
      expect(result1.hash).not.toBe(result2.hash);
      expect(result1.salt).not.toBe(result2.salt);
    });

    test('should verify correct password', () => {
      const password = 'TestPassword123!';
      const { hash, salt } = hashPassword(password);
      
      const isValid = verifyPassword(password, hash, salt);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const { hash, salt } = hashPassword(password);
      
      const isValid = verifyPassword(wrongPassword, hash, salt);
      expect(isValid).toBe(false);
    });

    test('should handle empty password', () => {
      const password = '';
      const { hash, salt } = hashPassword(password);
      
      const isValid = verifyPassword(password, hash, salt);
      expect(isValid).toBe(true);
    });
  });

  describe('Secure Password Generation', () => {
    test('should generate password with default length', () => {
      const password = generateSecurePassword();
      
      expect(password).toHaveLength(16);
      expect(validatePassword(password).isValid).toBe(true);
    });

    test('should generate password with custom length', () => {
      const password = generateSecurePassword(20);
      
      expect(password).toHaveLength(20);
      expect(validatePassword(password).isValid).toBe(true);
    });

    test('should generate different passwords each time', () => {
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();
      
      expect(password1).not.toBe(password2);
    });

    test('should generate passwords meeting all requirements', () => {
      for (let i = 0; i < 10; i++) {
        const password = generateSecurePassword();
        const validation = validatePassword(password);
        
        expect(validation.isValid).toBe(true);
        expect(validation.strength).toBe('strong');
        expect(validation.score).toBeGreaterThanOrEqual(60);
      }
    });

    test('should include all required character types', () => {
      const password = generateSecurePassword();
      
      expect(password).toMatch(/[A-Z]/); // Uppercase
      expect(password).toMatch(/[a-z]/); // Lowercase
      expect(password).toMatch(/\d/); // Numbers
      expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/); // Special chars
    });
  });

  describe('Password Requirements', () => {
    test('should have correct default requirements', () => {
      expect(PASSWORD_REQUIREMENTS.minLength).toBe(8);
      expect(PASSWORD_REQUIREMENTS.maxLength).toBe(128);
      expect(PASSWORD_REQUIREMENTS.requireUppercase).toBe(true);
      expect(PASSWORD_REQUIREMENTS.requireLowercase).toBe(true);
      expect(PASSWORD_REQUIREMENTS.requireNumbers).toBe(true);
      expect(PASSWORD_REQUIREMENTS.requireSpecialChars).toBe(true);
      expect(PASSWORD_REQUIREMENTS.minSpecialChars).toBe(1);
      expect(PASSWORD_REQUIREMENTS.preventCommonPasswords).toBe(true);
      expect(PASSWORD_REQUIREMENTS.preventSequentialChars).toBe(true);
      expect(PASSWORD_REQUIREMENTS.preventRepeatingChars).toBe(true);
    });
  });

  describe('Password Strength Scoring', () => {
    test('should score strong passwords correctly', () => {
      const strongPassword = 'TestPassword123!';
      const result = validatePassword(strongPassword);
      
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.strength).toBe('strong');
    });

    test('should score medium passwords correctly', () => {
      const mediumPassword = 'TestPass123';
      const result = validatePassword(mediumPassword);
      
      expect(result.score).toBeGreaterThanOrEqual(40);
      expect(result.score).toBeLessThan(60);
      expect(result.strength).toBe('medium');
    });

    test('should score weak passwords correctly', () => {
      const weakPassword = 'testpass';
      const result = validatePassword(weakPassword);
      
      expect(result.score).toBeLessThan(40);
      expect(result.strength).toBe('weak');
    });

    test('should award points for length', () => {
      const shortPassword = 'Test1!';
      const longPassword = 'TestPassword123!ThisIsAVeryLongPassword';
      
      const shortResult = validatePassword(shortPassword);
      const longResult = validatePassword(longPassword);
      
      expect(longResult.score).toBeGreaterThan(shortResult.score);
    });

    test('should award points for character variety', () => {
      const basicPassword = 'TestPass123';
      const complexPassword = 'TestPass123!@#';
      
      const basicResult = validatePassword(basicPassword);
      const complexResult = validatePassword(complexPassword);
      
      expect(complexResult.score).toBeGreaterThan(basicResult.score);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null input', () => {
      const result = validatePassword(null);
      expect(result.isValid).toBe(false);
    });

    test('should handle undefined input', () => {
      const result = validatePassword(undefined);
      expect(result.isValid).toBe(false);
    });

    test('should handle very long passwords', () => {
      const longPassword = 'A'.repeat(126) + '1!'; // Exactly 128 characters
      const result = validatePassword(longPassword);
      expect(result.isValid).toBe(true);
    });

    test('should handle passwords with unicode characters', () => {
      const unicodePassword = 'TestPässwörd123!';
      const result = validatePassword(unicodePassword);
      expect(result.isValid).toBe(true);
    });
  });
}); 