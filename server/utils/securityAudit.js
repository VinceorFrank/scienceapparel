/**
 * Security Audit Utility
 * Comprehensive security monitoring, logging, and reporting
 */

const logger = require('./logger');
const { sendEmail } = require('./mailer');

class SecurityAudit {
  constructor() {
    this.securityEvents = [];
    this.vulnerabilityReports = [];
    this.blockedIPs = new Set();
    this.suspiciousActivities = new Map();
    this.lastReportTime = Date.now();
    this.reportInterval = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Log security event
   */
  logSecurityEvent(event) {
    const securityEvent = {
      timestamp: new Date(),
      type: event.type,
      severity: event.severity || 'medium',
      description: event.description,
      ip: event.ip,
      userAgent: event.userAgent,
      userId: event.userId,
      endpoint: event.endpoint,
      method: event.method,
      payload: event.payload,
      metadata: event.metadata || {}
    };

    this.securityEvents.push(securityEvent);

    // Log to file
    logger.warn('Security event detected', securityEvent);

    // Check for immediate threats
    this.checkImmediateThreats(securityEvent);

    // Generate report if needed
    this.checkReportGeneration();
  }

  /**
   * Log authentication attempt
   */
  logAuthAttempt(attempt) {
    const authEvent = {
      timestamp: new Date(),
      type: 'authentication_attempt',
      severity: attempt.success ? 'low' : 'medium',
      description: `${attempt.success ? 'Successful' : 'Failed'} authentication attempt`,
      ip: attempt.ip,
      userAgent: attempt.userAgent,
      userId: attempt.userId,
      email: attempt.email,
      success: attempt.success,
      reason: attempt.reason,
      metadata: {
        attemptCount: attempt.attemptCount,
        lockoutDuration: attempt.lockoutDuration
      }
    };

    this.logSecurityEvent(authEvent);
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(activity) {
    const suspiciousEvent = {
      timestamp: new Date(),
      type: 'suspicious_activity',
      severity: 'high',
      description: activity.description,
      ip: activity.ip,
      userAgent: activity.userAgent,
      userId: activity.userId,
      endpoint: activity.endpoint,
      method: activity.method,
      payload: activity.payload,
      metadata: {
        pattern: activity.pattern,
        frequency: activity.frequency,
        threshold: activity.threshold
      }
    };

    this.logSecurityEvent(suspiciousEvent);
    this.trackSuspiciousIP(activity.ip, activity);
  }

  /**
   * Log rate limit violation
   */
  logRateLimitViolation(violation) {
    const rateLimitEvent = {
      timestamp: new Date(),
      type: 'rate_limit_violation',
      severity: 'medium',
      description: `Rate limit exceeded for ${violation.endpoint}`,
      ip: violation.ip,
      userAgent: violation.userAgent,
      userId: violation.userId,
      endpoint: violation.endpoint,
      method: violation.method,
      metadata: {
        limit: violation.limit,
        window: violation.window,
        attempts: violation.attempts,
        retryAfter: violation.retryAfter
      }
    };

    this.logSecurityEvent(rateLimitEvent);
  }

  /**
   * Log input validation failure
   */
  logInputValidationFailure(failure) {
    const validationEvent = {
      timestamp: new Date(),
      type: 'input_validation_failure',
      severity: 'medium',
      description: `Input validation failed: ${failure.reason}`,
      ip: failure.ip,
      userAgent: failure.userAgent,
      userId: failure.userId,
      endpoint: failure.endpoint,
      method: failure.method,
      payload: failure.payload,
      metadata: {
        field: failure.field,
        value: failure.value,
        pattern: failure.pattern,
        sanitized: failure.sanitized
      }
    };

    this.logSecurityEvent(validationEvent);
  }

  /**
   * Log file upload attempt
   */
  logFileUploadAttempt(upload) {
    const uploadEvent = {
      timestamp: new Date(),
      type: 'file_upload_attempt',
      severity: upload.malicious ? 'high' : 'low',
      description: `${upload.malicious ? 'Malicious' : 'Valid'} file upload attempt`,
      ip: upload.ip,
      userAgent: upload.userAgent,
      userId: upload.userId,
      endpoint: upload.endpoint,
      method: upload.method,
      payload: {
        filename: upload.filename,
        mimetype: upload.mimetype,
        size: upload.size
      },
      metadata: {
        malicious: upload.malicious,
        reason: upload.reason,
        allowedTypes: upload.allowedTypes,
        maxSize: upload.maxSize
      }
    };

    this.logSecurityEvent(uploadEvent);
  }

  /**
   * Track suspicious IP addresses
   */
  trackSuspiciousIP(ip, activity) {
    if (!this.suspiciousActivities.has(ip)) {
      this.suspiciousActivities.set(ip, {
        count: 0,
        firstSeen: new Date(),
        lastSeen: new Date(),
        activities: []
      });
    }

    const ipData = this.suspiciousActivities.get(ip);
    ipData.count++;
    ipData.lastSeen = new Date();
    ipData.activities.push(activity);

    // Block IP if too many suspicious activities
    if (ipData.count >= 10) {
      this.blockIP(ip, 'Too many suspicious activities');
    }
  }

  /**
   * Block IP address
   */
  blockIP(ip, reason) {
    if (!this.blockedIPs.has(ip)) {
      this.blockedIPs.add(ip);
      
      const blockEvent = {
        timestamp: new Date(),
        type: 'ip_blocked',
        severity: 'high',
        description: `IP address blocked: ${reason}`,
        ip: ip,
        metadata: {
          reason: reason,
          blockDuration: '24h',
          suspiciousActivities: this.suspiciousActivities.get(ip)?.count || 0
        }
      };

      this.logSecurityEvent(blockEvent);
      logger.error('IP address blocked', blockEvent);
    }
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  /**
   * Check for immediate threats
   */
  checkImmediateThreats(event) {
    const immediateThreats = [
      'sql_injection_attempt',
      'xss_attempt',
      'file_upload_malicious',
      'authentication_brute_force',
      'rate_limit_excessive'
    ];

    if (immediateThreats.includes(event.type) || event.severity === 'critical') {
      this.sendImmediateAlert(event);
    }
  }

  /**
   * Send immediate security alert
   */
  async sendImmediateAlert(event) {
    try {
      const alertSubject = `🚨 SECURITY ALERT: ${event.type.toUpperCase()}`;
      const alertBody = `
        <h2>Security Alert</h2>
        <p><strong>Type:</strong> ${event.type}</p>
        <p><strong>Severity:</strong> ${event.severity}</p>
        <p><strong>Description:</strong> ${event.description}</p>
        <p><strong>IP Address:</strong> ${event.ip}</p>
        <p><strong>Timestamp:</strong> ${event.timestamp}</p>
        <p><strong>Endpoint:</strong> ${event.endpoint}</p>
        <p><strong>Method:</strong> ${event.method}</p>
        ${event.payload ? `<p><strong>Payload:</strong> ${JSON.stringify(event.payload, null, 2)}</p>` : ''}
      `;

      await sendEmail({
        to: process.env.SECURITY_ALERT_EMAIL || 'admin@example.com',
        subject: alertSubject,
        html: alertBody
      });

      logger.info('Security alert sent', { eventType: event.type, ip: event.ip });
    } catch (error) {
      logger.error('Failed to send security alert', { error: error.message, event });
    }
  }

  /**
   * Check if report should be generated
   */
  checkReportGeneration() {
    const now = Date.now();
    if (now - this.lastReportTime >= this.reportInterval) {
      this.generateSecurityReport();
      this.lastReportTime = now;
    }
  }

  /**
   * Generate comprehensive security report
   */
  async generateSecurityReport() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filter events from last 24 hours
    const recentEvents = this.securityEvents.filter(event => 
      event.timestamp >= last24Hours
    );

    // Group events by type
    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});

    // Group events by severity
    const eventsBySeverity = recentEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {});

