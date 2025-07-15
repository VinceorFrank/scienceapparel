/**
 * User Dashboard Controller
 * Provides comprehensive user overview including orders, statistics, and activity
 */

const User = require('../models/User');
const Order = require('../models/Order');
const ActivityLog = require('../models/ActivityLog');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { logger } = require('../utils/logger');

/**
 * GET /api/users/dashboard
 * Get comprehensive user dashboard data
 */
exports.getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { period = '30d', limit = 5 } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let dateFilter = {};
    
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
      default:
        dateFilter = {};
    }

    // Get user with addresses
    const user = await User.findById(userId).select('name email phone addresses stats createdAt lastLogin');
    if (!user) {
      return sendError(res, 404, 'User not found', null, 'USER_NOT_FOUND');
    }

    // Get all user orders with product details
    const allOrders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'orderItems.product',
        select: 'name price image category',
        populate: { path: 'category', select: 'name' }
      });

    // Get recent orders (limited)
    const recentOrders = allOrders.slice(0, parseInt(limit));

    // Calculate order statistics
    const orderStats = calculateOrderStatistics(allOrders, dateFilter);

    // Get recent activity
    const recentActivity = await ActivityLog.find({
      user: userId,
      createdAt: dateFilter
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('action description createdAt');

    // Get order status breakdown
    const orderStatusBreakdown = calculateOrderStatusBreakdown(allOrders);

    // Get shipping status breakdown
    const shippingStatusBreakdown = calculateShippingStatusBreakdown(allOrders);

    // Get top categories purchased
    const topCategories = calculateTopCategories(allOrders);

    // Get account summary
    const accountSummary = {
      memberSince: user.createdAt,
      lastLogin: user.lastLogin,
      totalAddresses: user.addresses.length,
      defaultShippingAddress: user.addresses.find(addr => addr.type === 'shipping' && addr.isDefault),
      defaultBillingAddress: user.addresses.find(addr => addr.type === 'billing' && addr.isDefault)
    };

    // Prepare dashboard data
    const dashboardData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      accountSummary,
      orderStatistics: orderStats,
      orderStatusBreakdown,
      shippingStatusBreakdown,
      topCategories,
      recentOrders: recentOrders.map(order => ({
        id: order._id,
        orderNumber: order._id.toString().slice(-8).toUpperCase(),
        totalPrice: order.totalPrice,
        status: order.orderStatus || 'pending',
        shippingStatus: order.shipping?.status || 'pending',
        createdAt: order.createdAt,
        isPaid: order.isPaid,
        isDelivered: order.isDelivered,
        itemCount: order.orderItems.length,
        items: order.orderItems.map(item => ({
          name: item.name,
          price: item.price,
          qty: item.qty,
          image: item.image,
          product: item.product
        }))
      })),
      recentActivity: recentActivity.map(activity => ({
        action: activity.action,
        description: activity.description,
        timestamp: activity.createdAt
      })),
      quickActions: {
        canReorder: allOrders.some(order => order.isDelivered),
        hasPendingOrders: allOrders.some(order => !order.isDelivered),
        hasUnpaidOrders: allOrders.some(order => !order.isPaid)
      }
    };

    logger.info('User dashboard retrieved successfully', {
      userId: userId,
      period,
      orderCount: allOrders.length,
      recentOrdersCount: recentOrders.length
    });

    sendSuccess(res, 200, 'Dashboard retrieved successfully', dashboardData);

  } catch (err) {
    logger.error('Error retrieving user dashboard:', err);
    next(err);
  }
};

/**
 * Calculate order statistics
 */
function calculateOrderStatistics(orders, dateFilter) {
  const filteredOrders = dateFilter.$gte 
    ? orders.filter(order => order.createdAt >= dateFilter.$gte)
    : orders;

  const totalOrders = filteredOrders.length;
  const totalSpent = filteredOrders.reduce((sum, order) => sum + order.totalPrice, 0);
  const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
  const paidOrders = filteredOrders.filter(order => order.isPaid).length;
  const deliveredOrders = filteredOrders.filter(order => order.isDelivered).length;

  return {
    totalOrders,
    totalSpent: parseFloat(totalSpent.toFixed(2)),
    averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
    paidOrders,
    deliveredOrders,
    completionRate: totalOrders > 0 ? (deliveredOrders / totalOrders * 100).toFixed(1) : 0
  };
}

