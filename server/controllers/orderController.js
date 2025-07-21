/**
 * Order Controller
 * Handles all order-related business logic
 */

const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');
const { logger } = require('../utils/logger');
const { auditLog, AUDIT_EVENTS } = require('../utils/auditLogger');
const crypto = require('crypto');
const mongoose = require('mongoose');

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @param {Object} user - User object
 * @returns {Object} Created order with review links
 */
const createOrder = async (orderData, user) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice
  } = orderData;

  // Validate order items
  if (!orderItems || orderItems.length === 0) {
    throw new Error('No order items provided');
  }

  // Validate total price
  const calculatedTotal = (itemsPrice || 0) + (taxPrice || 0) + (shippingPrice || 0);
  if (Math.abs(calculatedTotal - totalPrice) > 0.01) {
    throw new Error('Total price mismatch');
  }

  // STOCK CHECK: Ensure all products have enough stock
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      throw new Error(`Product not found: ${item.product}`);
    }
    if (product.stock < item.qty) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.qty}`);
    }
  }

  // Create order
  const order = new Order({
    user: user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    taxPrice,
    shippingPrice,
    totalPrice,
    reviewToken: crypto.randomBytes(32).toString('hex')
  });

  await order.save();

  // Generate review links
  const reviewLinks = order.orderItems.map((item) => {
    return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/review?product=${item.product}&token=${order.reviewToken}`;
  });

  // Log activity
  await ActivityLog.create({
    user: user._id,
    event: 'create_order',
    action: 'create_order',
    description: `Created new order ${order._id}`,
    event: AUDIT_EVENTS.ORDER_CREATED,
    severity: 'medium',
    category: 'business'
  });

  logger.info('Order created successfully', {
    orderId: order._id,
    userId: user._id,
    totalPrice: order.totalPrice,
    itemCount: order.orderItems.length
  });

  return {
    order,
    reviewLinks
  };
};

/**
 * Get orders for user (admin gets all, customer gets their own)
 * @param {Object} user - User object
 * @param {Object} options - Query options
 * @returns {Array} Orders
 */
const getOrders = async (user, options = {}) => {
  const { populate = true, sort = { createdAt: -1 } } = options;

  let query = {};
  
  // Admin gets all orders, customer gets only their own
  if (!user.isAdmin) {
    query.user = user._id;
  }

  let ordersQuery = Order.find(query).sort(sort);

  if (populate) {
    ordersQuery = ordersQuery
      .populate('user', 'name email')
      .populate({
        path: 'orderItems.product',
        select: 'name price image category',
        populate: { path: 'category', select: 'name' }
      });
  }

  const orders = await ordersQuery;

  // Log activity
  await auditLog(AUDIT_EVENTS.DATA_VIEWED, {
    action: 'view_orders',
    orderCount: orders.length,
    isAdmin: user.isAdmin
  }, null, {
    userId: user._id,
    userEmail: user.email,
    userRole: user.role
  });

  return orders;
};

/**
 * Get orders for admin with advanced filtering
 * @param {Object} filters - Filter options
 * @param {Object} pagination - Pagination options
 * @returns {Object} Paginated orders
 */
const getAdminOrders = async (filters = {}, pagination = {}) => {
  const {
    search,
    status,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    page = 1,
    limit = 50
  } = filters;

  const queryFilters = {};

  // Enhanced search functionality
  if (search) {
    const isObjectId = mongoose.Types.ObjectId.isValid(search);
    
    let userIds = [];
    if (!isObjectId) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      userIds = users.map(user => user._id);
    }

    queryFilters.$or = [
      ...(isObjectId ? [{ _id: search }] : []),
      ...(userIds.length > 0 ? [{ user: { $in: userIds } }] : [])
    ];

    if (queryFilters.$or.length === 0) {
      queryFilters._id = new mongoose.Types.ObjectId();
    }
  }

  // Status filtering
  if (status && status !== 'all') {
    switch (status) {
      case 'paid':
        queryFilters.isPaid = true;
        break;
      case 'unpaid':
        queryFilters.isPaid = false;
        break;
      case 'shipped':
        queryFilters.isShipped = true;
        break;
      case 'pending':
        queryFilters.isShipped = false;
        break;
      case 'cancelled':
        queryFilters.status = 'cancelled';
        break;
      case 'refunded':
        queryFilters.status = 'refunded';
        break;
    }
  }

  // Date range filtering
  if (dateFrom || dateTo) {
    queryFilters.createdAt = {};
    if (dateFrom) queryFilters.createdAt.$gte = new Date(dateFrom);
    if (dateTo) queryFilters.createdAt.$lte = new Date(dateTo);
  }

  // Amount range filtering
  if (minAmount || maxAmount) {
    queryFilters.totalPrice = {};
    if (minAmount) queryFilters.totalPrice.$gte = parseFloat(minAmount);
    if (maxAmount) queryFilters.totalPrice.$lte = parseFloat(maxAmount);
  }

  const skip = (page - 1) * limit;

  const orders = await Order.find(queryFilters)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments(queryFilters);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get order by ID with ownership validation
 * @param {string} orderId - Order ID
 * @param {Object} user - User object
 * @returns {Object} Order
 */
