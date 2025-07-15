// Test utilities for development

/**
 * Generate a valid MongoDB ObjectId for testing
 * @returns {string} A valid 24-character ObjectId
 */
export const generateTestObjectId = () => {
  // Create a timestamp-based ObjectId
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const randomBytes = Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  return timestamp + randomBytes;
};

/**
 * Check if an ObjectId is valid format
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid ObjectId format
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Get a consistent test order ID for development
 * @returns {string} A fixed test ObjectId
 */
export const getTestOrderId = () => {
  return '507f1f77bcf86cd799439011';
};

/**
 * Get a consistent test user ID for development
 * @returns {string} A fixed test ObjectId
 */
export const getTestUserId = () => {
  return '507f1f77bcf86cd799439012';
};

/**
 * Get a consistent test product ID for development
 * @returns {string} A fixed test ObjectId
 */
export const getTestProductId = () => {
  return '507f1f77bcf86cd799439013';
}; 