/**
 * Calculate order status breakdown
 */
function calculateOrderStatusBreakdown(orders) {
  const statusCount = {};
  
  orders.forEach(order => {
    const status = order.orderStatus || 'pending';
    statusCount[status] = (statusCount[status] || 0) + 1;
  });

  return Object.entries(statusCount).map(([status, count]) => ({
    status,
    count,
    percentage: ((count / orders.length) * 100).toFixed(1)
  }));
}

/**
 * Calculate shipping status breakdown
 */
function calculateShippingStatusBreakdown(orders) {
  const statusCount = {};
  
  orders.forEach(order => {
    const status = order.shipping?.status || 'pending';
    statusCount[status] = (statusCount[status] || 0) + 1;
  });

  return Object.entries(statusCount).map(([status, count]) => ({
    status,
    count,
    percentage: ((count / orders.length) * 100).toFixed(1)
  }));
}

/**
 * Calculate top categories purchased
 */
function calculateTopCategories(orders) {
  const categoryCount = {};
  
  orders.forEach(order => {
    order.orderItems.forEach(item => {
      if (item.product && item.product.category) {
        const categoryName = item.product.category.name;
        categoryCount[categoryName] = (categoryCount[categoryName] || 0) + item.qty;
      }
    });
  });

  return Object.entries(categoryCount)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/**
 * POST /api/users/dashboard/reorder
 * Reorder items from a previous order
 */
exports.reorderFromOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.body;

    if (!orderId) {
      return sendError(res, 400, 'Order ID is required', null, 'MISSING_ORDER_ID');
    }

    // Get the original order
    const originalOrder = await Order.findById(orderId)
      .populate({
        path: 'orderItems.product',
        select: 'name price image category stock archived'
      });

    if (!originalOrder) {
      return sendError(res, 404, 'Order not found', null, 'ORDER_NOT_FOUND');
    }

    // Verify user owns this order
    if (originalOrder.user.toString() !== userId.toString()) {
      return sendError(res, 403, 'Not authorized to access this order', null, 'UNAUTHORIZED');
    }

    // Check if order was delivered
    if (!originalOrder.isDelivered) {
      return sendError(res, 400, 'Can only reorder delivered orders', null, 'ORDER_NOT_DELIVERED');
    }

    // Prepare items for reorder (check availability)
    const reorderItems = [];
    const unavailableItems = [];

    for (const item of originalOrder.orderItems) {
      const product = item.product;
      
      if (!product) {
        unavailableItems.push({
          name: item.name,
          reason: 'Product no longer available'
        });
        continue;
      }

      if (product.archived) {
        unavailableItems.push({
          name: product.name,
          reason: 'Product is no longer sold'
        });
        continue;
      }

      if (product.stock < item.qty) {
        unavailableItems.push({
          name: product.name,
          reason: `Only ${product.stock} available (requested: ${item.qty})`
        });
        continue;
      }

      reorderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: item.qty
      });
    }

    // Log reorder activity
    await ActivityLog.create({
      user: userId,
      action: 'reorder_attempt',
      description: `Attempted to reorder from order ${orderId}`,
      ipAddress: req.ip
    });

    logger.info('Reorder attempt processed', {
      userId,
      orderId,
      totalItems: originalOrder.orderItems.length,
      availableItems: reorderItems.length,
      unavailableItems: unavailableItems.length
    });

    sendSuccess(res, 200, 'Reorder items prepared', {
      reorderItems,
      unavailableItems,
      originalOrder: {
        id: originalOrder._id,
        orderNumber: originalOrder._id.toString().slice(-8).toUpperCase(),
        totalPrice: originalOrder.totalPrice,
        createdAt: originalOrder.createdAt
      },
      canProceed: reorderItems.length > 0
    });

  } catch (err) {
    logger.error('Error processing reorder:', err);
    next(err);
  }
};

