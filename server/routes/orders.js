const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order'); // make sure path is correct


// TODO: Ajouter les routes commandes


// @desc    Create a new order
// @route   POST /api/orders
router.post('/', async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    userId, // temporarily allow user ID in body (until auth is set up)
  } = req.body;

  try {
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    const order = new Order({
      user: userId, // Normally you'd use req.user._id
      orderItems,
      shippingAddress,
      paymentMethod,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    // ✅ Generate a secure review token
    order.reviewToken = crypto.randomBytes(32).toString('hex');

    await order.save();

    res.status(201).json({ message: 'Order created', order });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

//Once we plug in authentication, you’ll replace userId in the body with req.user._id and add protect middleware — but we’ll do that when ready.

module.exports = router;





