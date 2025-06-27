/**
 * Log cleanup utility for maintaining disk space
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

class LogCleanup {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
    this.maxAge = {
      error: 30, // days
      combined: 60, // days
      http: 7, // days
      security: 90, // days
      requests: 30 // days
    };
  }

  /**
   * Clean up old log files
   */
  async cleanup() {
    try {
      if (!fs.existsSync(this.logsDir)) {
        logger.info('Logs directory does not exist, skipping cleanup');
        return;
      }

      const files = fs.readdirSync(this.logsDir);
      const now = new Date();
      let deletedCount = 0;
      let totalSizeFreed = 0;

      for (const file of files) {
        const filePath = path.join(this.logsDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = (now - stats.mtime) / (1000 * 60 * 60 * 24); // days

        // Determine max age based on file type
        let maxAge = this.maxAge.combined; // default
        if (file.includes('error-')) maxAge = this.maxAge.error;
        else if (file.includes('http-')) maxAge = this.maxAge.http;
        else if (file.includes('security-')) maxAge = this.maxAge.security;
        else if (file.includes('requests-')) maxAge = this.maxAge.requests;

        if (fileAge > maxAge) {
          try {
            fs.unlinkSync(filePath);
            deletedCount++;
            totalSizeFreed += stats.size;
            
            logger.info('Deleted old log file', {
              file,
              age: Math.round(fileAge),
              size: stats.size
            });
          } catch (error) {
            logger.error('Failed to delete log file', {
              file,
              error: error.message
            });
          }
        }
      }

      logger.info('Log cleanup completed', {
        deletedCount,
        totalSizeFreed: `${(totalSizeFreed / 1024 / 1024).toFixed(2)} MB`
      });

    } catch (error) {
      logger.error('Error during log cleanup', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Get log directory statistics
   */
  getStats() {
    try {
      if (!fs.existsSync(this.logsDir)) {
        return {
          exists: false,
          totalFiles: 0,
          totalSize: 0
        };
      }

      const files = fs.readdirSync(this.logsDir);
      let totalSize = 0;
      const fileTypes = {};

      files.forEach(file => {
        const filePath = path.join(this.logsDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;

        const fileType = path.extname(file);
        fileTypes[fileType] = (fileTypes[fileType] || 0) + 1;
      });

      return {
        exists: true,
        totalFiles: files.length,
        totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
        fileTypes
      };
    } catch (error) {
      logger.error('Error getting log stats', { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * Schedule automatic cleanup
   */
  scheduleCleanup(intervalHours = 24) {
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    setInterval(() => {
      this.cleanup();
    }, intervalMs);

    logger.info('Scheduled log cleanup', {
      intervalHours,
      nextRun: new Date(Date.now() + intervalMs)
    });
  }
}

// Export singleton instance
const logCleanup = new LogCleanup();

module.exports = logCleanup; 