/**
 * GET /api/users/orders/tracking/:orderId
 * Get detailed tracking information for a specific order
 */
exports.getOrderTracking = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;

    if (!orderId) {
      return sendError(res, 400, 'Order ID is required', null, 'MISSING_ORDER_ID');
    }

    // Get the order with full details
    const order = await Order.findById(orderId)
      .populate({
        path: 'orderItems.product',
        select: 'name price image category'
      })
      .populate('shipping');

    if (!order) {
      return sendError(res, 404, 'Order not found', null, 'ORDER_NOT_FOUND');
    }

    // Verify user owns this order
    if (order.user.toString() !== userId.toString()) {
      return sendError(res, 403, 'Not authorized to access this order', null, 'UNAUTHORIZED');
    }

    // Get order activity log
    const orderActivity = await ActivityLog.find({
      user: userId,
      description: { $regex: orderId, $options: 'i' }
    })
    .sort({ createdAt: -1 })
    .limit(20);

    // Build tracking timeline
    const trackingTimeline = buildTrackingTimeline(order, orderActivity);

    // Calculate estimated delivery
    const estimatedDelivery = calculateEstimatedDelivery(order);

    // Get shipping details
    const shippingInfo = {
      status: order.shipping?.status || 'pending',
      carrier: order.shipping?.carrier || 'Standard Shipping',
      trackingNumber: order.shipping?.trackingNumber,
      estimatedDelivery,
      shippingAddress: order.shippingAddress,
      shippingMethod: order.shipping?.method || 'Standard',
      shippingCost: order.shipping?.cost || 0
    };

    // Prepare tracking data
    const trackingData = {
      order: {
        id: order._id,
        orderNumber: order._id.toString().slice(-8).toUpperCase(),
        status: order.orderStatus || 'pending',
        totalPrice: order.totalPrice,
        createdAt: order.createdAt,
        isPaid: order.isPaid,
        isDelivered: order.isDelivered,
        paymentMethod: order.paymentMethod,
        items: order.orderItems.map(item => ({
          name: item.name,
          price: item.price,
          qty: item.qty,
          image: item.image,
          product: item.product
        }))
      },
      shipping: shippingInfo,
      tracking: {
        timeline: trackingTimeline,
        currentStatus: order.shipping?.status || 'pending',
        lastUpdate: order.shipping?.lastUpdate || order.updatedAt,
        isDelivered: order.isDelivered
      }
    };

    logger.info('Order tracking retrieved successfully', {
      userId,
      orderId,
      orderStatus: order.orderStatus,
      shippingStatus: order.shipping?.status
    });

    sendSuccess(res, 200, 'Order tracking retrieved successfully', trackingData);

  } catch (err) {
    logger.error('Error retrieving order tracking:', err);
    next(err);
  }
};

/**
 * GET /api/users/orders/history
 * Get user's complete order history with filtering and pagination
 */
