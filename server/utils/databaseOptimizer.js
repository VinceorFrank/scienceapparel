/**
 * Database Optimization Utility
 * Provides tools for query optimization, indexing, and performance monitoring
 */

const mongoose = require('mongoose');
const { logger } = require('./logger');

/**
 * Database performance monitoring
 */
class DatabaseOptimizer {
  constructor() {
    this.queryStats = new Map();
    this.slowQueryThreshold = 1000; // 1 second
    this.connectionStats = {
      totalConnections: 0,
      activeConnections: 0,
      maxConnections: 0
    };
  }

  /**
   * Monitor query performance
   */
  monitorQuery(collection, operation, query, duration, resultCount = 0) {
    const key = `${collection}.${operation}`;
    const stats = this.queryStats.get(key) || {
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      slowQueries: 0,
      totalResults: 0
    };

    stats.count++;
    stats.totalDuration += duration;
    stats.avgDuration = stats.totalDuration / stats.count;
    stats.minDuration = Math.min(stats.minDuration, duration);
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    stats.totalResults += resultCount;

    if (duration > this.slowQueryThreshold) {
      stats.slowQueries++;
      logger.warn('Slow query detected', {
        collection,
        operation,
        duration,
        query: JSON.stringify(query),
        resultCount
      });
    }

    this.queryStats.set(key, stats);
  }

  /**
   * Get query performance statistics
   */
  getQueryStats() {
    const stats = {};
    for (const [key, value] of this.queryStats.entries()) {
      stats[key] = {
        ...value,
        slowQueryPercentage: (value.slowQueries / value.count) * 100
      };
    }
    return stats;
  }

