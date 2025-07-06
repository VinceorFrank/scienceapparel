/**
 * Message Queue System for Async Processing
 * Provides job queuing, processing, retry logic, and monitoring
 */

const { EventEmitter } = require('events');
const { logger } = require('./logger');
const { auditLog, AUDIT_EVENTS } = require('./auditLogger');
const { v4: uuidv4 } = require('uuid');

/**
 * Job Status Enum
 */
const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  RETRY: 'retry'
};

/**
 * Job Priority Enum
 */
const JOB_PRIORITY = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  URGENT: 4
};

/**
 * Message Queue Manager Class
 */
class MessageQueueManager extends EventEmitter {
  constructor() {
    super();
    this.queues = new Map();
    this.workers = new Map();
    this.jobs = new Map();
    this.stats = {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      retriedJobs: 0,
      activeWorkers: 0
    };
    this.isRunning = false;
  }

  /**
   * Create a new queue
   */
  createQueue(name, options = {}) {
    const {
      concurrency = 1,
      retryAttempts = 3,
      retryDelay = 5000,
      timeout = 30000
    } = options;

    const queue = {
      name,
      jobs: [],
      processing: new Set(),
      workers: [],
      options: {
        concurrency,
        retryAttempts,
        retryDelay,
        timeout
      },
      stats: {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      }
    };

    this.queues.set(name, queue);
    logger.info(`Queue created: ${name}`, { options: queue.options });
    
    return queue;
  }

  /**
   * Add a job to queue
   */
  async addJob(queueName, jobData, options = {}) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const {
      priority = JOB_PRIORITY.NORMAL,
      delay = 0,
      attempts = queue.options.retryAttempts,
      timeout = queue.options.timeout
    } = options;

    const job = {
      id: uuidv4(),
      queueName,
      data: jobData,
      status: JOB_STATUS.PENDING,
      priority,
      attempts: {
        max: attempts,
        current: 0
      },
      timeout,
      delay,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      error: null,
      result: null
    };

    // Add to queue based on priority
    if (priority === JOB_PRIORITY.URGENT) {
      queue.jobs.unshift(job);
    } else {
      queue.jobs.push(job);
    }

    // Sort by priority
    queue.jobs.sort((a, b) => b.priority - a.priority);

    this.jobs.set(job.id, job);
    queue.stats.pending++;
    this.stats.totalJobs++;

    // Emit job added event
    this.emit('job:added', { job, queueName });

    // Log job creation
    await auditLog(AUDIT_EVENTS.DATA_MODIFIED, {
      action: 'job_added',
      queueName,
      jobId: job.id,
      priority,
      delay
    }, null, {
      jobId: job.id,
      queueName,
      priority
    });

    logger.info(`Job added to queue ${queueName}`, {
      jobId: job.id,
      priority,
      queueSize: queue.jobs.length
    });

