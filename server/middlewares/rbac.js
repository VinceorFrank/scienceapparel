/**
 * Enhanced Role-Based Access Control (RBAC) System
 * Provides comprehensive role management with detailed permissions and audit logging
 */

const { sendForbidden, sendUnauthorized } = require('../utils/responseHandler');
const { logger } = require('../utils/logger');
const ActivityLog = require('../models/ActivityLog');

// Define role hierarchy and permissions
const ROLES = {
  CUSTOMER: 'customer',
  SUPPORT_AGENT: 'support_agent',
  ORDER_MANAGER: 'order_manager',
  PRODUCT_MANAGER: 'product_manager',
  ADMIN: 'admin'
};

// Define permission levels
const PERMISSIONS = {
  // Customer permissions
  VIEW_OWN_PROFILE: 'view_own_profile',
  UPDATE_OWN_PROFILE: 'update_own_profile',
  VIEW_OWN_ORDERS: 'view_own_orders',
  CREATE_OWN_ORDER: 'create_own_order',
  VIEW_OWN_ADDRESSES: 'view_own_addresses',
  MANAGE_OWN_ADDRESSES: 'manage_own_addresses',
  
  // Support agent permissions
  VIEW_CUSTOMER_PROFILES: 'view_customer_profiles',
  UPDATE_CUSTOMER_PROFILES: 'update_customer_profiles',
  VIEW_CUSTOMER_ORDERS: 'view_customer_orders',
  UPDATE_ORDER_STATUS: 'update_order_status',
  VIEW_SUPPORT_TICKETS: 'view_support_tickets',
  MANAGE_SUPPORT_TICKETS: 'manage_support_tickets',
  
  // Order manager permissions
  VIEW_ALL_ORDERS: 'view_all_orders',
  UPDATE_ALL_ORDERS: 'update_all_orders',
  MANAGE_SHIPPING: 'manage_shipping',
  VIEW_ORDER_ANALYTICS: 'view_order_analytics',
  
  // Product manager permissions
  VIEW_PRODUCTS: 'view_products',
  CREATE_PRODUCTS: 'create_products',
  UPDATE_PRODUCTS: 'update_products',
  DELETE_PRODUCTS: 'delete_products',
  MANAGE_CATEGORIES: 'manage_categories',
  VIEW_PRODUCT_ANALYTICS: 'view_product_analytics',
  
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  VIEW_SYSTEM_LOGS: 'view_system_logs',
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SECURITY: 'manage_security'
};

// Define base permissions for each role
const CUSTOMER_PERMISSIONS = [
  PERMISSIONS.VIEW_OWN_PROFILE,
  PERMISSIONS.UPDATE_OWN_PROFILE,
  PERMISSIONS.VIEW_OWN_ORDERS,
  PERMISSIONS.CREATE_OWN_ORDER,
  PERMISSIONS.VIEW_OWN_ADDRESSES,
  PERMISSIONS.MANAGE_OWN_ADDRESSES
];

const SUPPORT_AGENT_PERMISSIONS = [
  ...CUSTOMER_PERMISSIONS,
  PERMISSIONS.VIEW_CUSTOMER_PROFILES,
  PERMISSIONS.UPDATE_CUSTOMER_PROFILES,
  PERMISSIONS.VIEW_CUSTOMER_ORDERS,
  PERMISSIONS.UPDATE_ORDER_STATUS,
  PERMISSIONS.VIEW_SUPPORT_TICKETS,
  PERMISSIONS.MANAGE_SUPPORT_TICKETS
];

const ORDER_MANAGER_PERMISSIONS = [
  ...SUPPORT_AGENT_PERMISSIONS,
  PERMISSIONS.VIEW_ALL_ORDERS,
  PERMISSIONS.UPDATE_ALL_ORDERS,
  PERMISSIONS.MANAGE_SHIPPING,
  PERMISSIONS.VIEW_ORDER_ANALYTICS
];

