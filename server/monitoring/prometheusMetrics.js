/**
 * Prometheus Metrics - Advanced monitoring and observability
 * Handles metrics collection, Prometheus format, and monitoring endpoints
 */

const { logger } = require('../utils/logger');
const { auditLog, AUDIT_EVENTS } = require('../utils/auditLogger');

class PrometheusMetrics {
  constructor() {
    this.metrics = new Map();
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.summaries = new Map();
    this.startTime = Date.now();
  }

  /**
   * Create a counter metric
   */
  createCounter(name, help, labels = []) {
    const counter = {
      name: this.sanitizeMetricName(name),
      help: help || `Counter for ${name}`,
      labels: labels,
      values: new Map(),
      type: 'counter'
    };

    this.counters.set(name, counter);
    this.metrics.set(name, counter);
    
    logger.info(`Counter metric created: ${name}`);
    return counter;
  }

  /**
   * Create a gauge metric
   */
  createGauge(name, help, labels = []) {
    const gauge = {
      name: this.sanitizeMetricName(name),
      help: help || `Gauge for ${name}`,
      labels: labels,
      values: new Map(),
      type: 'gauge'
    };

    this.gauges.set(name, gauge);
    this.metrics.set(name, gauge);
    
    logger.info(`Gauge metric created: ${name}`);
    return gauge;
  }

  /**
   * Create a histogram metric
   */
  createHistogram(name, help, buckets = [0.1, 0.5, 1, 2, 5], labels = []) {
    const histogram = {
      name: this.sanitizeMetricName(name),
      help: help || `Histogram for ${name}`,
      labels: labels,
      buckets: buckets,
      values: new Map(),
      type: 'histogram'
    };

    this.histograms.set(name, histogram);
    this.metrics.set(name, histogram);
    
    logger.info(`Histogram metric created: ${name}`);
    return histogram;
  }

  /**
   * Create a summary metric
   */
  createSummary(name, help, quantiles = [0.5, 0.9, 0.95, 0.99], labels = []) {
    const summary = {
      name: this.sanitizeMetricName(name),
      help: help || `Summary for ${name}`,
      labels: labels,
      quantiles: quantiles,
      values: new Map(),
      type: 'summary'
    };

    this.summaries.set(name, summary);
    this.metrics.set(name, summary);
    
    logger.info(`Summary metric created: ${name}`);
    return summary;
  }

  /**
   * Increment a counter
   */
  incrementCounter(name, value = 1, labelValues = {}) {
    const counter = this.counters.get(name);
    if (!counter) {
      throw new Error(`Counter ${name} not found`);
    }

    const key = this.createLabelKey(labelValues);
    const currentValue = counter.values.get(key) || 0;
    counter.values.set(key, currentValue + value);

    logger.debug(`Counter incremented: ${name}`, { value, labelValues });
  }

  /**
   * Set a gauge value
   */
  setGauge(name, value, labelValues = {}) {
    const gauge = this.gauges.get(name);
    if (!gauge) {
      throw new Error(`Gauge ${name} not found`);
    }

    const key = this.createLabelKey(labelValues);
    gauge.values.set(key, value);

    logger.debug(`Gauge set: ${name}`, { value, labelValues });
  }

  /**
   * Observe a histogram value
   */
  observeHistogram(name, value, labelValues = {}) {
    const histogram = this.histograms.get(name);
    if (!histogram) {
      throw new Error(`Histogram ${name} not found`);
    }

    const key = this.createLabelKey(labelValues);
    const bucketKey = this.getBucketKey(value, histogram.buckets);
    
    // Update bucket counts
    for (const bucket of histogram.buckets) {
      const bucketName = `${name}_bucket`;
      const bucketKey = this.createLabelKey({ ...labelValues, le: bucket });
      const currentCount = histogram.values.get(bucketKey) || 0;
      
      if (value <= bucket) {
        histogram.values.set(bucketKey, currentCount + 1);
      }
    }

    // Update sum
    const sumKey = this.createLabelKey({ ...labelValues, le: '+Inf' });
    const currentSum = histogram.values.get(sumKey) || 0;
    histogram.values.set(sumKey, currentSum + value);

    // Update count
    const countKey = this.createLabelKey(labelValues);
    const currentCount = histogram.values.get(countKey) || 0;
    histogram.values.set(countKey, currentCount + 1);

    logger.debug(`Histogram observed: ${name}`, { value, labelValues });
  }

