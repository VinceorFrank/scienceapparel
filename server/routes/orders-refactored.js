/**
 * Refactored Orders Routes
 * Uses controller pattern for better separation of concerns
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const { requirePermission, requireRole } = require('../middlewares/rbac');
const { PERMISSIONS, ROLES } = require('../middlewares/rbac');
const {
  validateObjectId,
  validateNumber,
  validateString,
  validateArray,
  handleValidationResult
} = require('../middlewares/validators/unifiedValidators');
const {
  sendSuccess,
  sendError,
  sendPaginated,
  sendCreated,
  sendUpdated,
  sendDeleted,
  sendNotFound,
  sendConflict,
  sendForbidden
} = require('../utils/responseHandler');
const {
  createOrder,
  getOrders,
  getAdminOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  addReview,
  getOrderStats
} = require('../controllers/orderController');

// ========================================
// 📦 ORDER MANAGEMENT ROUTES
// ========================================

/**
 * POST /api/orders - Create new order
 * @access Private (Customer)
 */
router.post('/', 
  requireAuth,
  requirePermission(PERMISSIONS.CREATE_OWN_ORDER),
  [
    validateArray('orderItems', { minLength: 1, maxLength: 50 }),
    validateString('paymentMethod', { min: 1, max: 50 }),
    validateNumber('totalPrice', { min: 0, max: 100000 }),
    validateNumber('itemsPrice', { min: 0, max: 100000 }),
    validateNumber('taxPrice', { min: 0, max: 10000 }),
    validateNumber('shippingPrice', { min: 0, max: 1000 }),
    handleValidationResult
  ],
  async (req, res, next) => {
    try {
      const result = await createOrder(req.body, req.user);
      
      return sendCreated(res, 'Order created successfully', result);
    } catch (error) {
      if (error.message === 'No order items provided') {
        return sendError(res, 400, error.message, null, 'NO_ORDER_ITEMS');
      }
      if (error.message === 'Total price mismatch') {
        return sendError(res, 400, error.message, null, 'PRICE_MISMATCH');
      }
      next(error);
    }
  }
);

/**
 * GET /api/orders - Get orders (admin gets all, customer gets their own)
 * @access Private
 */
