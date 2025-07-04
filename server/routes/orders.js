const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const ActivityLog = require('../models/ActivityLog');
const { parsePaginationParams, executePaginatedQuery, createPaginatedResponse } = require('../utils/pagination');
const mongoose = require('mongoose');
const { 
  validateCreateOrder, 
  validateUpdateOrderStatus, 
  validateOrderQueries, 
  validateOrderId 
} = require('../middlewares/validators/orderValidators');
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

// ✅ POST /api/orders - Create new order (requires token)
router.post('/', requireAuth, validateCreateOrder, async (req, res, next) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice
  } = req.body;

  try {
    if (!orderItems || orderItems.length === 0) {
      return sendError(res, 400, 'No order items', null, 'NO_ORDER_ITEMS');
    }

    const order = new Order({
      user: req.user._id, // ✅ secure: taken from token
      orderItems,
      shippingAddress,
      paymentMethod,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    // ✅ Generate secure review token
    order.reviewToken = crypto.randomBytes(32).toString('hex');

    await order.save();

    // ✅ Optional: Build review links for testing
    const reviewLinks = order.orderItems.map((item) => {
      return `http://localhost:5173/review?product=${item.product}&token=${order.reviewToken}`;
    });

    const { logger } = require('../utils/logger');
    logger.info('Review Links Generated', {
      orderId: order._id,
      reviewLinks: reviewLinks
    });

    await ActivityLog.create({ user: req.user._id, action: 'create_order', description: `Created new order ${order._id}` });

    return sendCreated(res, 'Order created successfully', {
      order,
      reviewLinks
    });
  } catch (err) {
    next(err);
  }
});

// ✅ GET /api/orders - Get orders (admin gets all, customer gets their own)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    let orders;
    
    if (req.user.isAdmin) {
      // Admin gets all orders
      orders = await Order.find({})
        .sort({ createdAt: -1 })
        .populate('user', 'name email')
        .populate({ path: 'orderItems.product', select: 'name price image category', populate: { path: 'category', select: 'name' } });
    } else {
      // Customer gets only their orders
      orders = await Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .populate({ path: 'orderItems.product', select: 'name price image category', populate: { path: 'category', select: 'name' } });
    }

    return sendSuccess(res, 200, 'Orders retrieved successfully', orders);
  } catch (err) {
    next(err);
  }
});

// ✅ GET /api/orders/myorders - All orders of current user
router.get('/myorders', requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'orderItems.product', select: 'name price image category', populate: { path: 'category', select: 'name' } });

    return sendSuccess(res, 200, 'User orders retrieved successfully', orders);
  } catch (err) {
    next(err);
  }
});

// ✅ GET /api/orders/admin - Get all orders (admin only)
router.get('/admin', requireAuth, requireAdmin, validateOrderQueries, async (req, res, next) => {
  try {
    const { page, limit, search, status, dateFrom, dateTo, minAmount, maxAmount } = req.query;
    const paginationParams = parsePaginationParams({ page, limit });

    const filters = {};
    
    // Enhanced search functionality
    if (search) {
      const isObjectId = mongoose.Types.ObjectId.isValid(search);
      
      let userIds = [];
      if (!isObjectId) {
        const users = await mongoose.model('User').find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');
        userIds = users.map(user => user._id);
      }
    
      filters.$or = [
        ...(isObjectId ? [{ _id: search }] : []),
        ...(userIds.length > 0 ? [{ user: { $in: userIds } }] : [])
      ];
    
      if (filters.$or.length === 0) {
        filters._id = new mongoose.Types.ObjectId(); 
      }
    }

    // Enhanced status filtering
    if (status && status !== 'all') {
      if (status === 'paid') filters.isPaid = true;
      if (status === 'unpaid') filters.isPaid = false;
      if (status === 'shipped') filters.isShipped = true;
      if (status === 'pending') filters.isShipped = false;
      if (status === 'cancelled') filters.status = 'cancelled';
      if (status === 'refunded') filters.status = 'refunded';
    }

    // Date range filtering
    if (dateFrom || dateTo) {
      filters.createdAt = {};
      if (dateFrom) filters.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filters.createdAt.$lte = new Date(dateTo);
    }

    // Amount range filtering
    if (minAmount || maxAmount) {
      filters.totalPrice = {};
      if (minAmount) filters.totalPrice.$gte = parseFloat(minAmount);
      if (maxAmount) filters.totalPrice.$lte = parseFloat(maxAmount);
    }

    const result = await executePaginatedQuery(Order, filters, paginationParams, {
      populate: { path: 'user', select: 'name email' },
      sort: { createdAt: -1 }
    });

    return sendPaginated(
      res,
      result.data,
      result.page,
      result.limit,
      result.total,
      'Admin orders retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
});

// ✅ GET /api/orders/:id - View specific order if owned by customer
router.get('/:id', requireAuth, validateOrderId, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({ path: 'orderItems.product', select: 'name price image category', populate: { path: 'category', select: 'name' } })
      .populate('user', 'name email');

    if (!order) {
      return sendNotFound(res, 'Order');
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return sendForbidden(res, 'Access denied to this order');
    }

    return sendSuccess(res, 200, 'Order retrieved successfully', order);
  } catch (err) {
    next(err);
  }
});

