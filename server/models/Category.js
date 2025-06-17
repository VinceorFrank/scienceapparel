const mongoose = require('mongoose');

// Category model: stores product category names and descriptions
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema); 