exports.getOrderHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      dateFrom, 
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter criteria
    const filter = { user: userId };
    
    if (status) {
      filter.orderStatus = status;
    }
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Build sort criteria
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get orders with pagination
    const orders = await Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'orderItems.product',
        select: 'name price image category'
      });

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    // Get order statistics for the filtered results
    const allFilteredOrders = await Order.find(filter);
    const orderStats = calculateOrderStatistics(allFilteredOrders, {});

    // Prepare order history data
    const orderHistory = {
      orders: orders.map(order => ({
        id: order._id,
        orderNumber: order._id.toString().slice(-8).toUpperCase(),
        status: order.orderStatus || 'pending',
        shippingStatus: order.shipping?.status || 'pending',
        totalPrice: order.totalPrice,
        createdAt: order.createdAt,
        isPaid: order.isPaid,
        isDelivered: order.isDelivered,
        itemCount: order.orderItems.length,
        items: order.orderItems.map(item => ({
          name: item.name,
          price: item.price,
          qty: item.qty,
          image: item.image,
          product: item.product
        }))
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      filters: {
        status,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder
      },
      statistics: orderStats
    };

    logger.info('Order history retrieved successfully', {
      userId,
      page: parseInt(page),
      limit: parseInt(limit),
      totalOrders,
      filters: { status, dateFrom, dateTo }
    });

    sendSuccess(res, 200, 'Order history retrieved successfully', orderHistory);

  } catch (err) {
    logger.error('Error retrieving order history:', err);
    next(err);
  }
};

/**
 * GET /api/users/orders/active
 * Get user's active orders (pending, processing, shipped)
 */
exports.getActiveOrders = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { limit = 5 } = req.query;

    // Get active orders (not delivered or cancelled)
    const activeOrders = await Order.find({
      user: userId,
      orderStatus: { $nin: ['delivered', 'cancelled'] },
      isDelivered: false
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate({
      path: 'orderItems.product',
      select: 'name price image category'
    });

    // Prepare active orders data
    const activeOrdersData = {
      orders: activeOrders.map(order => ({
        id: order._id,
        orderNumber: order._id.toString().slice(-8).toUpperCase(),
        status: order.orderStatus || 'pending',
        shippingStatus: order.shipping?.status || 'pending',
        totalPrice: order.totalPrice,
        createdAt: order.createdAt,
        isPaid: order.isPaid,
        estimatedDelivery: calculateEstimatedDelivery(order),
        itemCount: order.orderItems.length,
        items: order.orderItems.map(item => ({
          name: item.name,
          price: item.price,
          qty: item.qty,
          image: item.image,
          product: item.product
        }))
      })),
      count: activeOrders.length
    };

    logger.info('Active orders retrieved successfully', {
      userId,
      activeOrderCount: activeOrders.length
    });

    sendSuccess(res, 200, 'Active orders retrieved successfully', activeOrdersData);

  } catch (err) {
    logger.error('Error retrieving active orders:', err);
    next(err);
  }
};

/**
 * Build tracking timeline from order and activity data
 */
function buildTrackingTimeline(order, activityLogs) {
  const timeline = [];

  // Add order creation
  timeline.push({
    status: 'Order Placed',
    description: 'Your order has been placed successfully',
    timestamp: order.createdAt,
    icon: 'shopping-cart',
    completed: true
  });

  // Add payment confirmation if paid
  if (order.isPaid) {
    timeline.push({
      status: 'Payment Confirmed',
      description: 'Payment has been processed successfully',
      timestamp: order.paymentDate || order.createdAt,
      icon: 'credit-card',
      completed: true
    });
  }

  // Add order processing
  if (order.orderStatus === 'processing' || order.orderStatus === 'shipped' || order.orderStatus === 'delivered') {
    timeline.push({
      status: 'Order Processing',
      description: 'Your order is being prepared for shipment',
      timestamp: order.updatedAt,
      icon: 'package',
      completed: true
    });
  }

  // Add shipping status
  if (order.shipping?.status) {
    const shippingStatus = order.shipping.status;
    const shippingTimestamp = order.shipping.lastUpdate || order.updatedAt;

    switch (shippingStatus) {
      case 'shipped':
        timeline.push({
          status: 'Order Shipped',
          description: `Your order has been shipped via ${order.shipping.carrier || 'Standard Shipping'}`,
          timestamp: shippingTimestamp,
          icon: 'truck',
          completed: true,
          trackingNumber: order.shipping.trackingNumber
        });
        break;
      case 'in_transit':
        timeline.push({
          status: 'In Transit',
          description: 'Your order is on its way to you',
          timestamp: shippingTimestamp,
          icon: 'map-pin',
          completed: true,
          trackingNumber: order.shipping.trackingNumber
        });
        break;
      case 'out_for_delivery':
        timeline.push({
          status: 'Out for Delivery',
          description: 'Your order is out for delivery today',
          timestamp: shippingTimestamp,
          icon: 'truck',
          completed: true,
          trackingNumber: order.shipping.trackingNumber
        });
        break;
    }
  }

  // Add delivery confirmation
  if (order.isDelivered) {
    timeline.push({
      status: 'Delivered',
      description: 'Your order has been delivered successfully',
      timestamp: order.deliveredAt || order.updatedAt,
      icon: 'check-circle',
      completed: true
    });
  }

  // Add activity log entries
  activityLogs.forEach(activity => {
    timeline.push({
      status: 'Update',
      description: activity.description,
      timestamp: activity.createdAt,
      icon: 'info',
      completed: true,
      isActivityLog: true
    });
  });

  // Sort timeline by timestamp
  return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

/**
 * Calculate estimated delivery date
 */
function calculateEstimatedDelivery(order) {
  if (order.isDelivered) {
    return order.deliveredAt || order.updatedAt;
  }

  const orderDate = new Date(order.createdAt);
  let estimatedDays = 7; // Default 7 days

  // Adjust based on shipping method
  if (order.shipping?.method) {
    switch (order.shipping.method.toLowerCase()) {
      case 'express':
        estimatedDays = 2;
        break;
      case 'priority':
        estimatedDays = 3;
        break;
      case 'standard':
      default:
        estimatedDays = 7;
        break;
    }
  }

  const estimatedDate = new Date(orderDate);
  estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);

  return estimatedDate;
}

/**
 * PUT /api/users/profile
 * Update user profile information
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, email, phone, dateOfBirth, preferences } = req.body;

    // Validate required fields
    if (!name || !email) {
      return sendError(res, 400, 'Name and email are required', null, 'MISSING_REQUIRED_FIELDS');
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return sendError(res, 400, 'Email is already in use', null, 'EMAIL_ALREADY_EXISTS');
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        preferences: preferences || {},
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return sendError(res, 404, 'User not found', null, 'USER_NOT_FOUND');
    }

    // Log profile update activity
    await ActivityLog.create({
      user: userId,
      action: 'profile_updated',
      description: 'Profile information updated',
      ipAddress: req.ip
    });

    logger.info('User profile updated successfully', {
      userId,
      updatedFields: Object.keys(req.body)
    });

    sendSuccess(res, 200, 'Profile updated successfully', {
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        dateOfBirth: updatedUser.dateOfBirth,
        preferences: updatedUser.preferences
      }
    });

  } catch (err) {
    logger.error('Error updating user profile:', err);
    next(err);
  }
};

/**
 * PUT /api/users/password
 * Change user password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, 400, 'Current password and new password are required', null, 'MISSING_PASSWORD_FIELDS');
    }

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return sendError(res, 404, 'User not found', null, 'USER_NOT_FOUND');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return sendError(res, 400, 'Current password is incorrect', null, 'INVALID_CURRENT_PASSWORD');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log password change activity
    await ActivityLog.create({
      user: userId,
      action: 'password_changed',
      description: 'Password changed successfully',
      ipAddress: req.ip
    });

    logger.info('User password changed successfully', { userId });

    sendSuccess(res, 200, 'Password changed successfully');

  } catch (err) {
    logger.error('Error changing user password:', err);
    next(err);
  }
};

/**
 * GET /api/users/addresses
 * Get user addresses
 */
exports.getAddresses = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('addresses');
    if (!user) {
      return sendError(res, 404, 'User not found', null, 'USER_NOT_FOUND');
    }

    // Group addresses by type
    const addresses = {
      shipping: user.addresses.filter(addr => addr.type === 'shipping'),
      billing: user.addresses.filter(addr => addr.type === 'billing'),
      all: user.addresses
    };

    logger.info('User addresses retrieved successfully', {
      userId,
      addressCount: user.addresses.length
    });

    sendSuccess(res, 200, 'Addresses retrieved successfully', { addresses });

  } catch (err) {
    logger.error('Error retrieving user addresses:', err);
    next(err);
  }
};

