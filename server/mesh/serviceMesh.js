/**
 * Service Mesh - Service-to-service communication and traffic management
 * Handles inter-service communication, load balancing, and observability
 */

const { EventEmitter } = require('events');
const { logger } = require('../utils/logger');
const { auditLog, AUDIT_EVENTS } = require('../utils/auditLogger');
const { cacheManager } = require('../utils/advancedCache');
const { messageQueue } = require('../utils/messageQueue');

class ServiceMesh extends EventEmitter {
  constructor() {
    super();
    this.services = new Map();
    this.routes = new Map();
    this.policies = new Map();
    this.metrics = new Map();
    this.circuitBreakers = new Map();
    this.loadBalancers = new Map();
    this.isRunning = false;
  }

  /**
   * Register a service
   */
  registerService(serviceName, serviceConfig) {
    const service = {
      name: serviceName,
      instances: serviceConfig.instances || [],
      healthCheck: serviceConfig.healthCheck,
      loadBalancer: serviceConfig.loadBalancer || 'round-robin',
      circuitBreaker: serviceConfig.circuitBreaker || { failureThreshold: 5, timeout: 60000 },
      retryPolicy: serviceConfig.retryPolicy || { maxRetries: 3, backoff: 1000 },
      timeout: serviceConfig.timeout || 30000,
      ...serviceConfig
    };

    this.services.set(serviceName, service);
    
    // Initialize load balancer
    this.loadBalancers.set(serviceName, this.createLoadBalancer(service.loadBalancer));
    
    // Initialize circuit breaker
    this.circuitBreakers.set(serviceName, this.createCircuitBreaker(service.circuitBreaker));
    
    // Initialize metrics
    this.metrics.set(serviceName, {
      requests: 0,
      errors: 0,
      latency: [],
      lastRequest: null
    });

    logger.info(`Service registered: ${serviceName}`, { instances: service.instances.length });
    this.emit('service:registered', service);
  }

  /**
   * Create load balancer
   */
  createLoadBalancer(type) {
    switch (type) {
      case 'round-robin':
        return {
          type: 'round-robin',
          currentIndex: 0,
          getNext: function(instances) {
            if (instances.length === 0) return null;
            const instance = instances[this.currentIndex];
            this.currentIndex = (this.currentIndex + 1) % instances.length;
            return instance;
          }
        };

      case 'least-connections':
        return {
          type: 'least-connections',
          connections: new Map(),
          getNext: function(instances) {
            if (instances.length === 0) return null;
            
            let minConnections = Infinity;
            let selectedInstance = null;
            
            for (const instance of instances) {
              const connections = this.connections.get(instance.id) || 0;
              if (connections < minConnections) {
                minConnections = connections;
                selectedInstance = instance;
              }
            }
            
            return selectedInstance;
          },
          incrementConnections: function(instanceId) {
            const current = this.connections.get(instanceId) || 0;
            this.connections.set(instanceId, current + 1);
          },
          decrementConnections: function(instanceId) {
            const current = this.connections.get(instanceId) || 0;
            this.connections.set(instanceId, Math.max(0, current - 1));
          }
        };

      case 'weighted':
        return {
          type: 'weighted',
          getNext: function(instances) {
            if (instances.length === 0) return null;
            
            const totalWeight = instances.reduce((sum, instance) => sum + (instance.weight || 1), 0);
            let random = Math.random() * totalWeight;
            
            for (const instance of instances) {
              random -= (instance.weight || 1);
              if (random <= 0) {
                return instance;
              }
            }
            
            return instances[0];
          }
        };

      default:
        return this.createLoadBalancer('round-robin');
    }
  }

