/**
 * Security Monitoring Routes
 * Provides security statistics and audit information for admin users
 */

const express = require('express');
const router = express.Router();
const { requireAuth: protect, admin } = require('../middlewares/auth');
const securityAudit = require('../utils/securityAudit');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { validatePagination, validateDateRange } = require('../middlewares/security/requestValidation');

// GET /api/security/stats - Get security statistics
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const stats = securityAudit.getSecurityStats();
    
    sendSuccess(res, 200, 'Security statistics retrieved successfully', stats);
  } catch (err) {
    sendError(res, 500, 'Failed to retrieve security statistics', err);
  }
});

// GET /api/security/events - Get security events with filtering
router.get('/events', protect, admin, validatePagination, validateDateRange, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, severity, startDate, endDate } = req.query;
    
    let events = securityAudit.securityEvents;

    // Filter by type
    if (type) {
      events = events.filter(event => event.type === type);
    }

    // Filter by severity
    if (severity) {
      events = events.filter(event => event.severity === severity);
    }

    // Filter by date range
    if (startDate || endDate) {
      events = events.filter(event => {
        const eventDate = new Date(event.timestamp);
        if (startDate && eventDate < new Date(startDate)) return false;
        if (endDate && eventDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedEvents = events.slice(skip, skip + parseInt(limit));

    sendSuccess(res, 200, 'Security events retrieved successfully', {
      events: paginatedEvents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: events.length,
        pages: Math.ceil(events.length / parseInt(limit))
      }
    });
  } catch (err) {
    sendError(res, 500, 'Failed to retrieve security events', err);
  }
});

// GET /api/security/blocked-ips - Get blocked IP addresses
router.get('/blocked-ips', protect, admin, async (req, res) => {
  try {
    const blockedIPs = Array.from(securityAudit.blockedIPs);
    
    sendSuccess(res, 200, 'Blocked IPs retrieved successfully', {
      blockedIPs,
      count: blockedIPs.length
    });
  } catch (err) {
    sendError(res, 500, 'Failed to retrieve blocked IPs', err);
  }
});

// POST /api/security/unblock-ip/:ip - Unblock an IP address
router.post('/unblock-ip/:ip', protect, admin, async (req, res) => {
  try {
    const { ip } = req.params;
    
    if (securityAudit.blockedIPs.has(ip)) {
      securityAudit.blockedIPs.delete(ip);
      
      // Log the unblock action
      securityAudit.logSecurityEvent({
        type: 'ip_unblocked',
        severity: 'medium',
        description: `IP address unblocked by admin`,
        ip: ip,
        userId: req.user._id,
        endpoint: req.originalUrl,
        method: req.method
      });

      sendSuccess(res, 200, 'IP address unblocked successfully', { ip });
    } else {
      sendError(res, 404, 'IP address not found in blocked list', null, 'IP_NOT_BLOCKED');
    }
  } catch (err) {
    sendError(res, 500, 'Failed to unblock IP address', err);
  }
});

// GET /api/security/suspicious-ips - Get suspicious IP addresses
router.get('/suspicious-ips', protect, admin, async (req, res) => {
  try {
    const suspiciousIPs = Array.from(securityAudit.suspiciousActivities.entries())
      .map(([ip, data]) => ({
        ip,
        count: data.count,
        firstSeen: data.firstSeen,
        lastSeen: data.lastSeen,
        activities: data.activities.length
      }))
      .sort((a, b) => b.count - a.count);

    sendSuccess(res, 200, 'Suspicious IPs retrieved successfully', {
      suspiciousIPs,
      count: suspiciousIPs.length
    });
  } catch (err) {
    sendError(res, 500, 'Failed to retrieve suspicious IPs', err);
  }
});

// POST /api/security/block-ip/:ip - Manually block an IP address
router.post('/block-ip/:ip', protect, admin, async (req, res) => {
  try {
    const { ip } = req.params;
    const { reason = 'Manually blocked by admin' } = req.body;
    
    securityAudit.blockIP(ip, reason);

    sendSuccess(res, 200, 'IP address blocked successfully', { 
      ip, 
      reason,
      blockedAt: new Date()
    });
  } catch (err) {
    sendError(res, 500, 'Failed to block IP address', err);
  }
});

// GET /api/security/report - Generate security report
router.get('/report', protect, admin, async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    // Generate custom report based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const events = securityAudit.securityEvents.filter(event => 
      event.timestamp >= startDate
    );

    // Group events by type
    const eventsByType = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});

    // Group events by severity
    const eventsBySeverity = events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {});

    // Get top IPs by activity
    const ipActivity = {};
    events.forEach(event => {
      if (event.ip) {
        ipActivity[event.ip] = (ipActivity[event.ip] || 0) + 1;
      }
    });

    const topIPs = Object.entries(ipActivity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    const report = {
      period,
      generatedAt: now,
      startDate,
      endDate: now,
      summary: {
        totalEvents: events.length,
        eventsByType,
        eventsBySeverity,
        blockedIPs: securityAudit.blockedIPs.size,
        suspiciousIPs: securityAudit.suspiciousActivities.size
      },
      details: {
        topIPs,
        criticalEvents: events.filter(e => e.severity === 'critical').length,
        highSeverityEvents: events.filter(e => e.severity === 'high').length
      }
    };

    sendSuccess(res, 200, 'Security report generated successfully', report);
  } catch (err) {
    sendError(res, 500, 'Failed to generate security report', err);
  }
});

// POST /api/security/clear-events - Clear old security events
router.post('/clear-events', protect, admin, async (req, res) => {
  try {
    const { days = 7 } = req.body;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const initialCount = securityAudit.securityEvents.length;
    securityAudit.securityEvents = securityAudit.securityEvents.filter(event => 
      event.timestamp >= cutoffDate
    );
    const finalCount = securityAudit.securityEvents.length;
    const clearedCount = initialCount - finalCount;

    // Log the cleanup action
    securityAudit.logSecurityEvent({
      type: 'security_events_cleared',
      severity: 'low',
      description: `Security events cleared by admin (${clearedCount} events removed)`,
      userId: req.user._id,
      endpoint: req.originalUrl,
      method: req.method,
      metadata: {
        days,
        cutoffDate,
        clearedCount
      }
    });

    sendSuccess(res, 200, 'Security events cleared successfully', {
      clearedCount,
      remainingCount: finalCount,
      cutoffDate
    });
  } catch (err) {
    sendError(res, 500, 'Failed to clear security events', err);
  }
});

module.exports = router; 