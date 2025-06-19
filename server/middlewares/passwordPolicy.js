/**
 * Password policy and validation middleware
 */

const crypto = require('crypto');

/**
 * Password strength requirements
 */
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minSpecialChars: 1,
  preventCommonPasswords: true,
  preventSequentialChars: true,
  preventRepeatingChars: true
};

/**
 * Common weak passwords to block
 */
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123',
  'password123', 'admin', 'letmein', 'welcome', 'monkey',
  'dragon', 'master', 'hello', 'freedom', 'whatever',
  'qazwsx', 'trustno1', 'jordan', 'harley', 'ranger',
  'iwantu', 'jennifer', 'hunter', 'joshua', 'maggie',
  'buster', 'shadow', 'michael', 'charlie', 'andrew',
  'love', 'summer', 'hockey', 'ranger', 'daniel',
  'asshole', 'fuck', 'fuckyou', 'fucking', 'pussy',
  'dick', 'cock', 'tits', 'shit', 'bitch'
];

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
const validatePassword = (password) => {
  const errors = [];
  const warnings = [];
  let score = 0;

  // Handle null/undefined input
  if (!password || typeof password !== 'string') {
    errors.push('Password is required and must be a string');
    return {
      isValid: false,
      errors,
      warnings,
      score: 0,
      strength: 'weak',
      requirements: PASSWORD_REQUIREMENTS
    };
  }

  // Check length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  } else if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must be no more than ${PASSWORD_REQUIREMENTS.maxLength} characters long`);
  } else {
    score += Math.min(password.length * 2, 20); // Up to 20 points for length
  }

  // Check for uppercase letters
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 10;
  }

  // Check for lowercase letters
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 10;
  }

  // Check for numbers
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/\d/.test(password)) {
    score += 10;
  }

  // Check for special characters
  const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !specialChars.test(password)) {
    errors.push('Password must contain at least one special character');
  } else if (specialChars.test(password)) {
    score += 15;
  }

  // Check for minimum special characters
  const specialCharCount = (password.match(specialChars) || []).length;
  if (specialCharCount < PASSWORD_REQUIREMENTS.minSpecialChars) {
    errors.push(`Password must contain at least ${PASSWORD_REQUIREMENTS.minSpecialChars} special character(s)`);
  }

  // Check for common passwords
  if (PASSWORD_REQUIREMENTS.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.includes(lowerPassword)) {
      errors.push('Password is too common. Please choose a more unique password');
    }
  }

  // Check for sequential characters
  if (PASSWORD_REQUIREMENTS.preventSequentialChars) {
    const sequences = ['123', '234', '345', '456', '567', '678', '789', '890', 'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij', 'ijk', 'jkl', 'klm', 'lmn', 'mno', 'nop', 'opq', 'pqr', 'qrs', 'rst', 'stu', 'tuv', 'uvw', 'vwx', 'wxy', 'xyz'];
    const lowerPassword = password.toLowerCase();
    if (sequences.some(seq => lowerPassword.includes(seq))) {
      warnings.push('Password contains sequential characters which may weaken security');
      score -= 5;
    }
  }

  // Check for repeating characters
  if (PASSWORD_REQUIREMENTS.preventRepeatingChars) {
    const repeatingPattern = /(.)\1{2,}/; // 3 or more repeating characters
    if (repeatingPattern.test(password)) {
      warnings.push('Password contains repeating characters which may weaken security');
      score -= 5;
    }
  }

  // Additional strength checks
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasLettersAndNumbers = /[a-zA-Z]/.test(password) && /\d/.test(password);
  const hasSpecialAndLetters = specialChars.test(password) && /[a-zA-Z]/.test(password);

  if (hasMixedCase) score += 5;
  if (hasLettersAndNumbers) score += 5;
  if (hasSpecialAndLetters) score += 5;

  // Determine strength level
  let strength = 'weak';
  if (score >= 60) strength = 'strong';
  else if (score >= 40) strength = 'medium';
  else if (score >= 20) strength = 'weak';

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score,
    strength,
    requirements: PASSWORD_REQUIREMENTS
  };
};

/**
 * Hash password with salt
 * @param {string} password - Plain text password
 * @returns {Object} Hashed password and salt
 */
const hashPassword = (password) => {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  
  return {
    hash,
    salt
  };
};

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash
 * @param {string} salt - Stored salt
 * @returns {boolean} True if password matches
 */
const verifyPassword = (password, hash, salt) => {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

/**
 * Generate secure random password
 * @param {number} length - Password length (default: 16)
 * @returns {string} Secure random password
 */
const generateSecurePassword = (length = 16) => {
  // Ensure minimum length of 8
  const minLength = Math.max(length, 8);
  
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  
  // Ensure at least one character from each required category
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*()_+-=[]{}|;:,.<>?'[Math.floor(Math.random() * 32)]; // Special char
  
  // Fill the rest with random characters
  for (let i = 4; i < minLength; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  password = password.split('').sort(() => Math.random() - 0.5).join('');
  
  // Return exactly the requested length
  return password.substring(0, length);
};

/**
 * Password policy middleware
 * @returns {Function} Express middleware
 */
const passwordPolicyMiddleware = () => {
  return (req, res, next) => {
    // Add password validation to request object
    req.validatePassword = validatePassword;
    req.hashPassword = hashPassword;
    req.verifyPassword = verifyPassword;
    req.generateSecurePassword = generateSecurePassword;
    
    next();
  };
};

/**
 * Validate password in request body
 * @param {string} fieldName - Name of password field in request body
 * @returns {Function} Express middleware
 */
const validatePasswordField = (fieldName = 'password') => {
  return (req, res, next) => {
    const password = req.body[fieldName];
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Password is required',
          statusCode: 400
        }
      });
    }

    const validation = validatePassword(password);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Password does not meet requirements',
          statusCode: 400,
          details: {
            errors: validation.errors,
            warnings: validation.warnings,
            strength: validation.strength,
            score: validation.score
          }
        }
      });
    }

    // Add validation result to request for logging
    req.passwordValidation = validation;
    
    next();
  };
};

/**
 * Password change validation middleware
 * @returns {Function} Express middleware
 */
const validatePasswordChange = () => {
  return async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Current password and new password are required',
          statusCode: 400
        }
      });
    }

    // Validate new password strength
    const newPasswordValidation = validatePassword(newPassword);
    if (!newPasswordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'New password does not meet requirements',
          statusCode: 400,
          details: {
            errors: newPasswordValidation.errors,
            warnings: newPasswordValidation.warnings,
            strength: newPasswordValidation.strength
          }
        }
      });
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'New password must be different from current password',
          statusCode: 400
        }
      });
    }

    // Verify current password
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    
    if (!verifyPassword(currentPassword, user.password, user.salt)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Current password is incorrect',
          statusCode: 400
        }
      });
    }

    next();
  };
};

/**
 * Get password requirements
 * @returns {Object} Password requirements
 */
const getPasswordRequirements = () => {
  return {
    ...PASSWORD_REQUIREMENTS,
    description: 'Password must meet the following requirements:',
    examples: {
      strong: generateSecurePassword(12),
      medium: generateSecurePassword(10),
      weak: 'password123'
    }
  };
};

module.exports = {
  validatePassword,
  hashPassword,
  verifyPassword,
  generateSecurePassword,
  passwordPolicyMiddleware,
  validatePasswordField,
  validatePasswordChange,
  getPasswordRequirements,
  PASSWORD_REQUIREMENTS
}; 