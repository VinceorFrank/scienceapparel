// Initialize Stripe only if API key is available
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('⚠️ Stripe API key not found. Payment functionality will be limited.');
}

const Payment = require('../models/Payment');
const Order = require('../models/Order');
const ActivityLog = require('../models/ActivityLog');
const { logger } = require('../utils/logger');

// Create payment intent for Stripe
const createPaymentIntent = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;

    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ 
        success: false, 
        message: 'Payment service is not configured. Please contact support.' 
      });
    }

    // Validate order exists and belongs to user
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to access this order' 
      });
    }

    // Check if order is already paid
    if (order.isPaid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order is already paid' 
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        customerId: order.user._id.toString()
      },
      description: `Payment for order ${order._id}`
    });

    // Create payment record
    const payment = new Payment({
      order: order._id,
      customer: order.user._id,
      amount: order.totalPrice,
      currency: 'usd',
      paymentMethod: paymentMethod || 'stripe',
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
      description: `Payment for order ${order._id}`
    });

    await payment.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'create_payment_intent',
      description: `Created payment intent for order ${order._id}`,
      ipAddress: req.ip
    });

    logger.info(`Payment intent created for order ${order._id}`, {
      orderId: order._id,
      customerId: order.user._id,
      amount: order.totalPrice,
      paymentIntentId: paymentIntent.id
    });

    res.json({
      success: true,
      message: 'Payment intent created successfully',
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: order.totalPrice,
        currency: 'usd'
      }
    });

  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating payment intent',
      error: error.message 
    });
  }
};

// Confirm payment (webhook or manual confirmation)
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ 
        success: false, 
        message: 'Payment service is not configured. Please contact support.' 
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment intent not found' 
      });
    }

    // Find payment record
    const payment = await Payment.findOne({ 
      stripePaymentIntentId: paymentIntentId 
    }).populate('order');

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment record not found' 
      });
    }

    // Update payment status based on Stripe status
    if (paymentIntent.status === 'succeeded') {
      payment.status = 'succeeded';
      payment.stripeChargeId = paymentIntent.latest_charge;
      payment.receiptUrl = paymentIntent.latest_charge ? 
        `https://dashboard.stripe.com/payments/${paymentIntent.latest_charge}` : null;

      // Update order status
      const order = await Order.findById(payment.order._id);
      order.isPaid = true;
      order.paidAt = new Date();
      order.paymentResult = {
        id: paymentIntent.id,
        status: 'succeeded',
        update_time: new Date().toISOString(),
        email_address: payment.order.user?.email
      };
      await order.save();

      // Log activity
      await ActivityLog.create({
        user: payment.customer,
        action: 'payment_succeeded',
        description: `Payment succeeded for order ${payment.order._id}`,
        ipAddress: req.ip
      });

      logger.info(`Payment succeeded for order ${payment.order._id}`, {
        orderId: payment.order._id,
        paymentIntentId,
        amount: payment.amount
      });

    } else if (paymentIntent.status === 'canceled') {
      payment.status = 'cancelled';
      
      await ActivityLog.create({
        user: payment.customer,
        action: 'payment_cancelled',
        description: `Payment cancelled for order ${payment.order._id}`,
        ipAddress: req.ip
      });

    } else if (paymentIntent.status === 'requires_payment_method') {
      payment.status = 'failed';
      payment.errorMessage = 'Payment method required';
      
      await ActivityLog.create({
        user: payment.customer,
        action: 'payment_failed',
        description: `Payment failed for order ${payment.order._id}`,
        ipAddress: req.ip
      });
    }

    await payment.save();

    res.json({
      success: true,
      message: 'Payment status updated',
      data: {
        status: payment.status,
        orderId: payment.order._id,
        amount: payment.amount
      }
    });

  } catch (error) {
    logger.error('Error confirming payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error confirming payment',
      error: error.message 
    });
  }
};

// Process Stripe webhook
const processWebhook = async (req, res) => {
  // Check if Stripe is configured
  if (!stripe) {
    return res.status(503).json({ 
      success: false, 
      message: 'Payment service is not configured' 
    });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Handle successful payment
const handlePaymentSucceeded = async (paymentIntent) => {
  const payment = await Payment.findOne({ 
    stripePaymentIntentId: paymentIntent.id 
  }).populate('order');

  if (payment) {
    payment.status = 'succeeded';
    payment.stripeChargeId = paymentIntent.latest_charge;
    payment.receiptUrl = paymentIntent.latest_charge ? 
      `https://dashboard.stripe.com/payments/${paymentIntent.latest_charge}` : null;
    await payment.save();

    // Update order
    const order = await Order.findById(payment.order._id);
    order.isPaid = true;
    order.paidAt = new Date();
    await order.save();

    logger.info(`Payment succeeded via webhook for order ${payment.order._id}`);
  }
};

// Handle failed payment
const handlePaymentFailed = async (paymentIntent) => {
  const payment = await Payment.findOne({ 
    stripePaymentIntentId: paymentIntent.id 
  });

  if (payment) {
    payment.status = 'failed';
    payment.errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
    await payment.save();

    logger.info(`Payment failed via webhook for order ${payment.order}`);
  }
};

// Handle refund
const handleRefund = async (charge) => {
  const payment = await Payment.findOne({ 
    stripeChargeId: charge.id 
  });

  if (payment) {
    payment.status = 'refunded';
    payment.refundedAmount = charge.amount_refunded / 100; // Convert from cents
    await payment.save();

    logger.info(`Payment refunded via webhook for order ${payment.order}`);
  }
};

// Get payment history for customer
const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({ customer: req.user._id })
      .populate('order', 'orderItems totalPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments({ customer: req.user._id });

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching payment history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching payment history',
      error: error.message 
    });
  }
};

// Get payment statistics (admin only)
const getPaymentStats = async (req, res) => {
  try {
    const stats = await Payment.getStats();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error fetching payment stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching payment statistics',
      error: error.message 
    });
  }
};

// Process refund (admin only)
const processRefund = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;

    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ 
        success: false, 
        message: 'Payment service is not configured. Please contact support.' 
      });
    }

    const payment = await Payment.findById(paymentId).populate('order');
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }

    if (payment.status !== 'succeeded') {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment must be succeeded to refund' 
      });
    }

    // Process refund through Stripe
    const refundAmount = amount || payment.amount;
    const refund = await stripe.refunds.create({
      charge: payment.stripeChargeId,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: reason || 'requested_by_customer'
    });

    // Update payment record
    payment.status = 'refunded';
    payment.refundedAmount = refundAmount;
    payment.refundReason = reason;
    await payment.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'process_refund',
      description: `Refunded ${refundAmount} for payment ${paymentId}`,
      ipAddress: req.ip
    });

    logger.info(`Refund processed for payment ${paymentId}`, {
      paymentId,
      refundAmount,
      reason
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refund.id,
        amount: refundAmount,
        status: refund.status
      }
    });

  } catch (error) {
    logger.error('Error processing refund:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing refund',
      error: error.message 
    });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  processWebhook,
  getPaymentHistory,
  getPaymentStats,
  processRefund
}; 