// server/models/Product.js
const mongoose = require('mongoose');
const { HOMEPAGE_SLOTS } = require('../utils/config');

// Product model: stores product details, category reference, and reviews
// Each product belongs to a category and can have multiple reviews

// Add empty string to allowed slots
const ALLOWED_SLOTS = ['', ...HOMEPAGE_SLOTS];

const reviewSchema = new mongoose.Schema(
  {
    user: {
      
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    name: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    // New placement system for multiple page+slot combinations
    placement: [
      {
        page: {
          type: String,
          required: true,
          enum: ['home', 'products', 'clothing-accessories', 'accessories'],
        },
        slot: {
          type: String,
          required: true,
        }
      }
    ],
    // Legacy field for backward compatibility (will be removed after migration)
    homepageSlot: { type: String, enum: ALLOWED_SLOTS, default: '' },
    visibility: { type: String, enum: ['visible','hidden','archived'], default: 'visible' },
    discountPrice: { type: Number, default: null },
    tags: { type: [String], default: [] },
    reviews: [reviewSchema],
    numReviews: { type: Number, default: 0 },
    rating: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

// Add database indexes for better performance
productSchema.index({ name: 'text', description: 'text' }); // Text search
productSchema.index({ category: 1, price: 1 }); // Category and price filtering
productSchema.index({ 'placement.page': 1, 'placement.slot': 1, visibility: 1 }); // Placement and visibility filtering
productSchema.index({ homepageSlot: 1, visibility: 1 }); // Legacy homepage slot filtering
productSchema.index({ price: 1 }); // Price sorting
productSchema.index({ rating: -1 }); // Rating sorting
productSchema.index({ createdAt: -1 }); // Newest products
productSchema.index({ tags: 1 }); // Tag filtering

module.exports = mongoose.model('Product', productSchema);
