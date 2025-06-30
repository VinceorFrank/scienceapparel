const mongoose = require('mongoose');

// Box tier schema for different package sizes
const boxTierSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Small, Medium, Large, XL
  maxItems: { type: Number, required: true },
  dimensions: {
    length: { type: Number, required: true }, // cm
    width: { type: Number, required: true },  // cm
    height: { type: Number, required: true }  // cm
  },
  weightEstimate: { type: Number, required: true }, // kg
  description: { type: String, default: '' }
});

// Carrier configuration schema
const carrierSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Canada Post, UPS, Purolator, FedEx
  enabled: { type: Boolean, default: true },
  apiKey: { type: String, default: '' },
  apiSecret: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  markupPercentage: { type: Number, default: 0, min: 0, max: 100 },
  delayDays: { type: Number, default: 0, min: 0 },
  priority: { type: Number, default: 0 }, // Display order
  description: { type: String, default: '' }
});

const shippingSettingsSchema = new mongoose.Schema({
  // Box tier configurations
  boxTiers: {
    type: [boxTierSchema],
    default: [
      {
        name: 'Small',
        maxItems: 1,
        dimensions: { length: 25, width: 20, height: 2 },
        weightEstimate: 0.3,
        description: 'Perfect for single items'
      },
      {
        name: 'Medium',
        maxItems: 10,
        dimensions: { length: 35, width: 25, height: 10 },
        weightEstimate: 2.5,
        description: 'Ideal for 2-10 items'
      },
      {
        name: 'Large',
        maxItems: 20,
        dimensions: { length: 45, width: 35, height: 15 },
        weightEstimate: 4.5,
        description: 'Suitable for 11-20 items'
      },
      {
        name: 'XL',
        maxItems: 35,
        dimensions: { length: 55, width: 45, height: 20 },
        weightEstimate: 7.5,
        description: 'For large orders (21-35 items)'
      }
    ]
  },

  // Carrier configurations
  carriers: {
    type: [carrierSchema],
    default: [
      {
        name: 'Canada Post',
        enabled: true,
        markupPercentage: 10,
        delayDays: 1,
        priority: 1,
        description: 'Reliable domestic shipping'
      },
      {
        name: 'UPS',
        enabled: true,
        markupPercentage: 15,
        delayDays: 0,
        priority: 2,
        description: 'Fast international shipping'
      },
      {
        name: 'Purolator',
        enabled: true,
        markupPercentage: 12,
        delayDays: 1,
        priority: 3,
        description: 'Express delivery options'
      },
      {
        name: 'FedEx',
        enabled: false,
        markupPercentage: 20,
        delayDays: 0,
        priority: 4,
        description: 'Premium shipping service'
      }
    ]
  },

  // Global shipping settings
  defaultMarkupPercentage: { type: Number, default: 10, min: 0, max: 100 },
  defaultDelayDays: { type: Number, default: 1, min: 0 },
  currency: { type: String, default: 'CAD' },
  weightUnit: { type: String, default: 'kg', enum: ['kg', 'lbs'] },
  dimensionUnit: { type: String, default: 'cm', enum: ['cm', 'in'] },

  // Fallback rates (when live API is unavailable)
  fallbackRates: {
    domestic: { type: Number, default: 12.99 },
    international: { type: Number, default: 29.99 },
    express: { type: Number, default: 24.99 }
  }
}, {
  timestamps: true
});

// Add database indexes
shippingSettingsSchema.index({ 'carriers.name': 1 });
shippingSettingsSchema.index({ 'boxTiers.name': 1 });

// Static method to get or create default settings
shippingSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

// Method to get box tier based on item count
shippingSettingsSchema.methods.getBoxTier = function(itemCount) {
  return this.boxTiers.find(tier => itemCount <= tier.maxItems) || this.boxTiers[this.boxTiers.length - 1];
};

// Method to get enabled carriers
shippingSettingsSchema.methods.getEnabledCarriers = function() {
  return this.carriers.filter(carrier => carrier.enabled).sort((a, b) => a.priority - b.priority);
};

const ShippingSettings = mongoose.model('ShippingSettings', shippingSettingsSchema);

module.exports = ShippingSettings; 