  /**
   * Create circuit breaker
   */
  createCircuitBreaker(config) {
    return {
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failureCount: 0,
      lastFailureTime: 0,
      successCount: 0,
      failureThreshold: config.failureThreshold,
      timeout: config.timeout,
      
      canExecute: function() {
        const now = Date.now();
        
        if (this.state === 'OPEN') {
          if (now - this.lastFailureTime > this.timeout) {
            this.state = 'HALF_OPEN';
            return true;
          }
          return false;
        }
        
        return true;
      },
      
      onSuccess: function() {
        this.failureCount = 0;
        this.successCount++;
        
        if (this.state === 'HALF_OPEN') {
          this.state = 'CLOSED';
        }
      },
      
      onFailure: function() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        this.successCount = 0;
        
        if (this.failureCount >= this.failureThreshold) {
          this.state = 'OPEN';
        }
      }
    };
  }

  /**
   * Call service
   */
  async callService(serviceName, method, data = {}, options = {}) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const circuitBreaker = this.circuitBreakers.get(serviceName);
    const loadBalancer = this.loadBalancers.get(serviceName);
    const metrics = this.metrics.get(serviceName);

    // Check circuit breaker
    if (!circuitBreaker.canExecute()) {
      throw new Error(`Service ${serviceName} is temporarily unavailable`);
    }

    // Get healthy instances
    const healthyInstances = await this.getHealthyInstances(serviceName);
    if (healthyInstances.length === 0) {
      throw new Error(`No healthy instances available for service ${serviceName}`);
    }

    // Select instance using load balancer
    const instance = loadBalancer.getNext(healthyInstances);
    if (!instance) {
      throw new Error(`No available instances for service ${serviceName}`);
    }

    // Update metrics
    metrics.requests++;
    metrics.lastRequest = Date.now();

    const startTime = Date.now();
    let success = false;

    try {
      // Increment connections for least-connections load balancer
      if (loadBalancer.type === 'least-connections') {
        loadBalancer.incrementConnections(instance.id);
      }

      // Make service call
      const result = await this.makeServiceCall(instance, method, data, options);
      
      // Update circuit breaker
      circuitBreaker.onSuccess();
      
      // Update metrics
      const latency = Date.now() - startTime;
      metrics.latency.push(latency);
      if (metrics.latency.length > 100) {
        metrics.latency.shift();
      }
      
      success = true;
      
      // Decrement connections for least-connections load balancer
      if (loadBalancer.type === 'least-connections') {
        loadBalancer.decrementConnections(instance.id);
      }

      // Audit log
      await auditLog(AUDIT_EVENTS.SERVICE_CALL, {
        action: 'service_call',
        serviceName,
        method,
        instanceId: instance.id,
        latency,
        success: true
      }, null, {
        serviceName,
        method,
        instanceId: instance.id,
        latency
      });

      return result;
    } catch (error) {
      // Update circuit breaker
      circuitBreaker.onFailure();
      
      // Update metrics
      metrics.errors++;
      
      // Decrement connections for least-connections load balancer
      if (loadBalancer.type === 'least-connections') {
        loadBalancer.decrementConnections(instance.id);
      }

      // Audit log
      await auditLog(AUDIT_EVENTS.SERVICE_ERROR, {
        action: 'service_call_failed',
        serviceName,
        method,
        instanceId: instance.id,
        error: error.message
      }, null, {
        serviceName,
        method,
        instanceId: instance.id,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Make service call
   */
  async makeServiceCall(instance, method, data, options) {
    const { timeout = 30000, retries = 3 } = options;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Simulate service call (replace with actual HTTP call)
        const response = await this.simulateServiceCall(instance, method, data);
        return response;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  /**
   * Simulate service call (replace with actual implementation)
   */
  async simulateServiceCall(instance, method, data) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Service temporarily unavailable');
    }
    
    return {
      success: true,
      data,
      method,
      instanceId: instance.id,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get healthy instances
   */
  async getHealthyInstances(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      return [];
    }

    const healthyInstances = [];

    for (const instance of service.instances) {
      try {
        const isHealthy = await this.checkInstanceHealth(instance);
        if (isHealthy) {
          healthyInstances.push(instance);
        }
      } catch (error) {
        logger.warn(`Instance health check failed: ${instance.id}`, error);
      }
    }

    return healthyInstances;
  }

  /**
   * Check instance health
   */
  async checkInstanceHealth(instance) {
    try {
      // Simulate health check (replace with actual HTTP call)
      const response = await this.simulateHealthCheck(instance);
      return response.healthy;
    } catch (error) {
      logger.error(`Health check failed for instance ${instance.id}:`, error);
      return false;
    }
  }

  /**
   * Simulate health check
   */
  async simulateHealthCheck(instance) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
    
    // Simulate occasional health check failures
    if (Math.random() < 0.05) {
      throw new Error('Health check failed');
    }
    
    return {
      healthy: true,
      instanceId: instance.id,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Add routing policy
   */
  addRoutingPolicy(serviceName, policy) {
    const policies = this.policies.get(serviceName) || [];
    policies.push(policy);
    this.policies.set(serviceName, policies);
    
    logger.info(`Routing policy added for service: ${serviceName}`);
  }

  /**
   * Add traffic splitting
   */
  addTrafficSplitting(serviceName, splits) {
    const policy = {
      type: 'traffic-splitting',
      splits: splits.map(split => ({
        version: split.version,
        weight: split.weight,
        instances: split.instances || []
      }))
    };
    
    this.addRoutingPolicy(serviceName, policy);
  }

  /**
   * Add retry policy
   */
  addRetryPolicy(serviceName, policy) {
    const retryPolicy = {
      type: 'retry',
      maxRetries: policy.maxRetries || 3,
      backoff: policy.backoff || 1000,
      retryOn: policy.retryOn || ['5xx', 'timeout']
    };
    
    this.addRoutingPolicy(serviceName, retryPolicy);
  }

  /**
   * Add timeout policy
   */
  addTimeoutPolicy(serviceName, timeout) {
    const policy = {
      type: 'timeout',
      timeout: timeout
    };
    
    this.addRoutingPolicy(serviceName, policy);
  }

  /**
   * Get service metrics
   */
  getServiceMetrics(serviceName) {
    const metrics = this.metrics.get(serviceName);
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    
    if (!metrics) {
      return null;
    }

    const avgLatency = metrics.latency.length > 0 
      ? metrics.latency.reduce((sum, lat) => sum + lat, 0) / metrics.latency.length 
      : 0;

    const errorRate = metrics.requests > 0 
      ? (metrics.errors / metrics.requests * 100).toFixed(2) 
      : 0;

    return {
      serviceName,
      requests: metrics.requests,
      errors: metrics.errors,
      errorRate: `${errorRate}%`,
      avgLatency: `${avgLatency.toFixed(2)}ms`,
      circuitBreakerState: circuitBreaker?.state || 'UNKNOWN',
      lastRequest: metrics.lastRequest,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    const allMetrics = {};
    
    for (const [serviceName, metrics] of this.metrics.entries()) {
      allMetrics[serviceName] = this.getServiceMetrics(serviceName);
    }
    
    return allMetrics;
  }

  /**
   * Get service mesh status
   */
  getMeshStatus() {
    const status = {
      isRunning: this.isRunning,
      services: this.services.size,
      routes: this.routes.size,
      policies: this.policies.size,
      circuitBreakers: {},
      loadBalancers: {},
      timestamp: new Date().toISOString()
    };

    // Add circuit breaker states
    for (const [serviceName, circuitBreaker] of this.circuitBreakers.entries()) {
      status.circuitBreakers[serviceName] = {
        state: circuitBreaker.state,
        failureCount: circuitBreaker.failureCount,
        successCount: circuitBreaker.successCount
      };
    }

    // Add load balancer states
    for (const [serviceName, loadBalancer] of this.loadBalancers.entries()) {
      status.loadBalancers[serviceName] = {
        type: loadBalancer.type,
        connections: loadBalancer.type === 'least-connections' ? loadBalancer.connections.size : null
      };
    }

    return status;
  }

  /**
   * Start service mesh
   */
  start() {
    this.isRunning = true;
    logger.info('Service mesh started');
    this.emit('mesh:started');
  }

  /**
   * Stop service mesh
   */
  stop() {
    this.isRunning = false;
    logger.info('Service mesh stopped');
    this.emit('mesh:stopped');
  }
}

// Create singleton instance
const serviceMesh = new ServiceMesh();

module.exports = {
  ServiceMesh,
  serviceMesh
}; 