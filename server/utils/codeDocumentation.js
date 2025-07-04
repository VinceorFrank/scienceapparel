/**
 * Code Documentation Utility
 * Provides comprehensive documentation and code quality tools
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

/**
 * Route Documentation Generator
 * Automatically generates documentation for Express routes
 */
class RouteDocumentation {
  constructor() {
    this.routes = [];
    this.endpoints = [];
  }

  /**
   * Add route documentation
   * @param {string} method - HTTP method
   * @param {string} path - Route path
   * @param {string} description - Route description
   * @param {string} access - Access level (Public/Private/Admin)
   * @param {Object} params - Route parameters
   * @param {Object} body - Request body schema
   * @param {Object} responses - Response schemas
   */
  addRoute(method, path, description, access = 'Public', params = {}, body = {}, responses = {}) {
    this.routes.push({
      method: method.toUpperCase(),
      path,
      description,
      access,
      params,
      body,
      responses,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate markdown documentation
   * @returns {string} Markdown documentation
   */
  generateMarkdown() {
    let markdown = '# API Documentation\n\n';
    markdown += '## Overview\n\n';
    markdown += 'This document provides comprehensive documentation for all API endpoints.\n\n';
    markdown += `Generated on: ${new Date().toLocaleString()}\n\n`;

    // Group routes by method
    const groupedRoutes = this.groupRoutesByMethod();
    
    for (const [method, routes] of Object.entries(groupedRoutes)) {
      markdown += `## ${method} Endpoints\n\n`;
      
      routes.forEach(route => {
        markdown += `### ${route.path}\n\n`;
        markdown += `**Description:** ${route.description}\n\n`;
        markdown += `**Access:** ${route.access}\n\n`;
        markdown += `**Method:** ${route.method}\n\n`;
        
        if (Object.keys(route.params).length > 0) {
          markdown += '**Parameters:**\n\n';
          for (const [param, details] of Object.entries(route.params)) {
            markdown += `- \`${param}\`: ${details.description} (${details.type})\n`;
          }
          markdown += '\n';
        }
        
        if (Object.keys(route.body).length > 0) {
          markdown += '**Request Body:**\n\n';
          markdown += '```json\n';
          markdown += JSON.stringify(route.body, null, 2);
          markdown += '\n```\n\n';
        }
        
        if (Object.keys(route.responses).length > 0) {
          markdown += '**Responses:**\n\n';
          for (const [status, response] of Object.entries(route.responses)) {
            markdown += `**${status}:**\n\n`;
            markdown += '```json\n';
            markdown += JSON.stringify(response, null, 2);
            markdown += '\n```\n\n';
          }
        }
        
        markdown += '---\n\n';
      });
    }
    
    return markdown;
  }

  /**
   * Group routes by HTTP method
   * @returns {Object} Grouped routes
   */
  groupRoutesByMethod() {
    const grouped = {};
    this.routes.forEach(route => {
      if (!grouped[route.method]) {
        grouped[route.method] = [];
      }
      grouped[route.method].push(route);
    });
    return grouped;
  }

  /**
   * Save documentation to file
   * @param {string} filepath - Output file path
   */
  saveToFile(filepath) {
    try {
      const markdown = this.generateMarkdown();
      fs.writeFileSync(filepath, markdown, 'utf8');
      logger.info('Route documentation saved', { filepath });
    } catch (error) {
      logger.error('Failed to save route documentation', { error: error.message, filepath });
    }
  }
}

/**
 * Code Quality Analyzer
 * Analyzes code quality and provides recommendations
 */
class CodeQualityAnalyzer {
  constructor() {
    this.issues = [];
    this.metrics = {};
  }

  /**
   * Analyze a JavaScript file
   * @param {string} filepath - File to analyze
   * @returns {Object} Analysis results
   */
  analyzeFile(filepath) {
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      const analysis = {
        filepath,
        lines: content.split('\n').length,
        issues: [],
        metrics: {}
      };

      // Check for console.log statements
      const consoleLogMatches = content.match(/console\.log/g);
      if (consoleLogMatches) {
        analysis.issues.push({
          type: 'debug_code',
          severity: 'warning',
          message: `${consoleLogMatches.length} console.log statements found`,
          recommendation: 'Remove console.log statements for production code'
        });
      }

      // Check for direct res.json calls
      const resJsonMatches = content.match(/res\.json\(/g);
      if (resJsonMatches) {
        analysis.issues.push({
          type: 'inconsistent_response',
          severity: 'error',
          message: `${resJsonMatches.length} direct res.json calls found`,
          recommendation: 'Use standardized response handlers'
        });
      }

      // Check for error handling
      const tryCatchBlocks = content.match(/try\s*{/g);
      const catchBlocks = content.match(/catch\s*\(/g);
      if (tryCatchBlocks && (!catchBlocks || tryCatchBlocks.length !== catchBlocks.length)) {
        analysis.issues.push({
          type: 'error_handling',
          severity: 'error',
          message: 'Unmatched try-catch blocks',
          recommendation: 'Ensure all try blocks have corresponding catch blocks'
        });
      }

      // Calculate complexity metrics
      analysis.metrics = this.calculateMetrics(content);

      this.issues.push(...analysis.issues);
      return analysis;
    } catch (error) {
      logger.error('Failed to analyze file', { filepath, error: error.message });
      return { filepath, error: error.message };
    }
  }

  /**
   * Calculate code complexity metrics
   * @param {string} content - File content
   * @returns {Object} Metrics
   */
  calculateMetrics(content) {
    const lines = content.split('\n');
    const codeLines = lines.filter(line => 
      line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('/*')
    );

    return {
      totalLines: lines.length,
      codeLines: codeLines.length,
      commentLines: lines.length - codeLines.length,
      commentRatio: ((lines.length - codeLines.length) / lines.length * 100).toFixed(2)
    };
  }

  /**
   * Generate quality report
   * @returns {Object} Quality report
   */
  generateReport() {
    const totalIssues = this.issues.length;
    const errorCount = this.issues.filter(issue => issue.severity === 'error').length;
    const warningCount = this.issues.filter(issue => issue.severity === 'warning').length;

    return {
      summary: {
        totalIssues,
        errors: errorCount,
        warnings: warningCount,
        qualityScore: Math.max(0, 100 - (errorCount * 10) - (warningCount * 5))
      },
      issues: this.issues,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate recommendations based on issues
   * @returns {Array} Recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    const debugCodeIssues = this.issues.filter(issue => issue.type === 'debug_code');
    if (debugCodeIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'Remove debug console.log statements',
        impact: 'Improves production readiness and security'
      });
    }

    const responseIssues = this.issues.filter(issue => issue.type === 'inconsistent_response');
    if (responseIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Standardize response handling',
        impact: 'Improves API consistency and maintainability'
      });
    }

    const errorHandlingIssues = this.issues.filter(issue => issue.type === 'error_handling');
    if (errorHandlingIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Fix error handling patterns',
        impact: 'Improves application stability and debugging'
      });
    }

    return recommendations;
  }
}