const getOrderById = async (orderId, user) => {
  const order = await Order.findById(orderId)
    .populate({
      path: 'orderItems.product',
      select: 'name price image category',
      populate: { path: 'category', select: 'name' }
    })
    .populate('user', 'name email');

  if (!order) {
    throw new Error('Order not found');
  }

  // Check ownership (admin can view all orders)
  if (!user.isAdmin && order.user.toString() !== user._id.toString()) {
    throw new Error('Access denied');
  }

  // Log activity
  await auditLog(AUDIT_EVENTS.DATA_VIEWED, {
    action: 'view_order',
    orderId: order._id
  }, null, {
    userId: user._id,
    userEmail: user.email,
    userRole: user.role
  });

  return order;
};

/**
 * Update order status (admin only)
 * @param {string} orderId - Order ID
 * @param {Object} updateData - Update data
 * @param {Object} user - User object
 * @returns {Object} Updated order
 */
const updateOrderStatus = async (orderId, updateData, user) => {
  const { isShipped, isPaid, status, trackingNumber, notes } = updateData;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  // Update fields
  if (isShipped !== undefined) order.isShipped = isShipped;
  if (isPaid !== undefined) order.isPaid = isPaid;
  if (status) order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (notes) order.notes = notes;

  await order.save();

  // Log activity
  await ActivityLog.create({
    user: user._id,
    event: 'update_order_status',
    action: 'update_order_status',
    description: `Updated order ${orderId} status`,
    event: AUDIT_EVENTS.ORDER_UPDATED,
    severity: 'medium',
    category: 'business'
  });

  logger.info('Order status updated', {
    orderId: order._id,
    updatedBy: user._id,
    changes: updateData
  });

  return order;
};

/**
 * Cancel order
 * @param {string} orderId - Order ID
 * @param {string} reason - Cancellation reason
 * @param {Object} user - User object
 * @returns {Object} Cancelled order
 */
const cancelOrder = async (orderId, reason, user) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  // Check if order can be cancelled
  if (order.status === 'cancelled') {
    throw new Error('Order is already cancelled');
  }

  if (order.isShipped) {
    throw new Error('Cannot cancel shipped order');
  }

  // Update order status
  order.status = 'cancelled';
  order.cancellationReason = reason;
  order.cancelledAt = new Date();
  order.cancelledBy = user._id;

  await order.save();

  // Log activity
  await ActivityLog.create({
    user: user._id,
    event: 'cancel_order',
    action: 'cancel_order',
    description: `Cancelled order ${orderId}: ${reason}`,
    event: AUDIT_EVENTS.ORDER_CANCELLED,
    severity: 'medium',
    category: 'business'
  });

  logger.info('Order cancelled', {
    orderId: order._id,
    cancelledBy: user._id,
    reason
  });

  return order;
};

/**
 * Add review to order
 * @param {string} orderId - Order ID
 * @param {Object} reviewData - Review data
 * @param {Object} user - User object
 * @returns {Object} Updated order
 */
const addReview = async (orderId, reviewData, user) => {
  const { productId, rating, comment, reviewToken } = reviewData;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  // Validate review token
  if (order.reviewToken !== reviewToken) {
    throw new Error('Invalid review token');
  }

  // Check if product is in order
  const orderItem = order.orderItems.find(item => 
    item.product.toString() === productId
  );

  if (!orderItem) {
    throw new Error('Product not found in order');
  }

  // Add review to product
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const review = {
    user: user._id,
    rating,
    comment,
    createdAt: new Date()
  };

  product.reviews.push(review);

  // Update product rating
  const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
  product.rating = totalRating / product.reviews.length;
  product.numReviews = product.reviews.length;

  await product.save();

  // Log activity
  await ActivityLog.create({
    user: user._id,
    event: 'add_review',
    action: 'add_review',
    description: `Added review for product ${productId}`,
    event: 'review_added',
    severity: 'low',
    category: 'business'
  });

  return order;
};

/**
 * Get order statistics
 * @param {Object} user - User object
 * @returns {Object} Order statistics
 */
const getOrderStats = async (user) => {
  let query = {};
  
  if (!user.isAdmin) {
    query.user = user._id;
  }

  const stats = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
        averageOrderValue: { $avg: '$totalPrice' },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        shippedOrders: {
          $sum: { $cond: [{ $eq: ['$isShipped', true] }, 1, 0] }
        },
        paidOrders: {
          $sum: { $cond: [{ $eq: ['$isPaid', true] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    paidOrders: 0
  };
};

module.exports = {
  createOrder,
  getOrders,
  getAdminOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  addReview,
  getOrderStats
}; 