// ✅ PUT /api/orders/:id/status - Update order status (admin only)
router.put('/:id/status', requireAuth, requireAdmin, validateUpdateOrderStatus, async (req, res, next) => {
  try {
    const { isShipped, isPaid, status, trackingNumber, notes } = req.body;
    
    const order = await Order.findById(req.params.id);

    if (!order) {
      return sendNotFound(res, 'Order');
    }

    // Update order fields
    if (isShipped !== undefined) order.isShipped = isShipped;
    if (isPaid !== undefined) order.isPaid = isPaid;
    if (status) order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (notes) order.adminNotes = notes;

    const updatedOrder = await order.save();

    // Log the activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update_order_status',
      description: `Updated order ${order._id} status: ${status || 'modified'}`
    });

    return sendUpdated(res, 'Order status updated successfully', updatedOrder);
  } catch (err) {
    next(err);
  }
});

// ✅ PUT /api/orders/bulk/status - Bulk update order statuses (admin only)
router.put('/bulk/status', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { orderIds, status, isShipped, isPaid, notes } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return sendError(res, 400, 'Order IDs array is required', null, 'INVALID_ORDER_IDS');
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (isShipped !== undefined) updateData.isShipped = isShipped;
    if (isPaid !== undefined) updateData.isPaid = isPaid;
    if (notes) updateData.adminNotes = notes;

    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      updateData
    );

    // Log the activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'bulk_update_orders',
      description: `Bulk updated ${result.modifiedCount} orders with status: ${status || 'modified'}`
    });

    return sendSuccess(res, 200, `Successfully updated ${result.modifiedCount} orders`, {
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    next(err);
  }
});

// ✅ GET /api/orders/analytics/summary - Get order analytics (admin only)
router.get('/analytics/summary', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '90d':
        dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case '1y':
        dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
        break;
    }

    const analytics = await Order.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          averageOrderValue: { $avg: '$totalPrice' },
          paidOrders: { $sum: { $cond: ['$isPaid', 1, 0] } },
          shippedOrders: { $sum: { $cond: ['$isShipped', 1, 0] } }
        }
      }
    ]);

    const result = analytics[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      paidOrders: 0,
      shippedOrders: 0
    };

    return sendSuccess(res, 200, 'Order analytics retrieved successfully', {
      period,
      analytics: result
    });
  } catch (err) {
    next(err);
  }
});

// ✅ DELETE /api/orders/:id - Cancel/delete order (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return sendNotFound(res, 'Order');
    }

    // Check if order can be cancelled (not shipped or delivered)
    if (order.isShipped) {
      return sendError(res, 400, 'Cannot cancel order that has already been shipped', null, 'ORDER_ALREADY_SHIPPED');
    }

    order.status = 'cancelled';
    await order.save();

    // Log the activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'cancel_order',
      description: `Cancelled order ${order._id}`
    });

    return sendUpdated(res, 'Order cancelled successfully', order);
  } catch (err) {
    next(err);
  }
});

// ========================================
// 🛒 CUSTOMER-SPECIFIC ORDER ROUTES
// ========================================

// GET /api/orders/me - Get current user's orders with pagination
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, dateFrom, dateTo, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const paginationParams = parsePaginationParams({ page, limit });

    const filters = { user: req.user._id };
    
    // Status filtering
    if (status && status !== 'all') {
      if (status === 'paid') filters.isPaid = true;
      else if (status === 'unpaid') filters.isPaid = false;
      else if (status === 'shipped') filters['shipping.status'] = { $in: ['shipped', 'in_transit'] };
      else if (status === 'delivered') filters['shipping.status'] = 'delivered';
      else if (status === 'cancelled') filters.orderStatus = 'cancelled';
      else if (status === 'pending') filters.orderStatus = 'pending';
    }

    // Date range filtering
    if (dateFrom || dateTo) {
      filters.createdAt = {};
      if (dateFrom) filters.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filters.createdAt.$lte = new Date(dateTo);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const result = await executePaginatedQuery(Order, filters, paginationParams, {
      populate: { path: 'orderItems.product', select: 'name price image category' },
      sort: sort
    });

    // Update user stats when they view their orders
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, {
      $set: { 'stats.lastOrderDate': new Date() }
    });

    return sendPaginated(
      res,
      result.data,
      result.page,
      result.limit,
      result.total,
      'User orders retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/me/:id - Get specific order for current user
router.get('/me/:id', requireAuth, async (req, res, next) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    })
    .populate({ 
      path: 'orderItems.product', 
      select: 'name price image category description', 
      populate: { path: 'category', select: 'name' } 
    })
    .populate('user', 'name email phone');

    if (!order) {
      return sendNotFound(res, 'Order');
    }

    return sendSuccess(res, 200, 'Order retrieved successfully', order);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/me/:id/tracking - Get order tracking information