/**
 * POST /api/users/addresses
 * Add new address
 */
exports.addAddress = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { 
      type, 
      isDefault, 
      address, 
      street, 
      city, 
      province, 
      state, 
      postalCode, 
      zipCode, 
      country, 
      phone 
    } = req.body;

    // Validate required fields
    if (!type || !(address || street) || !city || !(postalCode || zipCode) || !country) {
      return sendError(res, 400, 'Type, address, city, postal code, and country are required', null, 'MISSING_ADDRESS_FIELDS');
    }

    // Validate address type
    if (!['shipping', 'billing'].includes(type)) {
      return sendError(res, 400, 'Address type must be shipping or billing', null, 'INVALID_ADDRESS_TYPE');
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 404, 'User not found', null, 'USER_NOT_FOUND');
    }

    // If this is a default address, unset other defaults of the same type
    if (isDefault) {
      user.addresses.forEach(addr => {
        if (addr.type === type) {
          addr.isDefault = false;
        }
      });
    }

    // Add new address
    const newAddress = {
      type,
      isDefault: isDefault || false,
      address: address || street,
      city,
      state: province || state,
      postalCode: postalCode || zipCode,
      country,
      phone
    };

    user.addresses.push(newAddress);
    await user.save();

    // Log address addition
    await ActivityLog.create({
      user: userId,
      event: 'address_added',
      action: 'address_added',
      description: `Added new ${type} address`,
      ip: req.ip
    });

    logger.info('User address added successfully', {
      userId,
      addressType: type,
      isDefault
    });

    sendSuccess(res, 201, 'Address added successfully', {
      address: newAddress,
      addressId: user.addresses[user.addresses.length - 1]._id
    });

  } catch (err) {
    logger.error('Error adding user address:', err);
    next(err);
  }
};

