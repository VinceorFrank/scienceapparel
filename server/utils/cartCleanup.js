/**
 * Cart cleanup utility for removing expired carts
 */

const Cart = require('../models/Cart');
const { logger } = require('./logger');

/**
 * Clean up expired carts
 * @returns {Promise<number>} Number of carts deleted
 */
const cleanupExpiredCarts = async () => {
  try {
    const deletedCount = await Cart.cleanupExpiredCarts();
    
    if (deletedCount > 0) {
      logger.info('Cart cleanup completed', {
        deletedCount,
        timestamp: new Date().toISOString()
      });
    }
    
    return deletedCount;
  } catch (error) {
    logger.error('Cart cleanup failed', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

/**
 * Schedule cart cleanup to run periodically
 * @param {number} intervalHours - Hours between cleanup runs (default: 24)
 */
const scheduleCartCleanup = (intervalHours = 24) => {
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  // Run cleanup immediately
  cleanupExpiredCarts();
  
  // Schedule periodic cleanup
  setInterval(async () => {
    try {
      await cleanupExpiredCarts();
    } catch (error) {
      logger.error('Scheduled cart cleanup failed', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }, intervalMs);
  
  logger.info('Cart cleanup scheduled', {
    intervalHours,
    nextRun: new Date(Date.now() + intervalMs).toISOString()
  });
};

/**
 * Get cart statistics
 * @returns {Promise<Object>} Cart statistics
 */
const getCartStats = async () => {
  try {
    const stats = await Cart.aggregate([
      {
        $group: {
          _id: null,
          totalCarts: { $sum: 1 },
          totalItems: { $sum: { $size: '$items' } },
          averageItemsPerCart: { $avg: { $size: '$items' } },
          totalValue: { $sum: { $reduce: { input: '$items', initialValue: 0, in: { $add: ['$$value', { $multiply: ['$$this.price', '$$this.quantity'] }] } } } }
        }
      }
    ]);
    
    const expiredCarts = await Cart.countDocuments({
      expiresAt: { $lt: new Date() }
    });
    
    return {
      ...stats[0],
      expiredCarts,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Failed to get cart statistics', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

module.exports = {
  cleanupExpiredCarts,
  scheduleCartCleanup,
  getCartStats
}; 