    // Get top suspicious IPs
    const topSuspiciousIPs = Array.from(this.suspiciousActivities.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    const report = {
      period: '24 hours',
      generatedAt: now,
      summary: {
        totalEvents: recentEvents.length,
        eventsByType,
        eventsBySeverity,
        blockedIPs: this.blockedIPs.size,
        suspiciousIPs: this.suspiciousActivities.size
      },
      details: {
        topSuspiciousIPs: topSuspiciousIPs.map(([ip, data]) => ({
          ip,
          count: data.count,
          firstSeen: data.firstSeen,
          lastSeen: data.lastSeen
        })),
        recentCriticalEvents: recentEvents
          .filter(event => event.severity === 'critical')
          .slice(0, 10)
      }
    };

    // Log report
    logger.info('Security report generated', report);

    // Send report if there are significant events
    if (recentEvents.length > 0 || this.blockedIPs.size > 0) {
      await this.sendSecurityReport(report);
    }

    // Clear old events (keep last 7 days)
    this.cleanupOldEvents();
  }

  /**
   * Send security report via email
   */
  async sendSecurityReport(report) {
    try {
      const reportSubject = `📊 Security Report - ${new Date().toDateString()}`;
      const reportBody = `
        <h2>Security Report</h2>
        <p><strong>Period:</strong> ${report.period}</p>
        <p><strong>Generated:</strong> ${report.generatedAt}</p>
        
        <h3>Summary</h3>
        <ul>
          <li><strong>Total Events:</strong> ${report.summary.totalEvents}</li>
          <li><strong>Blocked IPs:</strong> ${report.summary.blockedIPs}</li>
          <li><strong>Suspicious IPs:</strong> ${report.summary.suspiciousIPs}</li>
        </ul>

        <h3>Events by Type</h3>
        <ul>
          ${Object.entries(report.summary.eventsByType).map(([type, count]) => 
            `<li><strong>${type}:</strong> ${count}</li>`
          ).join('')}
        </ul>

        <h3>Events by Severity</h3>
        <ul>
          ${Object.entries(report.summary.eventsBySeverity).map(([severity, count]) => 
            `<li><strong>${severity}:</strong> ${count}</li>`
          ).join('')}
        </ul>

        ${report.details.topSuspiciousIPs.length > 0 ? `
          <h3>Top Suspicious IPs</h3>
          <ul>
            ${report.details.topSuspiciousIPs.map(ip => 
              `<li><strong>${ip.ip}:</strong> ${ip.count} activities</li>`
            ).join('')}
          </ul>
        ` : ''}
      `;

      await sendEmail({
        to: process.env.SECURITY_REPORT_EMAIL || 'admin@example.com',
        subject: reportSubject,
        html: reportBody
      });

      logger.info('Security report sent');
    } catch (error) {
      logger.error('Failed to send security report', { error: error.message });
    }
  }

