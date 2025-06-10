const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');

router.post('/', async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    userId // for now, passed in body until auth is used
  } = req.body;

  try {
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    const order = new Order({
      user: userId,
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

    // ✅ Build review links for each product
    const reviewLinks = order.orderItems.map((item) => {
      return `http://localhost:5173/review?product=${item.product}&token=${order.reviewToken}`;
    });

    // ✅ Print links to terminal for testing
    console.log('🧾 Review Links:');
    reviewLinks.forEach(link => console.log('👉', link));

    // ✅ Return them in response for testing (optional)
    res.status(201).json({
      message: 'Order created',
      order,
      reviewLinks
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


//Once we plug in authentication, you’ll replace userId in the body with req.user._id and add protect middleware — but we’ll do that when ready.

module.exports = router;

//You can copy-paste these later into the browser when the frontend exists.
//🧾 Review Links:
//👉 http://localhost:5173/review?product=6843abc...&token=71fd...
//👉 http://localhost:5173/review?product=6843def...&token=71fd...