  /**
   * Observe a summary value
   */
  observeSummary(name, value, labelValues = {}) {
    const summary = this.summaries.get(name);
    if (!summary) {
      throw new Error(`Summary ${name} not found`);
    }

    const key = this.createLabelKey(labelValues);
    const currentValues = summary.values.get(key) || [];
    currentValues.push(value);
    
    // Keep only last 1000 values for quantile calculation
    if (currentValues.length > 1000) {
      currentValues.splice(0, currentValues.length - 1000);
    }
    
    summary.values.set(key, currentValues);

    logger.debug(`Summary observed: ${name}`, { value, labelValues });
  }

  /**
   * Record HTTP request metrics
   */
  recordHTTPRequest(method, path, statusCode, duration) {
    // HTTP request counter
    this.incrementCounter('http_requests_total', 1, {
      method,
      path,
      status: statusCode.toString()
    });

    // HTTP request duration histogram
    this.observeHistogram('http_request_duration_seconds', duration / 1000, {
      method,
      path
    });

    // HTTP request size (if available)
    if (duration > 0) {
      this.observeHistogram('http_request_size_bytes', duration, {
        method,
        path
      });
    }
  }

  /**
   * Record database metrics
   */
  recordDatabaseOperation(operation, table, duration, success) {
    // Database operation counter
    this.incrementCounter('database_operations_total', 1, {
      operation,
      table,
      success: success.toString()
    });

    // Database operation duration histogram
    this.observeHistogram('database_operation_duration_seconds', duration / 1000, {
      operation,
      table
    });
  }

  /**
   * Record cache metrics
   */
  recordCacheOperation(operation, cache, duration, success) {
    // Cache operation counter
    this.incrementCounter('cache_operations_total', 1, {
      operation,
      cache,
      success: success.toString()
    });

    // Cache operation duration histogram
    this.observeHistogram('cache_operation_duration_seconds', duration / 1000, {
      operation,
      cache
    });
  }

  /**
   * Record queue metrics
   */
  recordQueueOperation(queue, operation, duration, success) {
    // Queue operation counter
    this.incrementCounter('queue_operations_total', 1, {
      queue,
      operation,
      success: success.toString()
    });

    // Queue operation duration histogram
    this.observeHistogram('queue_operation_duration_seconds', duration / 1000, {
      queue,
      operation
    });
  }

  /**
   * Record business metrics
   */
  recordBusinessMetric(metric, value, labels = {}) {
    // Business metric gauge
    this.setGauge(`business_${metric}`, value, labels);
  }