/**
 * PUT /api/users/addresses/:addressId
 * Update address
 */
exports.updateAddress = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { addressId } = req.params;
    const { 
      type, 
      isDefault, 
      address, 
      street, 
      city, 
      province, 
      state, 
      postalCode, 
      zipCode, 
      country, 
      phone 
    } = req.body;

    // Validate required fields
    if (!(address || street) || !city || !(postalCode || zipCode) || !country) {
      return sendError(res, 400, 'Address, city, postal code, and country are required', null, 'MISSING_ADDRESS_FIELDS');
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 404, 'User not found', null, 'USER_NOT_FOUND');
    }

    // Find the address
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return sendError(res, 404, 'Address not found', null, 'ADDRESS_NOT_FOUND');
    }

    // If this is a default address, unset other defaults of the same type
    if (isDefault) {
      user.addresses.forEach(addr => {
        if (addr.type === user.addresses[addressIndex].type) {
          addr.isDefault = false;
        }
      });
    }

    // Update address
    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex],
      type: type || user.addresses[addressIndex].type,
      isDefault: isDefault !== undefined ? isDefault : user.addresses[addressIndex].isDefault,
      address: address || street,
      city,
      state: province || state,
      postalCode: postalCode || zipCode,
      country,
      phone
    };

    await user.save();

    // Log address update
    await ActivityLog.create({
      user: userId,
      event: 'address_updated',
      action: 'address_updated',
      description: `Updated ${user.addresses[addressIndex].type} address`,
      ip: req.ip
    });

    logger.info('User address updated successfully', {
      userId,
      addressId,
      addressType: user.addresses[addressIndex].type
    });

    sendSuccess(res, 200, 'Address updated successfully', {
      address: user.addresses[addressIndex]
    });

  } catch (err) {
    logger.error('Error updating user address:', err);
    next(err);
  }
};

/**
 * DELETE /api/users/addresses/:addressId
 * Delete address
 */
