// server/models/Product.js
const mongoose = require('mongoose');

// Product model: stores product details, category reference, and reviews
// Each product belongs to a category and can have multiple reviews

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
    featured: { type: Boolean, default: false },       // ✅ promote product
    archived: { type: Boolean, default: false },       // ✅ hide product from frontend
    discountPrice: { type: Number, default: null },    // ✅ for sales tracking
    tags: { type: [String], default: [] },             // ✅ useful for filters





    
    // New review fields
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
productSchema.index({ featured: 1, archived: 1 }); // Featured products
productSchema.index({ price: 1 }); // Price sorting
productSchema.index({ rating: -1 }); // Rating sorting
productSchema.index({ createdAt: -1 }); // Newest products
productSchema.index({ tags: 1 }); // Tag filtering

module.exports = mongoose.model('Product', productSchema);
