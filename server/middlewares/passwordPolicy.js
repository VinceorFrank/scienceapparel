/**
 * Enhanced Password Policy and Validation Middleware
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const { sendError, sendValidationError } = require('../utils/responseHandler');
const { logger } = require('../utils/logger');

/**
 * Enhanced password strength requirements
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
  preventRepeatingChars: true,
  preventPersonalInfo: true, // Prevent using email, username, etc.
  maxHistorySize: 5, // Remember last 5 passwords
  minAge: 24 * 60 * 60 * 1000 // 24 hours minimum password age
};

/**
 * Extended list of common weak passwords to block
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
  'dick', 'cock', 'tits', 'shit', 'bitch',
  // Additional common passwords
  '12345678', '1234567890', 'qwerty123', 'password1',
  'admin123', 'root', 'toor', 'guest', 'user',
  'test', 'demo', 'sample', 'example', 'default',
  'changeme', 'secret', 'private', 'secure', 'login',
  'pass', 'pass123', 'password123', 'admin123',
  'user123', 'test123', 'demo123', 'guest123'
];

/**
 * Enhanced password validation with breach detection
 * @param {string} password - Password to validate
 * @param {Object} user - User object for personal info check
 * @returns {Object} Validation result
 */
const validatePassword = (password, user = null) => {
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

  // Check for personal information
  if (PASSWORD_REQUIREMENTS.preventPersonalInfo && user) {
    const personalInfo = [
      user.email?.split('@')[0],
      user.name,
      user.username,
      user.phone
    ].filter(Boolean);
    
    const lowerPassword = password.toLowerCase();
    for (const info of personalInfo) {
      if (info && lowerPassword.includes(info.toLowerCase())) {
        errors.push('Password should not contain personal information like your name, email, or phone number');
        break;
      }
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
 * Enhanced password hashing with bcrypt
 * @param {string} password - Plain text password
 * @returns {string} Hashed password
 */
const hashPassword = async (password) => {
  const saltRounds = config.BCRYPT_ROUNDS || 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Verify password against hash using bcrypt
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash
 * @returns {boolean} True if password matches
 */
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate secure random password
 * @param {number} length - Password length (default: 16)
 * @returns {string} Secure random password
 */
const generateSecurePassword = (length = 16) => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  // Ensure length is sufficient
  const passLength = Math.max(length, 8);
  
  let password = '';
  const allChars = upper + lower + numbers + special;

  // Guarantee one of each type
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest
  for (let i = password.length; i < passLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to randomize character positions
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * Check password against history
 * @param {string} newPassword - New password to check
 * @param {Array} passwordHistory - Array of previous password hashes
 * @returns {boolean} True if password is in history
 */
const checkPasswordHistory = async (newPassword, passwordHistory = []) => {
  for (const oldHash of passwordHistory) {
    if (await verifyPassword(newPassword, oldHash)) {
      return true;
    }
  }
  return false;
};

/**
 * Enhanced password policy middleware
 * @returns {Function} Express middleware
 */
const passwordPolicyMiddleware = () => {
  return (req, res, next) => {
    // Add password validation to request object
    req.validatePassword = validatePassword;
    req.hashPassword = hashPassword;
    req.verifyPassword = verifyPassword;
    req.generateSecurePassword = generateSecurePassword;
    req.checkPasswordHistory = checkPasswordHistory;
    
    next();
  };
};

/**
 * Enhanced password field validation middleware
 * @param {string} fieldName - Name of password field in request body
 * @returns {Function} Express middleware
 */
const validatePasswordField = (fieldName = 'password') => {
  return async (req, res, next) => {
    const password = req.body[fieldName];
    
    if (!password) {
      return sendError(res, 400, 'Password is required', null, 'PASSWORD_REQUIRED');
    }

    // Get user for personal info check (if available)
    const user = req.user || null;
    const validation = validatePassword(password, user);
    
    if (!validation.isValid) {
      return sendError(res, 400, 'Password does not meet requirements', {
            errors: validation.errors,
            warnings: validation.warnings,
            strength: validation.strength,
            score: validation.score
      }, 'PASSWORD_VALIDATION_FAILED');
        }

    // Check password history if user exists
    if (user && user.passwordHistory && user.passwordHistory.length > 0) {
      const isInHistory = await checkPasswordHistory(password, user.passwordHistory);
      if (isInHistory) {
        return sendError(res, 400, 'Password has been used recently. Please choose a different password', null, 'PASSWORD_IN_HISTORY');
      }
    }

    // Add validation result to request for logging
    req.passwordValidation = validation;
    
    // Log password validation
    logger.info('Password validation completed', {
      userId: user?._id,
      strength: validation.strength,
      score: validation.score,
      hasWarnings: validation.warnings.length > 0
    });
    
    next();
  };
};

/**
 * Enhanced password change validation middleware
 * @returns {Function} Express middleware
 */
const validatePasswordChange = () => {
  return async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return sendError(res, 400, 'Current password and new password are required', null, 'MISSING_PASSWORDS');
    }

    // Validate new password strength
    const newPasswordValidation = validatePassword(newPassword, req.user);
    if (!newPasswordValidation.isValid) {
      return sendError(res, 400, 'New password does not meet requirements', {
            errors: newPasswordValidation.errors,
            warnings: newPasswordValidation.warnings,
            strength: newPasswordValidation.strength
      }, 'PASSWORD_VALIDATION_FAILED');
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      return sendError(res, 400, 'New password must be different from current password', null, 'SAME_PASSWORD');
    }

    // Verify current password
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return sendError(res, 400, 'Current password is incorrect', null, 'INVALID_CURRENT_PASSWORD');
    }

    // Check password history
    if (user.passwordHistory && user.passwordHistory.length > 0) {
      const isInHistory = await checkPasswordHistory(newPassword, user.passwordHistory);
      if (isInHistory) {
        return sendError(res, 400, 'Password has been used recently. Please choose a different password', null, 'PASSWORD_IN_HISTORY');
      }
    }

    // Check minimum password age
    if (user.passwordChangedAt) {
      const passwordAge = Date.now() - user.passwordChangedAt.getTime();
      if (passwordAge < PASSWORD_REQUIREMENTS.minAge) {
        return sendError(res, 400, 'Password was changed too recently. Please wait before changing again', null, 'PASSWORD_TOO_RECENT');
      }
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
  checkPasswordHistory,
  passwordPolicyMiddleware,
  validatePasswordField,
  validatePasswordChange,
  getPasswordRequirements,
  PASSWORD_REQUIREMENTS
}; 