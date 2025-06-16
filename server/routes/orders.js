const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const { protect } = require('../middlewares/auth'); // ✅ middleware to get logged-in user

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

module.exports = router;

//You can copy-paste these later into the browser when the frontend exists.
//🧾 Review Links:
//👉 http://localhost:5173/review?product=6843abc...&token=71fd...
//👉 http://localhost:5173/review?product=6843def...&token=71fd...



