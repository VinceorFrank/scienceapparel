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

module.exports = mongoose.model('Product', productSchema);
