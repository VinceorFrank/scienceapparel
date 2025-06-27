const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const { protect, admin } = require('../middlewares/auth'); // ✅ middleware to get logged-in user
const ActivityLog = require('../models/ActivityLog');
const { parsePaginationParams, executePaginatedQuery, createPaginatedResponse } = require('../utils/pagination');
const mongoose = require('mongoose');

// ✅ POST /api/orders - Create new order (requires token)
router.post('/', protect, async (req, res) => {
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
      return res.status(400).json({ message: 'No order items' });
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

    console.log('🧾 Review Links:');
    reviewLinks.forEach(link => console.log('👉', link));

    await ActivityLog.create({ user: req.user._id, action: 'create_order', description: `Created new order ${order._id}` });

    res.status(201).json({
      message: 'Order created',
      order,
      reviewLinks
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ GET /api/orders - Get orders (admin gets all, customer gets their own)
router.get('/', protect, async (req, res) => {
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

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ GET /api/orders/myorders - All orders of current user
router.get('/myorders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'orderItems.product', select: 'name price image category', populate: { path: 'category', select: 'name' } });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ GET /api/orders/admin - Get all orders (admin only)
router.get('/admin', protect, admin, async (req, res, next) => {
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

    res.json(createPaginatedResponse(result.data, result.page, result.limit, result.total));
  } catch (err) {
    next(err);
  }
});

// ✅ GET /api/orders/:id - View specific order if owned by customer
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({ path: 'orderItems.product', select: 'name price image category', populate: { path: 'category', select: 'name' } })
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Accès non autorisé à cette commande' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ✅ PUT /api/orders/:id/status - Update order status (admin only)
router.put('/:id/status', protect, admin, async (req, res, next) => {
  try {
    const { isShipped, isPaid, status, trackingNumber, notes } = req.body;
    
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
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

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (err) {
    next(err);
  }
});

// ✅ PUT /api/orders/bulk/status - Bulk update order statuses (admin only)
router.put('/bulk/status', protect, admin, async (req, res, next) => {
  try {
    const { orderIds, status, isShipped, isPaid, notes } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: 'Order IDs array is required' });
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

    res.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} orders`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    next(err);
  }
});

// ✅ GET /api/orders/analytics/summary - Get order analytics (admin only)
router.get('/analytics/summary', protect, admin, async (req, res, next) => {
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

    res.json({
      success: true,
      period,
      analytics: result
    });
  } catch (err) {
    next(err);
  }
});

// ✅ DELETE /api/orders/:id - Cancel/delete order (admin only)
router.delete('/:id', protect, admin, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order can be cancelled (not shipped or delivered)
    if (order.isShipped) {
      return res.status(400).json({ 
        message: 'Cannot cancel order that has already been shipped' 
      });
    }

    order.status = 'cancelled';
    await order.save();

    // Log the activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'cancel_order',
      description: `Cancelled order ${order._id}`
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
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



