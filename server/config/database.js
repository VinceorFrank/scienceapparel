const mongoose = require('mongoose');
const config = require('./env');
const { logger } = require('../utils/logger');

// Enhanced database connection with security and performance optimizations
const connectDB = async () => {
  try {
    // Get database options with connection pooling and security (modern options only)
    const dbOptions = config.getDatabaseOptions();
    
    // Connect to MongoDB with enhanced options
    await mongoose.connect(config.MONGO_URI, dbOptions);
    
    // Log successful connection
    logger.info('MongoDB connected successfully', {
      database: config.MONGO_URI.replace(/\/\/.*@/, '//***@'), // Hide credentials in logs
      maxPoolSize: dbOptions.maxPoolSize,
      environment: config.NODE_ENV,
      readPreference: dbOptions.readPreference,
      compression: dbOptions.compressors
    });
    
    // Set up connection event handlers with enhanced monitoring
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', {
        error: err.message,
        stack: err.stack,
        code: err.code,
        name: err.name
      });
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected', {
        readyState: mongoose.connection.readyState
      });
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected', {
        readyState: mongoose.connection.readyState
      });
    });
    
    // Monitor connection pool
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection pool status', {
        poolSize: mongoose.connection.pool?.size,
        available: mongoose.connection.pool?.available,
        pending: mongoose.connection.pool?.pending
      });
    });
    
    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      try {
        logger.info('Shutting down database connection...');
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });
    
    // Set mongoose options for better performance and security
    mongoose.set('debug', config.NODE_ENV === 'development');
    mongoose.set('strictQuery', true);
    
    // Performance optimizations (updated for modern Mongoose)
    mongoose.set('bufferCommands', true);
    
    return mongoose.connection;
    
  } catch (err) {
    logger.error('Failed to connect to MongoDB:', {
      error: err.message,
      stack: err.stack,
      database: config.MONGO_URI.replace(/\/\/.*@/, '//***@'),
      code: err.code,
      name: err.name
    });
    
    // In production, exit the process
    if (config.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    throw err;
  }
};

// Enhanced health check function for database
const checkDatabaseHealth = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Ping the database
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      const responseTime = Date.now() - startTime;
      
      // Get connection pool stats
      const poolStats = {
        size: mongoose.connection.pool?.size || 0,
        available: mongoose.connection.pool?.available || 0,
        pending: mongoose.connection.pool?.pending || 0
      };
      
      return { 
        status: 'healthy', 
        readyState: mongoose.connection.readyState,
        responseTime: `${responseTime}ms`,
        poolStats
      };
    } else {
      return { 
        status: 'unhealthy', 
        readyState: mongoose.connection.readyState,
        message: 'Database not connected'
      };
    }
  } catch (error) {
    logger.error('Database health check failed:', error);
    return { 
      status: 'unhealthy', 
      readyState: mongoose.connection.readyState,
      error: error.message 
    };
  }
};

// Enhanced function to get database statistics
const getDatabaseStats = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return null;
    }
    
    const stats = await mongoose.connection.db.stats();
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Get index information for each collection
    const indexStats = {};
    for (const collection of collections) {
      try {
        const indexes = await mongoose.connection.db.collection(collection.name).indexes();
        indexStats[collection.name] = {
          count: indexes.length,
          totalSize: indexes.reduce((sum, idx) => sum + (idx.size || 0), 0)
        };
      } catch (error) {
        logger.warn(`Failed to get index stats for ${collection.name}:`, error.message);
      }
    }
    
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
      indexStats,
      connectionPool: {
        size: mongoose.connection.pool?.size || 0,
        available: mongoose.connection.pool?.available || 0,
        pending: mongoose.connection.pool?.pending || 0
      }
    };
  } catch (error) {
    logger.error('Failed to get database stats:', error);
    return null;
  }
};

// Enhanced function to get slow query statistics
const getSlowQueryStats = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return null;
    }
    
    // Get profiler status
    const profilerStatus = await mongoose.connection.db.admin().getProfilingStatus();
    
    // Get slow queries if profiling is enabled
    let slowQueries = [];
    if (profilerStatus.was > 0) {
      const slowQueryCursor = mongoose.connection.db.collection('system.profile').find({
        millis: { $gt: 100 } // Queries taking more than 100ms
      }).sort({ ts: -1 }).limit(10);
      
      slowQueries = await slowQueryCursor.toArray();
    }
    
    return {
      profilerStatus,
      slowQueries: slowQueries.map(query => ({
        operation: query.op,
        collection: query.ns,
        duration: query.millis,
        timestamp: query.ts,
        query: query.query,
        planSummary: query.planSummary
      }))
    };
  } catch (error) {
    logger.error('Failed to get slow query stats:', error);
    return null;
  }
};

// Function to enable/disable query profiling
const setQueryProfiling = async (level = 0) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }
    
    await mongoose.connection.db.admin().setProfilingLevel(level);
    logger.info(`Query profiling set to level: ${level}`);
    
    return { success: true, level };
  } catch (error) {
    logger.error('Failed to set query profiling:', error);
    return { success: false, error: error.message };
  }
};

// Enhanced function to close database connection gracefully
const closeDatabase = async () => {
  try {
    logger.info('Closing database connection...');
    await mongoose.connection.close();
    logger.info('Database connection closed gracefully');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

// Function to optimize database performance
const optimizeDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }
    
    logger.info('Starting database optimization...');
    
    // Compact collections to reclaim space
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of collections) {
      try {
        await mongoose.connection.db.collection(collection.name).compact();
        logger.info(`Compacted collection: ${collection.name}`);
      } catch (error) {
        logger.warn(`Failed to compact collection ${collection.name}:`, error.message);
      }
    }
    
    // Update statistics
    await mongoose.connection.db.admin().command({ dbStats: 1 });
    
    logger.info('Database optimization completed');
    return { success: true };
  } catch (error) {
    logger.error('Database optimization failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  connectDB,
  checkDatabaseHealth,
  getDatabaseStats,
  getSlowQueryStats,
  setQueryProfiling,
  optimizeDatabase,
  closeDatabase
}; 