exports.deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 404, 'User not found', null, 'USER_NOT_FOUND');
    }

    // Find the address
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return sendError(res, 404, 'Address not found', null, 'ADDRESS_NOT_FOUND');
    }

    const addressType = user.addresses[addressIndex].type;
    const wasDefault = user.addresses[addressIndex].isDefault;

    // Remove address
    user.addresses.splice(addressIndex, 1);

    // If we deleted a default address, set the first address of the same type as default
    if (wasDefault) {
      const firstAddressOfType = user.addresses.find(addr => addr.type === addressType);
      if (firstAddressOfType) {
        firstAddressOfType.isDefault = true;
      }
    }

    await user.save();

    // Log address deletion
    await ActivityLog.create({
      user: userId,
      event: 'address_deleted',
      action: 'address_deleted',
      description: `Deleted ${addressType} address`,
      ip: req.ip
    });

    logger.info('User address deleted successfully', {
      userId,
      addressId,
      addressType
    });

    sendSuccess(res, 200, 'Address deleted successfully');

  } catch (err) {
    logger.error('Error deleting user address:', err);
    next(err);
  }
};

/**
 * PUT /api/users/addresses/:addressId/default
 * Set address as default
 */
exports.setDefaultAddress = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 404, 'User not found', null, 'USER_NOT_FOUND');
    }

    // Find the address
    const address = user.addresses.find(addr => addr._id.toString() === addressId);
    if (!address) {
      return sendError(res, 404, 'Address not found', null, 'ADDRESS_NOT_FOUND');
    }

    // Unset other defaults of the same type
    user.addresses.forEach(addr => {
      if (addr.type === address.type) {
        addr.isDefault = false;
      }
    });

    // Set this address as default
    address.isDefault = true;
    await user.save();

    // Log default address change
    await ActivityLog.create({
      user: userId,
      action: 'default_address_changed',
      description: `Set ${address.type} address as default`,
      ipAddress: req.ip
    });

    logger.info('Default address set successfully', {
      userId,
      addressId,
      addressType: address.type
    });

    sendSuccess(res, 200, 'Default address set successfully', { address });

  } catch (err) {
    logger.error('Error setting default address:', err);
    next(err);
  }
};

/**
 * GET /api/users/preferences
 * Get user preferences
 */
exports.getPreferences = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('preferences');
    if (!user) {
      return sendError(res, 404, 'User not found', null, 'USER_NOT_FOUND');
    }

    sendSuccess(res, 200, 'Preferences retrieved successfully', {
      preferences: user.preferences || {}
    });

  } catch (err) {
    logger.error('Error retrieving user preferences:', err);
    next(err);
  }
};

/**
 * PUT /api/users/preferences
 * Update user preferences
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return sendError(res, 400, 'Preferences object is required', null, 'MISSING_PREFERENCES');
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 404, 'User not found', null, 'USER_NOT_FOUND');
    }

    // Update preferences
    user.preferences = { ...user.preferences, ...preferences };
    await user.save();

    // Log preferences update
    await ActivityLog.create({
      user: userId,
      action: 'preferences_updated',
      description: 'User preferences updated',
      ipAddress: req.ip
    });

    logger.info('User preferences updated successfully', {
      userId,
      updatedPreferences: Object.keys(preferences)
    });

    sendSuccess(res, 200, 'Preferences updated successfully', {
      preferences: user.preferences
    });

  } catch (err) {
    logger.error('Error updating user preferences:', err);
    next(err);
  }
};

/**
 * GET /api/users/activity
 * Get user activity log
 */
exports.getActivityLog = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, action } = req.query;

    // Build filter
    const filter = { user: userId };
    if (action) {
      filter.action = action;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get activity logs
    const activities = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('action description createdAt ipAddress');

    // Get total count
    const totalActivities = await ActivityLog.countDocuments(filter);

    logger.info('User activity log retrieved successfully', {
      userId,
      page: parseInt(page),
      limit: parseInt(limit),
      totalActivities
    });

    sendSuccess(res, 200, 'Activity log retrieved successfully', {
      activities: activities.map(activity => ({
        action: activity.action,
        description: activity.description,
        timestamp: activity.createdAt,
        ipAddress: activity.ipAddress
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalActivities / parseInt(limit)),
        totalActivities,
        hasNextPage: parseInt(page) < Math.ceil(totalActivities / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (err) {
    logger.error('Error retrieving user activity log:', err);
    next(err);
  }
}; 