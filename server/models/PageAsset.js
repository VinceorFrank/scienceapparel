const mongoose = require('mongoose');

/**
 * PageAsset schema for storing page-specific images/assets.
 * Used for dynamic backgrounds, hero images, etc.
 */
const PageAssetSchema = new mongoose.Schema(
  {
    // Slug of the page this asset belongs to (e.g., "home", "about")
    pageSlug: { type: String, required: true, trim: true },
    // Slot/section on the page (e.g., "hero", "infoA")
    slot:     { type: String, required: true, trim: true },
    // Image URL (relative to /uploads)
    imageUrl: { type: String, required: true },
    // Overlay opacity (0–1, pastel overlay)
    overlay:  { 
      type: Number, 
      default: 0.2, 
      min: 0, 
      max: 1,
      validate: {
        validator: v => v >= 0 && v <= 1,
        message: 'Overlay must be between 0 and 1'
      }
    },
    // Alt text for accessibility
    alt:      { type: String, default: '', trim: true, maxlength: 200 },
    // Optional: Related products for this asset
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    // User who last updated this asset
    updatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Compound index for fast upsert
PageAssetSchema.index({ pageSlug: 1, slot: 1 }, { unique: true });

module.exports = mongoose.model('PageAsset', PageAssetSchema); 