  /**
   * Generate Prometheus format metrics
   */
  generatePrometheusFormat() {
    let output = '';

    // Add metrics
    for (const [name, metric] of this.metrics.entries()) {
      output += `# HELP ${metric.name} ${metric.help}\n`;
      output += `# TYPE ${metric.name} ${metric.type}\n`;

      for (const [labelKey, value] of metric.values.entries()) {
        const labels = this.parseLabelKey(labelKey);
        const labelString = Object.keys(labels).length > 0 
          ? `{${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
          : '';

        if (metric.type === 'histogram') {
          // Handle histogram buckets
          if (labels.le) {
            output += `${metric.name}_bucket${labelString} ${value}\n`;
          } else {
            output += `${metric.name}_sum${labelString} ${value}\n`;
            output += `${metric.name}_count${labelString} ${value}\n`;
          }
        } else if (metric.type === 'summary') {
          // Handle summary quantiles
          const values = Array.isArray(value) ? value : [value];
          if (values.length > 0) {
            const sorted = values.sort((a, b) => a - b);
            for (const quantile of metric.quantiles) {
              const index = Math.floor(sorted.length * quantile);
              const quantileValue = sorted[index] || 0;
              output += `${metric.name}{quantile="${quantile}"}${labelString} ${quantileValue}\n`;
            }
            output += `${metric.name}_sum${labelString} ${values.reduce((sum, v) => sum + v, 0)}\n`;
            output += `${metric.name}_count${labelString} ${values.length}\n`;
          }
        } else {
          output += `${metric.name}${labelString} ${value}\n`;
        }
      }
    }

    // Add process metrics
    output += this.generateProcessMetrics();

    return output;
  }

  /**
   * Generate process metrics
   */
  generateProcessMetrics() {
    const process = require('process');
    const os = require('os');

    let output = '';

    // Process uptime
    output += `# HELP process_uptime_seconds Total process uptime in seconds\n`;
    output += `# TYPE process_uptime_seconds counter\n`;
    output += `process_uptime_seconds ${(Date.now() - this.startTime) / 1000}\n`;

    // Memory usage
    const memUsage = process.memoryUsage();
    output += `# HELP process_memory_usage_bytes Memory usage in bytes\n`;
    output += `# TYPE process_memory_usage_bytes gauge\n`;
    output += `process_memory_usage_bytes{type="heap_used"} ${memUsage.heapUsed}\n`;
    output += `process_memory_usage_bytes{type="heap_total"} ${memUsage.heapTotal}\n`;
    output += `process_memory_usage_bytes{type="external"} ${memUsage.external}\n`;
    output += `process_memory_usage_bytes{type="rss"} ${memUsage.rss}\n`;

    // CPU usage
    const cpuUsage = process.cpuUsage();
    output += `# HELP process_cpu_usage_seconds CPU usage in seconds\n`;
    output += `# TYPE process_cpu_usage_seconds counter\n`;
    output += `process_cpu_usage_seconds{type="user"} ${cpuUsage.user / 1000000}\n`;
    output += `process_cpu_usage_seconds{type="system"} ${cpuUsage.system / 1000000}\n`;

    // System metrics
    output += `# HELP system_cpu_count Number of CPUs\n`;
    output += `# TYPE system_cpu_count gauge\n`;
    output += `system_cpu_count ${os.cpus().length}\n`;

    output += `# HELP system_memory_total_bytes Total system memory in bytes\n`;
    output += `# TYPE system_memory_total_bytes gauge\n`;
    output += `system_memory_total_bytes ${os.totalmem()}\n`;

    output += `# HELP system_memory_free_bytes Free system memory in bytes\n`;
    output += `# TYPE system_memory_free_bytes gauge\n`;
    output += `system_memory_free_bytes ${os.freemem()}\n`;

    return output;
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    const summary = {
      totalMetrics: this.metrics.size,
      counters: this.counters.size,
      gauges: this.gauges.size,
      histograms: this.histograms.size,
      summaries: this.summaries.size,
      uptime: (Date.now() - this.startTime) / 1000,
      timestamp: new Date().toISOString()
    };

    return summary;
  }

  /**
   * Reset all metrics
   */
  resetMetrics() {
    this.metrics.clear();
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.summaries.clear();
    
    logger.info('All metrics reset');
  }

  /**
   * Sanitize metric name for Prometheus format
   */
  sanitizeMetricName(name) {
    return name
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^[0-9]/, '_$&')
      .toLowerCase();
  }

  /**
   * Create label key for internal storage
   */
  createLabelKey(labelValues) {
    if (Object.keys(labelValues).length === 0) {
      return '__default__';
    }
    
    return Object.entries(labelValues)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
  }

  /**
   * Parse label key back to object
   */
  parseLabelKey(labelKey) {
    if (labelKey === '__default__') {
      return {};
    }
    
    const labels = {};
    labelKey.split(',').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        labels[key] = value;
      }
    });
    
    return labels;
  }

  /**
   * Get bucket key for histogram
   */
  getBucketKey(value, buckets) {
    for (const bucket of buckets) {
      if (value <= bucket) {
        return bucket;
      }
    }
    return '+Inf';
  }

  /**
   * Initialize default metrics
   */
  initializeDefaultMetrics() {
    // HTTP metrics
    this.createCounter('http_requests_total', 'Total number of HTTP requests');
    this.createHistogram('http_request_duration_seconds', 'HTTP request duration in seconds');
    this.createHistogram('http_request_size_bytes', 'HTTP request size in bytes');

    // Database metrics
    this.createCounter('database_operations_total', 'Total number of database operations');
    this.createHistogram('database_operation_duration_seconds', 'Database operation duration in seconds');

    // Cache metrics
    this.createCounter('cache_operations_total', 'Total number of cache operations');
    this.createHistogram('cache_operation_duration_seconds', 'Cache operation duration in seconds');

    // Queue metrics
    this.createCounter('queue_operations_total', 'Total number of queue operations');
    this.createHistogram('queue_operation_duration_seconds', 'Queue operation duration in seconds');

    // Business metrics
    this.createGauge('business_active_users', 'Number of active users');
    this.createGauge('business_total_orders', 'Total number of orders');
    this.createGauge('business_total_revenue', 'Total revenue');

    // System metrics
    this.createGauge('system_memory_usage_percent', 'System memory usage percentage');
    this.createGauge('system_cpu_usage_percent', 'System CPU usage percentage');

    logger.info('Default metrics initialized');
  }
}

// Create singleton instance
const prometheusMetrics = new PrometheusMetrics();

module.exports = {
  PrometheusMetrics,
  prometheusMetrics
}; 