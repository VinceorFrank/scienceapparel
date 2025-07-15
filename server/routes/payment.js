const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_key_here');
const { requireAuth } = require('../middlewares/auth');
const Order = require('../models/Order');
const { sendSuccess, sendError, sendCreated } = require('../utils/responseHandler');

// Test mode flag - set to true for development
const TEST_MODE = process.env.NODE_ENV === 'development' || process.env.TEST_MODE === 'true';

// POST /api/payment/create-intent - Create Stripe PaymentIntent
router.post('/create-intent', requireAuth, async (req, res, next) => {
  try {
    const { orderId, paymentMethod = 'stripe' } = req.body;

    if (!orderId) {
      return sendError(res, 400, 'Order ID is required', null, 'MISSING_ORDER_ID');
    }

    // Check if this is a test order ID
    if (orderId === '507f1f77bcf86cd799439011') {
      console.log('Test order detected, creating mock payment intent');
      const mockPaymentIntent = {
        id: 'pi_test_' + Date.now(),
        clientSecret: 'pi_test_secret_' + Date.now(),
        amount: 3449, // $34.49 in cents
        currency: 'cad',
        status: 'requires_payment_method'
      };

      return sendCreated(res, 'Test payment intent created', {
        paymentIntent: mockPaymentIntent,
        testMode: true
      });
    }

    // Find the order
    const order = await Order.findById(orderId).populate('user', 'name email');
    
    if (!order) {
      return sendError(res, 404, 'Order not found', null, 'ORDER_NOT_FOUND');
    }

    // Check if order belongs to user
    if (order.user._id.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied', null, 'ACCESS_DENIED');
    }

    // Check if order is already paid
    if (order.isPaid) {
      return sendError(res, 400, 'Order is already paid', null, 'ORDER_ALREADY_PAID');
    }

    if (TEST_MODE) {
      // Test mode: return mock payment intent
      console.log('Test mode: creating mock payment intent');
      const mockPaymentIntent = {
        id: 'pi_test_' + Date.now(),
        clientSecret: 'pi_test_secret_' + Date.now(),
        amount: Math.round(order.totalPrice * 100), // Convert to cents
        currency: 'cad',
        status: 'requires_payment_method'
      };

      return sendCreated(res, 'Test payment intent created', {
        paymentIntent: mockPaymentIntent,
        testMode: true
      });
    }

    // Real Stripe integration
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100), // Convert to cents
      currency: 'cad',
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return sendCreated(res, 'Payment intent created', {
      paymentIntent,
      testMode: false
    });

  } catch (err) {
    console.error('Create payment intent error:', err);
    next(err);
  }
});

// POST /api/payment/confirm - Confirm payment
router.post('/confirm', requireAuth, async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return sendError(res, 400, 'Payment intent ID is required', null, 'MISSING_PAYMENT_INTENT_ID');
    }

    if (TEST_MODE || paymentIntentId.startsWith('pi_test_')) {
      // Test mode: simulate successful payment
      console.log('Test mode: confirming mock payment');
      
      // For test orders, we don't need to find a real order
      const mockOrder = {
        _id: '507f1f77bcf86cd799439011',
        isPaid: true,
        paidAt: new Date(),
        orderStatus: 'confirmed',
        totalPrice: 34.49
      };
      
      return sendSuccess(res, 200, 'Test payment confirmed successfully', {
        order: mockOrder,
        paymentIntent: {
          id: paymentIntentId,
          status: 'succeeded'
        },
        testMode: true
      });
    }

    // Real Stripe integration
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Find the order
      const order = await Order.findById(paymentIntent.metadata.orderId);
      
      if (!order) {
        return sendError(res, 404, 'Order not found', null, 'ORDER_NOT_FOUND');
      }

      // Update order as paid
      order.isPaid = true;
      order.paidAt = new Date();
      order.paymentResult = {
        id: paymentIntent.id,
        status: paymentIntent.status,
        update_time: new Date().toISOString(),
        email_address: req.user.email
      };
      order.orderStatus = 'confirmed';
      
      await order.save();

      return sendSuccess(res, 200, 'Payment confirmed successfully', {
        order,
        paymentIntent,
        testMode: false
      });
    } else {
      return sendError(res, 400, 'Payment not successful', null, 'PAYMENT_NOT_SUCCESSFUL');
    }

  } catch (err) {
    console.error('Confirm payment error:', err);
    next(err);
  }
});

// GET /api/payment/test-mode - Check if test mode is enabled
router.get('/test-mode', (req, res) => {
  res.json({ testMode: TEST_MODE });
});

module.exports = router;





