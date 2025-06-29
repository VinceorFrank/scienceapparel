const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Order reference
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  
  // Customer information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Payment details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    required: true,
    default: 'usd',
    uppercase: true
  },
  
  paymentMethod: {
    type: String,
    required: true,
    enum: ['stripe', 'paypal', 'credit_card', 'bank_transfer', 'cash_on_delivery']
  },
  
  // Payment status
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  
  // Stripe-specific fields
  stripePaymentIntentId: String,
  stripeChargeId: String,
  stripeCustomerId: String,
  
  // PayPal-specific fields
  paypalPaymentId: String,
  paypalOrderId: String,
  
  // Payment metadata
  description: String,
  receiptUrl: String,
  
  // Error information
  errorCode: String,
  errorMessage: String,
  
  // Refund information
  refundedAmount: {
    type: Number,
    default: 0
  },
  
  refundReason: String,
  
  // Timestamps
  processedAt: Date,
  failedAt: Date,
  refundedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ order: 1 });
paymentSchema.index({ customer: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ paypalPaymentId: 1 });

// Virtual for payment age
paymentSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Static method to get payment statistics
paymentSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
  
  const methodStats = await this.aggregate([
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
  
  const totalPayments = await this.countDocuments({ status: 'succeeded' });
  const totalAmount = await this.aggregate([
    { $match: { status: 'succeeded' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  return {
    byStatus: stats,
    byMethod: methodStats,
    totalPayments,
    totalAmount: totalAmount[0]?.total || 0
  };
};

// Pre-save middleware to update timestamps
paymentSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'succeeded' && !this.processedAt) {
      this.processedAt = new Date();
    } else if (this.status === 'failed' && !this.failedAt) {
      this.failedAt = new Date();
    } else if (this.status === 'refunded' && !this.refundedAt) {
      this.refundedAt = new Date();
    }
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema); 