const PRODUCT_MANAGER_PERMISSIONS = [
  ...CUSTOMER_PERMISSIONS,
  PERMISSIONS.VIEW_PRODUCTS,
  PERMISSIONS.CREATE_PRODUCTS,
  PERMISSIONS.UPDATE_PRODUCTS,
  PERMISSIONS.DELETE_PRODUCTS,
  PERMISSIONS.MANAGE_CATEGORIES,
  PERMISSIONS.VIEW_PRODUCT_ANALYTICS
];

// Define role permissions mapping
const ROLE_PERMISSIONS = {
  [ROLES.CUSTOMER]: CUSTOMER_PERMISSIONS,
  [ROLES.SUPPORT_AGENT]: SUPPORT_AGENT_PERMISSIONS,
  [ROLES.ORDER_MANAGER]: ORDER_MANAGER_PERMISSIONS,
  [ROLES.PRODUCT_MANAGER]: PRODUCT_MANAGER_PERMISSIONS,
  [ROLES.ADMIN]: Object.values(PERMISSIONS) // Admin has all permissions
};

/**
 * Check if user has specific permission
 * @param {Object} user - User object
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
const hasPermission = (user, permission) => {
  if (!user || !user.role) {
    return false;
  }
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object
 * @param {Array} permissions - Array of permissions to check
 * @returns {boolean} True if user has at least one permission
 */
const hasAnyPermission = (user, permissions) => {
  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * Check if user has all of the specified permissions
 * @param {Object} user - User object
 * @param {Array} permissions - Array of permissions to check
 * @returns {boolean} True if user has all permissions
 */
const hasAllPermissions = (user, permissions) => {
  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Check if user has a specific role
 * @param {Object} user - User object
 * @param {string} role - Role to check
 * @returns {boolean} True if user has role
 */
const hasRole = (user, role) => {
  return user && user.role === role;
};

/**
 * Check if user has any of the specified roles
 * @param {Object} user - User object
 * @param {Array} roles - Array of roles to check
 * @returns {boolean} True if user has at least one role
 */
const hasAnyRole = (user, roles) => {
  return user && roles.includes(user.role);
};

/**
 * Check if user is admin
 * @param {Object} user - User object
 * @returns {boolean} True if user is admin
 */
const isAdmin = (user) => {
  return hasRole(user, ROLES.ADMIN);
};

/**
 * Check if user can access resource (ownership check)
 * @param {Object} user - User object
 * @param {Object} resource - Resource object
 * @param {string} resourceUserIdField - Field name containing user ID
 * @returns {boolean} True if user can access resource
 */
const canAccessResource = (user, resource, resourceUserIdField = 'user') => {
  // Admin can access all resources
  if (isAdmin(user)) {
    return true;
  }
  
  // Check if resource belongs to user
  const resourceUserId = resource[resourceUserIdField];
  return resourceUserId && resourceUserId.toString() === user._id.toString();
};

/**
 * Enhanced permission middleware with audit logging
 * @param {string|Array} permission - Permission(s) required
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 */
const requirePermission = (permission, options = {}) => {
  const { 
    resourceType = null, 
    resourceIdField = 'id',
    logAccess = true,
    allowOwnership = true 
  } = options;
  
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        logger.warn('Permission check failed - no user', {
          path: req.path,
          method: req.method,
          ip: req.ip,
          permission
        });
        return sendUnauthorized(res, 'Authentication required');
      }
      
      // Convert single permission to array
      const permissions = Array.isArray(permission) ? permission : [permission];
      
      // Check if user has required permission(s)
      const hasRequiredPermission = permissions.length === 1 
        ? hasPermission(req.user, permissions[0])
        : hasAnyPermission(req.user, permissions);
      
      if (!hasRequiredPermission) {
        // Log unauthorized access attempt
        logger.warn('Permission denied', {
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          path: req.path,
          method: req.method,
          requiredPermissions: permissions,
          ip: req.ip
        });
        
        return sendForbidden(res, 'Insufficient permissions');
      }
      
      // Check resource ownership if specified
      if (resourceType && allowOwnership) {
        const resourceId = req.params[resourceIdField] || req.body[resourceIdField];
        
        if (resourceId) {
          try {
            const ResourceModel = require(`../models/${resourceType}`);
            const resource = await ResourceModel.findById(resourceId);
            
            if (resource && !canAccessResource(req.user, resource)) {
              logger.warn('Resource access denied', {
                userId: req.user._id,
                userEmail: req.user.email,
                userRole: req.user.role,
                resourceId,
                resourceType,
                path: req.path,
                method: req.method,
                ip: req.ip
              });
              
              return sendForbidden(res, 'Access to this resource is denied');
            }
          } catch (error) {
            logger.error('Error checking resource access', {
              error: error.message,
              resourceId,
              resourceType,
              userId: req.user._id
            });
          }
        }
      }
      
      // Log successful access if enabled
      if (logAccess) {
        try {
          await ActivityLog.create({
            user: req.user._id,
            action: 'permission_check',
            description: `Access granted to ${req.path}`,
            details: {
              method: req.method,
              permissions,
              resourceType,
              ip: req.ip
            }
          });
        } catch (error) {
          logger.error('Failed to log permission access', { error: error.message });
        }
      }
      
      next();
    } catch (error) {
      logger.error('Permission middleware error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?._id,
        path: req.path
      });
      
      return sendForbidden(res, 'Access control error');
    }
  };
};

