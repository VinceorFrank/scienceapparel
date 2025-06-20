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

// ✅ GET /api/orders/myorders - All orders of current user
router.get('/myorders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('orderItems.product', 'name price');

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ GET /api/orders/:id - View specific order if owned by customer
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('orderItems.product', 'name price');

    if (!order) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès non autorisé à cette commande' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ✅ GET /api/orders/admin - Get all orders (admin only)
router.get('/admin', protect, admin, async (req, res, next) => {
  try {
    const { page, limit, search, status } = req.query;
    const paginationParams = parsePaginationParams({ page, limit });

    const filters = {};
    if (search) {
      // Search by order ID or user email/name
      filters.$or = [
        { _id: mongoose.Types.ObjectId.isValid(search) ? search : null },
        { 'user.email': { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } }
      ].filter(cond => cond._id !== null);
    }
    if (status) {
      if (status === 'paid') filters.isPaid = true;
      if (status === 'unpaid') filters.isPaid = false;
      if (status === 'shipped') filters.isShipped = true;
      if (status === 'pending') filters.isShipped = false;
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

// ✅ PUT /api/orders/:id/status - Update order status (admin only)
router.put('/:id/status', protect, admin, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.isShipped = req.body.isShipped ?? order.isShipped;
    order.isPaid = req.body.isPaid ?? order.isPaid;
    // Add other status updates as needed

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

//You can copy-paste these later into the browser when the frontend exists.
//🧾 Review Links:
//👉 http://localhost:5173/review?product=6843abc...&token=71fd...
//👉 http://localhost:5173/review?product=6843def...&token=71fd...