    return job.id;
  }

  /**
   * Process jobs in a queue
   */
  async processQueue(queueName, processor) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const worker = {
      id: uuidv4(),
      queueName,
      processor,
      isRunning: false
    };

    queue.workers.push(worker);
    this.workers.set(worker.id, worker);

    const processJobs = async () => {
      if (worker.isRunning) return;
      worker.isRunning = true;

      while (this.isRunning && queue.jobs.length > 0 && queue.processing.size < queue.options.concurrency) {
        const job = queue.jobs.shift();
        if (!job) break;

        // Check if job should be delayed
        if (job.delay > 0 && Date.now() - job.createdAt < job.delay) {
          queue.jobs.push(job);
          continue;
        }

        await this.processJob(job, processor);
      }

      worker.isRunning = false;
    };

    // Start processing
    this.stats.activeWorkers++;
    logger.info(`Worker started for queue ${queueName}`, { workerId: worker.id });

    // Process jobs continuously
    const interval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(interval);
        return;
      }
      processJobs();
    }, 1000);

    return worker.id;
  }

  /**
   * Process a single job
   */
  async processJob(job, processor) {
    const queue = this.queues.get(job.queueName);
    queue.processing.add(job.id);
    queue.stats.pending--;
    queue.stats.processing++;

    job.status = JOB_STATUS.PROCESSING;
    job.startedAt = Date.now();
    job.attempts.current++;

    // Emit job started event
    this.emit('job:started', { job });

    try {
      // Set timeout for job processing
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Job timeout'));
        }, job.timeout);
      });

      // Process job with timeout
      const result = await Promise.race([
        processor(job.data, job),
        timeoutPromise
      ]);

      // Job completed successfully
      job.status = JOB_STATUS.COMPLETED;
      job.result = result;
      job.completedAt = Date.now();

      queue.stats.processing--;
      queue.stats.completed++;
      this.stats.completedJobs++;

      // Emit job completed event
      this.emit('job:completed', { job, result });

      // Log job completion
      await auditLog(AUDIT_EVENTS.DATA_MODIFIED, {
        action: 'job_completed',
        queueName: job.queueName,
        jobId: job.id,
        duration: job.completedAt - job.startedAt
      }, null, {
        jobId: job.id,
        queueName: job.queueName,
        duration: job.completedAt - job.startedAt
      });

      logger.info(`Job completed: ${job.id}`, {
        queueName: job.queueName,
        duration: job.completedAt - job.startedAt
      });

    } catch (error) {
      // Job failed
      job.error = error.message;
      job.status = JOB_STATUS.FAILED;
      job.completedAt = Date.now();

      queue.stats.processing--;
      queue.stats.failed++;
      this.stats.failedJobs++;

      // Check if job should be retried
      if (job.attempts.current < job.attempts.max) {
        job.status = JOB_STATUS.RETRY;
        this.stats.retriedJobs++;

        // Add job back to queue with delay
        setTimeout(() => {
          job.status = JOB_STATUS.PENDING;
          job.error = null;
          queue.jobs.push(job);
          queue.stats.pending++;
        }, queue.options.retryDelay);

        logger.warn(`Job failed, retrying: ${job.id}`, {
          queueName: job.queueName,
          attempt: job.attempts.current,
          maxAttempts: job.attempts.max,
          error: error.message
        });
      } else {
        logger.error(`Job failed permanently: ${job.id}`, {
          queueName: job.queueName,
          attempts: job.attempts.current,
          error: error.message
        });
      }

      // Emit job failed event
      this.emit('job:failed', { job, error });

      // Log job failure
      await auditLog(AUDIT_EVENTS.SUSPICIOUS_ACTIVITY, {
        action: 'job_failed',
        queueName: job.queueName,
        jobId: job.id,
        error: error.message,
        attempts: job.attempts.current
      }, null, {
        jobId: job.id,
        queueName: job.queueName,
        error: error.message
      });
    } finally {
      queue.processing.delete(job.id);
    }
  }

  /**
   * Get job status
   */
  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === JOB_STATUS.PROCESSING) {
      throw new Error('Cannot cancel processing job');
    }

    job.status = JOB_STATUS.CANCELLED;
    job.completedAt = Date.now();

    // Remove from queue if still pending
    const queue = this.queues.get(job.queueName);
    if (queue) {
      const index = queue.jobs.findIndex(j => j.id === jobId);
      if (index !== -1) {
        queue.jobs.splice(index, 1);
        queue.stats.pending--;
      }
    }

    // Emit job cancelled event
    this.emit('job:cancelled', { job });

    logger.info(`Job cancelled: ${jobId}`);
    return true;
  }

  /**
   * Get queue statistics
   */
  getQueueStats(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return {
      name: queueName,
      ...queue.stats,
      workers: queue.workers.length,
      options: queue.options
    };
  }

  /**
   * Get overall statistics
   */
  getStats() {
    const queueStats = {};
    for (const [name, queue] of this.queues.entries()) {
      queueStats[name] = this.getQueueStats(name);
    }

    return {
      queues: queueStats,
      jobs: this.stats,
      workers: this.stats.activeWorkers,
      isRunning: this.isRunning
    };
  }

  /**
   * Start the message queue system
   */
  start() {
    this.isRunning = true;
    logger.info('Message queue system started');
    this.emit('system:started');
  }

  /**
   * Stop the message queue system
   */
  async stop() {
    this.isRunning = false;
    
    // Wait for all jobs to complete
    const queues = Array.from(this.queues.values());
    for (const queue of queues) {
      while (queue.processing.size > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    logger.info('Message queue system stopped');
    this.emit('system:stopped');
  }

  /**
   * Clear all queues
   */
  async clear() {
    for (const [name, queue] of this.queues.entries()) {
      queue.jobs = [];
      queue.processing.clear();
      queue.stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      };
    }

    this.jobs.clear();
    this.stats = {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      retriedJobs: 0,
      activeWorkers: 0
    };

    logger.info('All queues cleared');
  }
}

/**
 * Predefined job processors
 */
const jobProcessors = {
  /**
   * Email sending processor
   */
  email: async (data, job) => {
    const { to, subject, body, template } = data;
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info(`Email sent to ${to}`, { subject, jobId: job.id });
    return { sent: true, to, subject };
  },

  /**
   * Notification processor
   */
  notification: async (data, job) => {
    const { userId, type, message } = data;
    
    // Simulate notification processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    logger.info(`Notification sent to user ${userId}`, { type, jobId: job.id });
    return { sent: true, userId, type };
  },

  /**
   * Data export processor
   */
  export: async (data, job) => {
    const { format, filters, userId } = data;
    
    // Simulate data export
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    logger.info(`Data export completed for user ${userId}`, { format, jobId: job.id });
    return { exported: true, format, userId };
  },

  /**
   * Image processing processor
   */
  imageProcessing: async (data, job) => {
    const { imageUrl, operations } = data;
    
    // Simulate image processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    logger.info(`Image processing completed`, { imageUrl, jobId: job.id });
    return { processed: true, imageUrl, operations };
  }
};

// Create singleton instance
const messageQueue = new MessageQueueManager();

module.exports = {
  MessageQueueManager,
  messageQueue,
  JOB_STATUS,
  JOB_PRIORITY,
  jobProcessors
}; 