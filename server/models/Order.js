const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },

    // ✅ REVIEW TOKEN for verified review access
    reviewToken: {
      type: String,
      default: null,
    },

    // 🚚 NEW SHIPPING FIELDS
    shipping: {
      // Selected shipping option
      selectedCarrier: { type: String, default: null },
      selectedService: { type: String, default: null },
      boxTier: { type: String, default: null }, // Small, Medium, Large, XL
      
      // Delivery estimates
      estimatedDeliveryDate: { type: Date, default: null },
      estimatedDays: { type: Number, default: null },
      
      // Tracking information
      trackingNumber: { type: String, default: null },
      trackingUrl: { type: String, default: null },
      
      // Shipping status
      status: { 
        type: String, 
        enum: ['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'failed'],
        default: 'pending'
      },
      shippedAt: { type: Date, default: null },
      
      // Package details
      packageWeight: { type: Number, default: null }, // in kg
      packageDimensions: {
        length: { type: Number, default: null },
        width: { type: Number, default: null },
        height: { type: Number, default: null }
      },
      
      // Shipping cost breakdown
      baseRate: { type: Number, default: null },
      markupAmount: { type: Number, default: null },
      finalRate: { type: Number, default: null },
      
      // Admin notes
      adminNotes: { type: String, default: null },
      
      // Shipping label
      labelGenerated: { type: Boolean, default: false },
      labelUrl: { type: String, default: null }
    },

    // Order status (enhanced)
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending'
    },

    // Cancellation fields
    cancellationReason: {
      type: String,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

// Add database indexes for better performance
orderSchema.index({ user: 1, createdAt: -1 }); // User's orders
orderSchema.index({ isPaid: 1, isDelivered: 1 }); // Order status
orderSchema.index({ createdAt: -1 }); // Recent orders
orderSchema.index({ totalPrice: -1 }); // High value orders
orderSchema.index({ 'shippingAddress.country': 1 }); // Geographic queries
orderSchema.index({ 'shipping.status': 1 }); // Shipping status
orderSchema.index({ 'shipping.selectedCarrier': 1 }); // Carrier queries
orderSchema.index({ 'shipping.trackingNumber': 1 }); // Tracking queries

// Virtual for shipping status display
orderSchema.virtual('shippingStatusDisplay').get(function() {
  if (!this.shipping.status) return 'Not shipped';
  
  const statusMap = {
    'pending': 'Pending',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'in_transit': 'In Transit',
    'delivered': 'Delivered',
    'failed': 'Failed'
  };
  
  return statusMap[this.shipping.status] || this.shipping.status;
});

// Method to update shipping status
orderSchema.methods.updateShippingStatus = function(status, trackingNumber = null) {
  this.shipping.status = status;
  
  if (status === 'shipped') {
    this.shipping.shippedAt = new Date();
  }
  
  if (trackingNumber) {
    this.shipping.trackingNumber = trackingNumber;
  }
  
  return this.save();
};

// Method to calculate shipping metrics
orderSchema.methods.getShippingMetrics = function() {
  const { totalWeight, totalItems } = this.orderItems.reduce((acc, item) => {
    acc.totalWeight += (item.qty * 0.2); // Estimate 200g per item
    acc.totalItems += item.qty;
    return acc;
  }, { totalWeight: 0, totalItems: 0 });

  return {
    totalWeight: parseFloat(totalWeight.toFixed(2)),
    totalItems,
    boxTier: this.shipping.boxTier,
    carrier: this.shipping.selectedCarrier,
    estimatedDelivery: this.shipping.estimatedDeliveryDate
  };
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