/**
 * API Endpoint Validator
 * Validates API endpoint consistency and completeness
 */
class EndpointValidator {
  constructor() {
    this.endpoints = [];
    this.validationRules = [
      {
        name: 'authentication',
        check: (endpoint) => {
          if (endpoint.access === 'Private' || endpoint.access === 'Admin') {
            return endpoint.hasAuthMiddleware;
          }
          return true;
        },
        message: 'Private/Admin endpoints must have authentication middleware'
      },
      {
        name: 'validation',
        check: (endpoint) => {
          if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
            return endpoint.hasValidation;
          }
          return true;
        },
        message: 'POST/PUT endpoints should have input validation'
      },
      {
        name: 'error_handling',
        check: (endpoint) => endpoint.hasErrorHandling,
        message: 'All endpoints should have proper error handling'
      }
    ];
  }

  /**
   * Add endpoint for validation
   * @param {Object} endpoint - Endpoint configuration
   */
  addEndpoint(endpoint) {
    this.endpoints.push(endpoint);
  }

  /**
   * Validate all endpoints
   * @returns {Object} Validation results
   */
  validate() {
    const results = {
      total: this.endpoints.length,
      valid: 0,
      invalid: 0,
      issues: []
    };

    this.endpoints.forEach(endpoint => {
      const endpointIssues = [];
      
      this.validationRules.forEach(rule => {
        if (!rule.check(endpoint)) {
          endpointIssues.push({
            rule: rule.name,
            message: rule.message
          });
        }
      });

      if (endpointIssues.length === 0) {
        results.valid++;
      } else {
        results.invalid++;
        results.issues.push({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          issues: endpointIssues
        });
      }
    });

    return results;
  }
}

module.exports = {
  RouteDocumentation,
  CodeQualityAnalyzer,
  EndpointValidator
}; 