router.get('/', 
  requireAuth,
  requirePermission([PERMISSIONS.VIEW_OWN_ORDERS, PERMISSIONS.VIEW_ALL_ORDERS]),
  async (req, res, next) => {
    try {
      const orders = await getOrders(req.user);
      return sendSuccess(res, 200, 'Orders retrieved successfully', orders);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/orders/myorders - Get current user's orders
 * @access Private (Customer)
 */
router.get('/myorders', 
  requireAuth,
  requirePermission(PERMISSIONS.VIEW_OWN_ORDERS),
  async (req, res, next) => {
    try {
      const orders = await getOrders(req.user);
      return sendSuccess(res, 200, 'User orders retrieved successfully', orders);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/orders/admin - Get all orders with filtering (admin only)
 * @access Private (Admin)
 */
router.get('/admin', 
  requireAuth,
  requireRole(ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { page, limit, search, status, dateFrom, dateTo, minAmount, maxAmount } = req.query;
      
      const result = await getAdminOrders(
        { search, status, dateFrom, dateTo, minAmount, maxAmount },
        { page: parseInt(page) || 1, limit: parseInt(limit) || 50 }
      );

      return sendPaginated(
        res,
        result.orders,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total,
        'Admin orders retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/orders/:id - Get specific order
 * @access Private (Owner or Admin)
 */
router.get('/:id', 
  requireAuth,
  requirePermission([PERMISSIONS.VIEW_OWN_ORDERS, PERMISSIONS.VIEW_ALL_ORDERS]),
  [
    validateObjectId('id'),
    handleValidationResult
  ],
  async (req, res, next) => {
    try {
      const order = await getOrderById(req.params.id, req.user);
      return sendSuccess(res, 200, 'Order retrieved successfully', order);
    } catch (error) {
      if (error.message === 'Order not found') {
        return sendNotFound(res, 'Order');
      }
      if (error.message === 'Access denied') {
        return sendForbidden(res, 'Access to this order is denied');
      }
      next(error);
    }
  }
);

/**
 * PUT /api/orders/:id - Update order status (admin only)
 * @access Private (Admin)
 */
router.put('/:id', 
  requireAuth,
  requireRole(ROLES.ADMIN),
  [
    validateObjectId('id'),
    validateString('status', { required: false }),
    validateString('trackingNumber', { required: false }),
    validateString('notes', { required: false }),
    handleValidationResult
  ],
  async (req, res, next) => {
    try {
      const order = await updateOrderStatus(req.params.id, req.body, req.user);
      return sendUpdated(res, 'Order status updated successfully', order);
    } catch (error) {
      if (error.message === 'Order not found') {
        return sendNotFound(res, 'Order');
      }
      next(error);
    }
  }
);

/**
 * DELETE /api/orders/:id - Cancel order
 * @access Private (Owner or Admin)
 */
router.delete('/:id', 
  requireAuth,
  requirePermission([PERMISSIONS.CREATE_OWN_ORDER, PERMISSIONS.UPDATE_ALL_ORDERS]),
  [
    validateObjectId('id'),
    validateString('reason', { min: 1, max: 500 }),
    handleValidationResult
  ],
  async (req, res, next) => {
    try {
      const order = await cancelOrder(req.params.id, req.body.reason, req.user);
      return sendDeleted(res, 'Order cancelled successfully', order);
    } catch (error) {
      if (error.message === 'Order not found') {
        return sendNotFound(res, 'Order');
      }
      if (error.message === 'Order is already cancelled') {
        return sendConflict(res, 'Order is already cancelled');
      }
      if (error.message === 'Cannot cancel shipped order') {
        return sendError(res, 400, error.message, null, 'CANNOT_CANCEL_SHIPPED');
      }
      next(error);
    }
  }
);

/**
 * POST /api/orders/:id/review - Add review to order
 * @access Private (Order Owner)
 */
router.post('/:id/review', 
  requireAuth,
  requirePermission(PERMISSIONS.CREATE_OWN_ORDER),
  [
    validateObjectId('id'),
    validateObjectId('productId'),
    validateNumber('rating', { min: 1, max: 5 }),
    validateString('comment', { min: 1, max: 1000 }),
    validateString('reviewToken', { min: 1, max: 100 }),
    handleValidationResult
  ],
  async (req, res, next) => {
    try {
      const order = await addReview(req.params.id, req.body, req.user);
      return sendSuccess(res, 200, 'Review added successfully', order);
    } catch (error) {
      if (error.message === 'Order not found') {
        return sendNotFound(res, 'Order');
      }
      if (error.message === 'Invalid review token') {
        return sendError(res, 400, error.message, null, 'INVALID_REVIEW_TOKEN');
      }
      if (error.message === 'Product not found in order') {
        return sendNotFound(res, 'Product in order');
      }
      if (error.message === 'Product not found') {
        return sendNotFound(res, 'Product');
      }
      next(error);
    }
  }
);

/**
 * GET /api/orders/stats - Get order statistics
 * @access Private
 */
router.get('/stats', 
  requireAuth,
  requirePermission([PERMISSIONS.VIEW_OWN_ORDERS, PERMISSIONS.VIEW_ALL_ORDERS]),
  async (req, res, next) => {
    try {
      const stats = await getOrderStats(req.user);
      return sendSuccess(res, 200, 'Order statistics retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orders/bulk-update - Bulk update orders (admin only)
 * @access Private (Admin)
 */
router.post('/bulk-update', 
  requireAuth,
  requireRole(ROLES.ADMIN),
  [
    validateArray('orderIds', { minLength: 1, maxLength: 100 }),
    validateString('status', { required: false }),
    validateBoolean('isShipped', { required: false }),
    validateBoolean('isPaid', { required: false }),
    validateString('notes', { required: false }),
    handleValidationResult
  ],
  async (req, res, next) => {
    try {
      const { orderIds, ...updateData } = req.body;
      const results = [];

      for (const orderId of orderIds) {
        try {
          const order = await updateOrderStatus(orderId, updateData, req.user);
          results.push({ orderId, success: true, order });
        } catch (error) {
          results.push({ orderId, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      return sendSuccess(res, 200, `Bulk update completed. ${successCount} successful, ${failureCount} failed`, {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router; 