  /**
   * Cleanup old events
   */
  cleanupOldEvents() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.securityEvents = this.securityEvents.filter(event => 
      event.timestamp >= oneWeekAgo
    );

    // Cleanup old suspicious activities
    for (const [ip, data] of this.suspiciousActivities.entries()) {
      if (data.lastSeen < oneWeekAgo) {
        this.suspiciousActivities.delete(ip);
      }
    }
  }

  /**
   * Get security statistics
   */
  getSecurityStats() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const events24h = this.securityEvents.filter(event => event.timestamp >= last24Hours);
    const events7d = this.securityEvents.filter(event => event.timestamp >= last7Days);

    return {
      last24Hours: {
        totalEvents: events24h.length,
        criticalEvents: events24h.filter(e => e.severity === 'critical').length,
        blockedIPs: this.blockedIPs.size,
        suspiciousIPs: this.suspiciousActivities.size
      },
      last7Days: {
        totalEvents: events7d.length,
        criticalEvents: events7d.filter(e => e.severity === 'critical').length
      },
      blockedIPs: Array.from(this.blockedIPs),
      topSuspiciousIPs: Array.from(this.suspiciousActivities.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([ip, data]) => ({ ip, count: data.count }))
    };
  }
}

// Create singleton instance
const securityAudit = new SecurityAudit();

module.exports = securityAudit; 