/**
 * Role-based middleware
 * @param {string|Array} role - Role(s) required
 * @returns {Function} Express middleware
 */
const requireRole = (role) => {
  const roles = Array.isArray(role) ? role : [role];
  
  return (req, res, next) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }
    
    if (!hasAnyRole(req.user, roles)) {
      logger.warn('Role access denied', {
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      
      return sendForbidden(res, 'Insufficient role permissions');
    }
    
    next();
  };
};

/**
 * Admin-only middleware
 * @returns {Function} Express middleware
 */
const requireAdmin = (req, res, next) => {
  return requireRole(ROLES.ADMIN)(req, res, next);
};

/**
 * Ownership middleware for user resources
 * @param {string} resourceUserIdField - Field name containing user ID
 * @returns {Function} Express middleware
 */
const requireOwnership = (resourceUserIdField = 'user') => {
  return async (req, res, next) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }
    
    // Admin can access all resources
    if (isAdmin(req.user)) {
      return next();
    }
    
    const resourceId = req.params.id || req.params.resourceId;
    
    if (!resourceId) {
      return sendForbidden(res, 'Resource ID required');
    }
    
    try {
      // Try to find the resource in the request body or params
      const resource = req.body || req.params;
      
      if (resource[resourceUserIdField]) {
        const resourceUserId = resource[resourceUserIdField].toString();
        const userId = req.user._id.toString();
        
        if (resourceUserId !== userId) {
          logger.warn('Ownership check failed', {
            userId: req.user._id,
            userEmail: req.user.email,
            resourceUserId,
            resourceId,
            path: req.path,
            method: req.method,
            ip: req.ip
          });
          
          return sendForbidden(res, 'Access to this resource is denied');
        }
      }
      
      next();
    } catch (error) {
      logger.error('Ownership check error', {
        error: error.message,
        userId: req.user._id,
        resourceId,
        path: req.path
      });
      
      return sendForbidden(res, 'Resource access error');
    }
  };
};

/**
 * Enhanced customer-only middleware
 * @returns {Function} Express middleware
 */
const requireCustomer = (req, res, next) => {
  return requireRole(ROLES.CUSTOMER)(req, res, next);
};

/**
 * Get user permissions for debugging
 * @param {Object} user - User object
 * @returns {Array} Array of user permissions
 */
const getUserPermissions = (user) => {
  if (!user || !user.role) {
    return [];
  }
  
  return ROLE_PERMISSIONS[user.role] || [];
};

/**
 * Get all available permissions
 * @returns {Array} Array of all permissions
 */
const getAllPermissions = () => {
  return Object.values(PERMISSIONS);
};

/**
 * Get all available roles
 * @returns {Array} Array of all roles
 */
const getAllRoles = () => {
  return Object.values(ROLES);
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  isAdmin,
  canAccessResource,
  requirePermission,
  requireRole,
  requireAdmin,
  requireOwnership,
  requireCustomer,
  getUserPermissions,
  getAllPermissions,
  getAllRoles
}; 