router.get('/me/:id/tracking', requireAuth, async (req, res, next) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    }).select('shipping orderStatus createdAt');

    if (!order) {
      return sendNotFound(res, 'Order');
    }

    const trackingInfo = {
      orderId: order._id,
      orderStatus: order.orderStatus,
      shippingStatus: order.shipping?.status || 'pending',
      trackingNumber: order.shipping?.trackingNumber,
      trackingUrl: order.shipping?.trackingUrl,
      estimatedDelivery: order.shipping?.estimatedDeliveryDate,
      shippedAt: order.shipping?.shippedAt,
      carrier: order.shipping?.selectedCarrier,
      service: order.shipping?.selectedService,
      orderDate: order.createdAt
    };

    return sendSuccess(res, 200, 'Tracking information retrieved successfully', {
      tracking: trackingInfo
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/me/:id/cancel - Cancel order (customer only, with restrictions)
router.post('/me/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    const order = await Order.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!order) {
      return sendNotFound(res, 'Order');
    }

    // Check if order can be cancelled
    if (order.orderStatus === 'cancelled') {
      return sendError(res, 400, 'Order is already cancelled', null, 'ORDER_ALREADY_CANCELLED');
    }

    if (order.orderStatus === 'delivered') {
      return sendError(res, 400, 'Cannot cancel delivered order', null, 'ORDER_ALREADY_DELIVERED');
    }

    if (order.shipping?.status === 'shipped' || order.shipping?.status === 'in_transit') {
      return sendError(res, 400, 'Cannot cancel order that has been shipped', null, 'ORDER_ALREADY_SHIPPED');
    }

    if (order.isPaid) {
      return sendError(res, 400, 'Cannot cancel paid order. Please contact support for refund.', null, 'PAID_ORDER_CANNOT_CANCEL');
    }

    // Cancel the order
    order.orderStatus = 'cancelled';
    order.cancellationReason = reason || 'Cancelled by customer';
    order.cancelledAt = new Date();
    await order.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'cancel_order',
      description: `Customer cancelled order ${order._id}${reason ? ` - Reason: ${reason}` : ''}`
    });

    return sendUpdated(res, 'Order cancelled successfully', {
      id: order._id,
      orderStatus: order.orderStatus,
      cancellationReason: order.cancellationReason,
      cancelledAt: order.cancelledAt
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/me/:id/review - Submit order review
router.post('/me/:id/review', requireAuth, async (req, res, next) => {
  try {
    const { productId, rating, comment, reviewToken } = req.body;
    
    if (!productId || !rating || rating < 1 || rating > 5) {
      return sendError(res, 400, 'Product ID and rating (1-5) are required', null, 'INVALID_REVIEW_DATA');
    }

    const order = await Order.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!order) {
      return sendNotFound(res, 'Order');
    }

    // Verify review token
    if (order.reviewToken !== reviewToken) {
      return sendForbidden(res, 'Invalid review token');
    }

    // Check if order is delivered
    if (order.orderStatus !== 'delivered') {
      return sendError(res, 400, 'Can only review delivered orders', null, 'ORDER_NOT_DELIVERED');
    }

    // Check if product is in this order
    const orderItem = order.orderItems.find(item => 
      item.product.toString() === productId
    );

    if (!orderItem) {
      return sendError(res, 400, 'Product not found in this order', null, 'PRODUCT_NOT_IN_ORDER');
    }

    // TODO: Create review in Product model or separate Review model
    // For now, just log the review submission
    await ActivityLog.create({
      user: req.user._id,
      action: 'submit_review',
      description: `Submitted review for product ${productId} in order ${order._id} - Rating: ${rating}`
    });

    return sendCreated(res, 'Review submitted successfully', {
      productId,
      rating,
      comment,
      submittedAt: new Date()
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/me/stats - Get customer order statistics
router.get('/me/stats', requireAuth, async (req, res, next) => {
  try {
    const stats = await Order.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' },
          averageOrderValue: { $avg: '$totalPrice' },
          paidOrders: { $sum: { $cond: ['$isPaid', 1, 0] } },
          pendingOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'pending'] }, 1, 0] } },
          shippedOrders: { $sum: { $cond: [{ $in: ['$shipping.status', ['shipped', 'in_transit']] }, 1, 0] } },
          deliveredOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] } },
          cancelledOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 1, 0] } }
        }
      }
    ]);

    const result = stats[0] || {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      paidOrders: 0,
      pendingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0
    };

    return sendSuccess(res, 200, 'Order statistics retrieved successfully', {
      stats: result
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/me/recent - Get recent orders (last 5)
router.get('/me/recent', requireAuth, async (req, res, next) => {
  try {
    const recentOrders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ 
        path: 'orderItems.product', 
        select: 'name price image' 
      })
      .select('orderStatus totalPrice createdAt orderItems');

    return sendSuccess(res, 200, 'Recent orders retrieved successfully', {
      orders: recentOrders
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

//You can copy-paste these later into the browser when the frontend exists.
//🧾 Review Links:
//👉 http://localhost:5173/review?product=6843abc...&token=71fd...
//👉 http://localhost:5173/review?product=6843def...&token=71fd...



