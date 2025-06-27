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

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
