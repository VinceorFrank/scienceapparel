/**
 * Advanced Caching System with Redis Integration
 * Provides intelligent caching with TTL, invalidation, and performance monitoring
 */

const redis = require('redis');
const { logger } = require('./logger');
const { auditLog, AUDIT_EVENTS } = require('./auditLogger');

/**
 * Advanced Cache Manager Class
 */
class AdvancedCacheManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isInitializing = false;
    this.initializationPromise = null;
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
    this.prefix = process.env.REDIS_PREFIX || 'ecommerce:';
    this.memoryCache = new Map();
  }

  /**
   * Initialize Redis connection with better error handling
   */
  async initialize() {
    // Prevent multiple simultaneous initialization attempts
    if (this.isInitializing) {
      return this.initializationPromise;
    }

    if (this.isConnected) {
      return true;
    }

    this.isInitializing = true;
    this.initializationPromise = this._initializeRedis();
    
    try {
      const result = await this.initializationPromise;
      return result;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Internal Redis initialization method
   */
  async _initializeRedis() {
    try {
      // Check if Redis URL is provided
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      // Create Redis client with improved configuration
      this.client = redis.createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              logger.warn('Redis connection failed after 3 retries, using memory cache');
              return false; // Stop retrying
            }
            return Math.min(retries * 1000, 3000);
          }
        },
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.warn('Redis connection refused, using memory cache fallback');
            return null; // Stop retrying
          }
          return Math.min(options.attempt * 1000, 3000);
        }
      });

      // Set up event handlers
      this.client.on('connect', () => {
        logger.info('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        if (error.code === 'ECONNREFUSED') {
          logger.warn('Redis connection refused, using memory cache');
        } else {
          logger.error('Redis connection error:', error);
        }
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.warn('Redis connection ended');
        this.isConnected = false;
      });

      // Try to connect with timeout
      const connectPromise = this.client.connect();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Redis connection timeout')), 5000);
      });

      await Promise.race([connectPromise, timeoutPromise]);
      
      // Test connection
      await this.client.ping();
      
      logger.info('🚀 Advanced caching system initialized with Redis');
      return true;
    } catch (error) {
      logger.warn('Redis not available, using memory cache fallback:', error.message);
      this.isConnected = false;
      
      // Clean up failed client
      if (this.client) {
        try {
          await this.client.quit();
        } catch (quitError) {
          // Ignore quit errors
        }
        this.client = null;
      }
      
      return false;
    }
  }

  /**
   * Generate cache key with prefix
   */
  generateKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * Set cache with advanced options
   */
  async set(key, value, options = {}) {
    const {
      ttl = 3600, // 1 hour default
      tags = [],
      compress = false,
      version = '1.0'
    } = options;

    const cacheKey = this.generateKey(key);
    const cacheData = {
      value,
      version,
      timestamp: Date.now(),
      tags,
      compressed: compress
    };

    try {
      if (this.isConnected && this.client) {
        // Use Redis
        const serializedData = JSON.stringify(cacheData);
        await this.client.setEx(cacheKey, ttl, serializedData);
        
        // Store tags for invalidation
        if (tags.length > 0) {
          for (const tag of tags) {
            const tagKey = `${this.prefix}tag:${tag}`;
            await this.client.sAdd(tagKey, cacheKey);
            await this.client.expire(tagKey, ttl);
          }
        }
      } else {
        // Fallback to memory cache
        this.memoryCache.set(cacheKey, {
          ...cacheData,
          expiresAt: Date.now() + (ttl * 1000)
        });
      }

      this.cacheStats.sets++;
      
      // Log cache operation
      await auditLog(AUDIT_EVENTS.DATA_MODIFIED, {
        action: 'cache_set',
        key: cacheKey,
        ttl,
        tags
      }, null, {
        cacheOperation: 'set',
        key: cacheKey
      });

      return true;
    } catch (error) {
      this.cacheStats.errors++;
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get cache with intelligent fallback
   */
  async get(key, fallbackFn = null) {
    const cacheKey = this.generateKey(key);

    try {
      let cachedData = null;

      if (this.isConnected && this.client) {
        // Try Redis first
        try {
          const data = await this.client.get(cacheKey);
          if (data) {
            cachedData = JSON.parse(data);
          }
        } catch (redisError) {
          logger.warn('Redis get error, falling back to memory cache:', redisError.message);
          this.isConnected = false;
        }
      }
      
      if (!cachedData) {
        // Try memory cache
        const memoryData = this.memoryCache.get(cacheKey);
        if (memoryData && memoryData.expiresAt > Date.now()) {
          cachedData = memoryData;
        } else if (memoryData) {
          // Remove expired entry
          this.memoryCache.delete(cacheKey);
        }
      }

      if (cachedData) {
        this.cacheStats.hits++;
        
        // Log cache hit
        await auditLog(AUDIT_EVENTS.DATA_VIEWED, {
          action: 'cache_hit',
          key: cacheKey,
          age: Date.now() - cachedData.timestamp
        }, null, {
          cacheOperation: 'hit',
          key: cacheKey
        });

        return cachedData.value;
      } else {
        this.cacheStats.misses++;
        
        // Try fallback function
        if (fallbackFn) {
          try {
            const freshData = await fallbackFn();
            if (freshData !== null && freshData !== undefined) {
              // Cache the fresh data
              await this.set(key, freshData, { ttl: 300 }); // 5 minutes
            }
            return freshData;
          } catch (fallbackError) {
            logger.error('Cache fallback error:', fallbackError);
            return null;
          }
        }
        
        return null;
      }
    } catch (error) {
      this.cacheStats.errors++;
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Delete cache by key
   */
  async delete(key) {
    const cacheKey = this.generateKey(key);

    try {
      if (this.isConnected) {
        await this.client.del(cacheKey);
      } else {
        this.memoryCache?.delete(cacheKey);
      }

      this.cacheStats.deletes++;
      
      await auditLog(AUDIT_EVENTS.DATA_MODIFIED, {
        action: 'cache_delete',
        key: cacheKey
      }, null, {
        cacheOperation: 'delete',
        key: cacheKey
      });

      return true;
    } catch (error) {
      this.cacheStats.errors++;
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags) {
    try {
      if (!this.isConnected) {
        // Memory cache doesn't support tag invalidation
        return false;
      }

      const keysToDelete = new Set();

      for (const tag of tags) {
        const tagKey = `${this.prefix}tag:${tag}`;
        const keys = await this.client.sMembers(tagKey);
        
        for (const key of keys) {
          keysToDelete.add(key);
        }
        
        // Delete tag set
        await this.client.del(tagKey);
      }

      // Delete all cached keys
      if (keysToDelete.size > 0) {
        await this.client.del(...Array.from(keysToDelete));
      }

      await auditLog(AUDIT_EVENTS.DATA_MODIFIED, {
        action: 'cache_invalidate_tags',
        tags,
        keysDeleted: keysToDelete.size
      }, null, {
        cacheOperation: 'invalidate_tags',
        tags
      });

      return true;
    } catch (error) {
      logger.error('Cache tag invalidation error:', error);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (this.isConnected) {
        const keys = await this.client.keys(`${this.prefix}*`);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } else {
        this.memoryCache?.clear();
      }

      await auditLog(AUDIT_EVENTS.DATA_MODIFIED, {
        action: 'cache_clear'
      }, null, {
        cacheOperation: 'clear'
      });

      return true;
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.cacheStats,
      hitRate: `${hitRate}%`,
      isConnected: this.isConnected,
      prefix: this.prefix
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (this.isConnected) {
        await this.client.ping();
        return { status: 'healthy', provider: 'redis' };
      } else {
        return { status: 'degraded', provider: 'memory' };
      }
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Close connection
   */
  async close() {
    if (this.isConnected && this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

/**
 * Cache decorator for methods
 */
function cacheable(options = {}) {
  return function (target, propertyName, descriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args) {
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
      
      const cacheManager = require('./advancedCache').cacheManager;
      
      // Try to get from cache
      const cachedResult = await cacheManager.get(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }
      
      // Execute method and cache result
      const result = await method.apply(this, args);
      if (result !== null && result !== undefined) {
        await cacheManager.set(cacheKey, result, options);
      }
      
      return result;
    };
    
    return descriptor;
  };
}

/**
 * Cache middleware for Express routes
 */
const cacheMiddleware = (options = {}) => {
  const {
    ttl = 300,
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    condition = () => true
  } = options;

  return async (req, res, next) => {
    if (!condition(req)) {
      return next();
    }

    const cacheManager = require('./advancedCache').cacheManager;
    const cacheKey = keyGenerator(req);

    try {
      const cachedResponse = await cacheManager.get(cacheKey);
      if (cachedResponse) {
        return res.json(cachedResponse);
      }

      // Store original send method
      const originalSend = res.json;
      
      // Override send method to cache response
      res.json = function(data) {
        cacheManager.set(cacheKey, data, { ttl });
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

// Create singleton instance
const cacheManager = new AdvancedCacheManager();

module.exports = {
  AdvancedCacheManager,
  cacheManager,
  cacheable,
  cacheMiddleware
}; 