  /**
   * Create database indexes for better performance
   */
  async createIndexes() {
    const indexes = {
      // User indexes
      User: [
        { email: 1 },
        { role: 1 },
        { status: 1 },
        { createdAt: -1 },
        { email: 1, status: 1 }
      ],

      // Product indexes
      Product: [
        { name: 'text', description: 'text' },
        { category: 1 },
        { price: 1 },
        { featured: 1 },
        { archived: 1 },
        { rating: -1 },
        { createdAt: -1 },
        { category: 1, archived: 1 },
        { price: 1, archived: 1 }
      ],

      // Order indexes
      Order: [
        { user: 1 },
        { status: 1 },
        { isPaid: 1 },
        { isShipped: 1 },
        { createdAt: -1 },
        { totalPrice: 1 },
        { user: 1, status: 1 },
        { user: 1, createdAt: -1 },
        { status: 1, createdAt: -1 }
      ],

      // Category indexes
      Category: [
        { name: 1 },
        { active: 1 },
        { featured: 1 },
        { sortOrder: 1 }
      ],

      // Cart indexes
      Cart: [
        { user: 1 },
        { expiresAt: 1 },
        { user: 1, expiresAt: 1 }
      ],

      // Activity log indexes
      ActivityLog: [
        { user: 1 },
        { event: 1 },
        { severity: 1 },
        { category: 1 },
        { createdAt: -1 },
        { ip: 1 },
        { user: 1, createdAt: -1 },
        { event: 1, createdAt: -1 },
        { severity: 1, createdAt: -1 }
      ]
    };

    const results = {
      created: [],
      failed: [],
      skipped: []
    };

    for (const [collection, collectionIndexes] of Object.entries(indexes)) {
      try {
        const model = mongoose.model(collection);
        
        for (const indexSpec of collectionIndexes) {
          try {
            await model.collection.createIndex(indexSpec);
            results.created.push(`${collection}.${JSON.stringify(indexSpec)}`);
          } catch (error) {
            if (error.code === 85) { // Index already exists
              results.skipped.push(`${collection}.${JSON.stringify(indexSpec)}`);
            } else {
              results.failed.push({
                index: `${collection}.${JSON.stringify(indexSpec)}`,
                error: error.message
              });
            }
          }
        }
      } catch (error) {
        logger.error(`Failed to create indexes for ${collection}`, { error: error.message });
        results.failed.push({
          collection,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Analyze query performance
   */
  async analyzeQuery(collection, query, options = {}) {
    const model = mongoose.model(collection);
    const explainResult = await model.find(query, null, options).explain('executionStats');
    
    return {
      query: JSON.stringify(query),
      executionTime: explainResult.executionStats.executionTimeMillis,
      totalDocsExamined: explainResult.executionStats.totalDocsExamined,
      totalKeysExamined: explainResult.executionStats.totalKeysExamined,
      nReturned: explainResult.executionStats.nReturned,
      indexUsed: explainResult.executionStats.indexUsed || null,
      stage: explainResult.executionStats.stage
    };
  }

  /**
   * Get database connection statistics
   */
  async getConnectionStats() {
    const db = mongoose.connection.db;
    if (!db) {
      return this.connectionStats;
    }

    try {
      const adminDb = db.admin();
      const serverStatus = await adminDb.serverStatus();
      
      this.connectionStats = {
        totalConnections: serverStatus.connections.current,
        activeConnections: serverStatus.connections.active,
        maxConnections: serverStatus.connections.available,
        availableConnections: serverStatus.connections.available
      };

      return this.connectionStats;
    } catch (error) {
      logger.error('Failed to get connection stats', { error: error.message });
      return this.connectionStats;
    }
  }

  /**
   * Optimize database queries with caching
   */
  createQueryOptimizer() {
    const cache = new Map();
    const cacheTTL = 5 * 60 * 1000; // 5 minutes

    return {
      /**
       * Cached query with TTL
       */
      cachedQuery: async (key, queryFn, ttl = cacheTTL) => {
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < ttl) {
          return cached.data;
        }

        const data = await queryFn();
        cache.set(key, {
          data,
          timestamp: Date.now()
        });

        return data;
      },

      /**
       * Invalidate cache
       */
      invalidateCache: (pattern) => {
        for (const key of cache.keys()) {
          if (key.includes(pattern)) {
            cache.delete(key);
          }
        }
      },

      /**
       * Clear all cache
       */
      clearCache: () => {
        cache.clear();
      },

      /**
       * Get cache statistics
       */
      getCacheStats: () => {
        return {
          size: cache.size,
          keys: Array.from(cache.keys())
        };
      }
    };
  }

  /**
   * Create query builder with optimization
   */
  createQueryBuilder() {
    return {
      /**
       * Build optimized find query
       */
      find: (model, filters = {}, options = {}) => {
        const query = model.find(filters);
        
        // Add pagination
        if (options.page && options.limit) {
          const skip = (options.page - 1) * options.limit;
          query.skip(skip).limit(options.limit);
        }

        // Add sorting
        if (options.sort) {
          query.sort(options.sort);
        }

        // Add field selection
        if (options.select) {
          query.select(options.select);
        }

        // Add population
        if (options.populate) {
          if (Array.isArray(options.populate)) {
            options.populate.forEach(pop => query.populate(pop));
          } else {
            query.populate(options.populate);
          }
        }

        return query;
      },

      /**
       * Build optimized aggregation pipeline
       */
      aggregate: (model, pipeline = [], options = {}) => {
        const aggregation = model.aggregate(pipeline);

        // Add pagination for aggregation
        if (options.page && options.limit) {
          const skip = (options.page - 1) * options.limit;
          aggregation.skip(skip).limit(options.limit);
        }

        return aggregation;
      }
    };
  }

  /**
   * Monitor database performance
   */
  startPerformanceMonitoring() {
    const interval = setInterval(async () => {
      try {
        const stats = this.getQueryStats();
        const connectionStats = await this.getConnectionStats();

        logger.info('Database performance report', {
          queryStats: stats,
          connectionStats,
          timestamp: new Date().toISOString()
        });

        // Alert on slow queries
        for (const [key, value] of Object.entries(stats)) {
          if (value.slowQueryPercentage > 10) {
            logger.warn('High percentage of slow queries detected', {
              collection: key,
              slowQueryPercentage: value.slowQueryPercentage,
              avgDuration: value.avgDuration
            });
          }
        }

        // Alert on connection issues
        if (connectionStats.activeConnections > connectionStats.maxConnections * 0.8) {
          logger.warn('High database connection usage', {
            activeConnections: connectionStats.activeConnections,
            maxConnections: connectionStats.maxConnections,
            usagePercentage: (connectionStats.activeConnections / connectionStats.maxConnections) * 100
          });
        }

      } catch (error) {
        logger.error('Database performance monitoring error', { error: error.message });
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }
}

// Create singleton instance
const dbOptimizer = new DatabaseOptimizer();

module.exports = {
  DatabaseOptimizer,
  dbOptimizer
}; 