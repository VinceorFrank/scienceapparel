/**
 * Enhanced Caching System
 * Provides in-memory and Redis caching with intelligent cache management
 */

const { logger } = require('./logger');

// In-memory cache store
const memoryCache = new Map();
const cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  size: 0
};

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_TTL: 300, // 5 minutes
  MAX_SIZE: 1000, // Maximum number of items in memory cache
  CLEANUP_INTERVAL: 60000, // 1 minute
  REDIS_ENABLED: process.env.REDIS_URL ? true : false
};

// Redis client (if available)
let redisClient = null;
if (CACHE_CONFIG.REDIS_ENABLED) {
  try {
    const redis = require('redis');
    redisClient = redis.createClient({
      url: process.env.REDIS_URL
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
      redisClient = null;
    });
    
    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });
    
    redisClient.connect().catch(err => {
      logger.error('Failed to connect to Redis:', err);
      redisClient = null;
    });
  } catch (error) {
    logger.warn('Redis not available, using in-memory cache only');
    redisClient = null;
  }
}

/**
 * Generate cache key
 * @param {string} prefix - Cache key prefix
 * @param {string} key - Cache key
 * @returns {string} Formatted cache key
 */
const generateKey = (prefix, key) => {
  return `${prefix}:${key}`;
};

/**
 * Set cache value
 * @param {string} prefix - Cache key prefix
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 */
const set = async (prefix, key, value, ttl = CACHE_CONFIG.DEFAULT_TTL) => {
  const cacheKey = generateKey(prefix, key);
  const cacheValue = {
    value,
    timestamp: Date.now(),
    ttl: ttl * 1000
  };

  try {
    // Set in memory cache
    if (memoryCache.size >= CACHE_CONFIG.MAX_SIZE) {
      cleanupMemoryCache();
    }
    
    memoryCache.set(cacheKey, cacheValue);
    cacheStats.sets++;
    cacheStats.size = memoryCache.size;

    // Set in Redis if available
    if (redisClient) {
      await redisClient.setEx(cacheKey, ttl, JSON.stringify(cacheValue));
    }

    logger.debug('Cache set', { key: cacheKey, ttl });
  } catch (error) {
    logger.error('Cache set error:', error);
  }
};

/**
 * Get cache value
 * @param {string} prefix - Cache key prefix
 * @param {string} key - Cache key
 * @returns {*} Cached value or null
 */
const get = async (prefix, key) => {
  const cacheKey = generateKey(prefix, key);

  try {
    // Try memory cache first
    const memoryValue = memoryCache.get(cacheKey);
    if (memoryValue && !isExpired(memoryValue)) {
      cacheStats.hits++;
      logger.debug('Cache hit (memory)', { key: cacheKey });
      return memoryValue.value;
    }

    // Try Redis if available
    if (redisClient) {
      const redisValue = await redisClient.get(cacheKey);
      if (redisValue) {
        const parsedValue = JSON.parse(redisValue);
        if (!isExpired(parsedValue)) {
          // Update memory cache
          memoryCache.set(cacheKey, parsedValue);
          cacheStats.hits++;
          logger.debug('Cache hit (Redis)', { key: cacheKey });
          return parsedValue.value;
        }
      }
    }

    cacheStats.misses++;
    logger.debug('Cache miss', { key: cacheKey });
    return null;
  } catch (error) {
    logger.error('Cache get error:', error);
    cacheStats.misses++;
    return null;
  }
};

/**
 * Delete cache value
 * @param {string} prefix - Cache key prefix
 * @param {string} key - Cache key
 */
const del = async (prefix, key) => {
  const cacheKey = generateKey(prefix, key);

  try {
    // Delete from memory cache
    memoryCache.delete(cacheKey);
    cacheStats.deletes++;
    cacheStats.size = memoryCache.size;

    // Delete from Redis if available
    if (redisClient) {
      await redisClient.del(cacheKey);
    }

    logger.debug('Cache deleted', { key: cacheKey });
  } catch (error) {
    logger.error('Cache delete error:', error);
  }
};

/**
 * Clear cache by prefix
 * @param {string} prefix - Cache key prefix
 */
const clearPrefix = async (prefix) => {
  try {
    // Clear from memory cache
    const keysToDelete = [];
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix + ':')) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      memoryCache.delete(key);
      cacheStats.deletes++;
    });
    
    cacheStats.size = memoryCache.size;

    // Clear from Redis if available
    if (redisClient) {
      const pattern = `${prefix}:*`;
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }

    logger.info('Cache prefix cleared', { prefix, deletedCount: keysToDelete.length });
  } catch (error) {
    logger.error('Cache clear prefix error:', error);
  }
};

/**
 * Check if cache value is expired
 * @param {Object} cacheValue - Cache value object
 * @returns {boolean} True if expired
 */
const isExpired = (cacheValue) => {
  return Date.now() - cacheValue.timestamp > cacheValue.ttl;
};

/**
 * Cleanup expired items from memory cache
 */
const cleanupMemoryCache = () => {
  const now = Date.now();
  const keysToDelete = [];

  for (const [key, value] of memoryCache.entries()) {
    if (isExpired(value)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => {
    memoryCache.delete(key);
    cacheStats.deletes++;
  });

  cacheStats.size = memoryCache.size;
  
  if (keysToDelete.length > 0) {
    logger.debug('Memory cache cleanup', { deletedCount: keysToDelete.length });
  }
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
const getStats = () => {
  const hitRate = cacheStats.hits + cacheStats.misses > 0 
    ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(2)
    : 0;

  return {
    ...cacheStats,
    hitRate: `${hitRate}%`,
    redisEnabled: !!redisClient,
    memorySize: memoryCache.size,
    maxSize: CACHE_CONFIG.MAX_SIZE
  };
};

/**
 * Cache middleware for Express routes
 * @param {string} prefix - Cache key prefix
 * @param {number} ttl - Time to live in seconds
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (prefix, ttl = CACHE_CONFIG.DEFAULT_TTL) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${req.originalUrl}`;
    const cachedResponse = await get(prefix, cacheKey);

    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Store original send method
    const originalSend = res.json;

    // Override send method to cache response
    res.json = function(data) {
      set(prefix, cacheKey, data, ttl);
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Cache decorator for functions
 * @param {string} prefix - Cache key prefix
 * @param {number} ttl - Time to live in seconds
 * @param {Function} keyGenerator - Function to generate cache key
 * @returns {Function} Decorated function
 */
const cacheDecorator = (prefix, ttl = CACHE_CONFIG.DEFAULT_TTL, keyGenerator = null) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      const cacheKey = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      const cachedResult = await get(prefix, cacheKey);

      if (cachedResult) {
        return cachedResult;
      }

      const result = await originalMethod.apply(this, args);
      await set(prefix, cacheKey, result, ttl);
      return result;
    };

    return descriptor;
  };
};

// Start cleanup interval
setInterval(cleanupMemoryCache, CACHE_CONFIG.CLEANUP_INTERVAL);

// Graceful shutdown
process.on('SIGINT', async () => {
  if (redisClient) {
    await redisClient.quit();
  }
  logger.info('Cache system shutdown');
});

module.exports = {
  set,
  get,
  del,
  clearPrefix,
  getStats,
  cacheMiddleware,
  cacheDecorator,
  CACHE_CONFIG
}; 