/**
 * In-memory caching utility with TTL support
 */

class Cache {
  constructor() {
    this.store = new Map();
    this.timers = new Map();
  }

  /**
   * Set a value in cache with optional TTL
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = 300000) { // Default 5 minutes
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set the value
    this.store.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined if not found/expired
   */
  get(key) {
    const item = this.store.get(key);
    
    if (!item) {
      return undefined;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return undefined;
    }

    return item.value;
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.store.delete(key);
    
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  /**
   * Clear all cached values
   */
  clear() {
    this.store.clear();
    
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let validCount = 0;

    this.store.forEach(item => {
      if (now - item.timestamp > item.ttl) {
        expiredCount++;
      } else {
        validCount++;
      }
    });

    return {
      total: this.store.size,
      valid: validCount,
      expired: expiredCount,
      timers: this.timers.size
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    this.store.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.delete(key));
  }
}

// Create global cache instance
const cache = new Cache();

/**
 * Cache middleware for Express routes
 * @param {number} ttl - Time to live in milliseconds
 * @param {Function} keyGenerator - Function to generate cache key
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (ttl = 300000, keyGenerator = null) => {
  return (req, res, next) => {
    // Generate cache key
    const key = keyGenerator ? keyGenerator(req) : `api:${req.originalUrl}`;
    
    // Try to get from cache
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Store original send method
    const originalSend = res.json;

    // Override send method to cache response
    res.json = function(data) {
      cache.set(key, data, ttl);
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Generate cache key from request
 * @param {Object} req - Express request object
 * @returns {string} Cache key
 */
const generateCacheKey = (req) => {
  const { url, method, query, params, user } = req;
  
  // Include user ID in cache key if authenticated
  const userKey = user ? `:user:${user._id}` : ':anonymous';
  
  // Include query parameters in cache key
  const queryKey = Object.keys(query).length > 0 
    ? `:query:${JSON.stringify(query)}` 
    : '';
  
  // Include route parameters in cache key
  const paramsKey = Object.keys(params).length > 0 
    ? `:params:${JSON.stringify(params)}` 
    : '';

  return `${method}:${url}${userKey}${queryKey}${paramsKey}`;
};

/**
 * Cache decorator for functions
 * @param {Function} fn - Function to cache
 * @param {number} ttl - Time to live in milliseconds
 * @param {Function} keyGenerator - Function to generate cache key
 * @returns {Function} Cached function
 */
const cacheFunction = (fn, ttl = 300000, keyGenerator = null) => {
  return async (...args) => {
    const key = keyGenerator ? keyGenerator(...args) : `fn:${fn.name}:${JSON.stringify(args)}`;
    
    // Try to get from cache
    const cachedResult = cache.get(key);
    if (cachedResult !== undefined) {
      return cachedResult;
    }

    // Execute function and cache result
    const result = await fn(...args);
    cache.set(key, result, ttl);
    
    return result;
  };
};

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Pattern to match keys (supports wildcards)
 */
const invalidatePattern = (pattern) => {
  const regex = new RegExp(pattern.replace(/\*/g, '.*'));
  
  cache.store.forEach((value, key) => {
    if (regex.test(key)) {
      cache.delete(key);
    }
  });
};

/**
 * Predefined cache keys for common operations
 */
const CACHE_KEYS = {
  PRODUCTS: 'products',
  PRODUCT_DETAIL: 'product:detail',
  CATEGORIES: 'categories',
  USERS: 'users',
  ORDERS: 'orders',
  DASHBOARD_METRICS: 'dashboard:metrics',
  DASHBOARD_SALES: 'dashboard:sales',
  DASHBOARD_ORDERS: 'dashboard:orders'
};

/**
 * Invalidate related cache entries
 * @param {string} entity - Entity type
 * @param {string} id - Entity ID (optional)
 */
const invalidateEntityCache = (entity, id = null) => {
  const patterns = [
    `${entity}*`,
    `*${entity}*`
  ];

  if (id) {
    patterns.push(`*${id}*`);
  }

  patterns.forEach(pattern => invalidatePattern(pattern));
};

module.exports = {
  cache,
  cacheMiddleware,
  generateCacheKey,
  cacheFunction,
  invalidatePattern,
  invalidateEntityCache,
  CACHE_KEYS
}; 