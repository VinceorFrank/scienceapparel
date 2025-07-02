const mongoose = require('mongoose');

// Cart item schema
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Cart schema
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Cart expires after 30 days of inactivity
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      return expiryDate;
    }
  }
}, { 
  timestamps: true 
});

// Add database indexes for better performance
cartSchema.index({ user: 1 }); // User cart queries
cartSchema.index({ expiresAt: 1 }); // Expired cart cleanup
cartSchema.index({ updatedAt: -1 }); // Recent activity

// Virtual for cart total
cartSchema.virtual('total').get(function() {
  return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// Virtual for item count
cartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for unique product count
cartSchema.virtual('uniqueItemCount').get(function() {
  return this.items.length;
});

// Method to add item to cart
cartSchema.methods.addItem = function(productId, quantity = 1, price) {
  const existingItemIndex = this.items.findIndex(
    item => item.product.toString() === productId.toString()
  );

  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex].quantity += quantity;
    if (price) this.items[existingItemIndex].price = price;
    this.items[existingItemIndex].addedAt = new Date();
  } else {
    // Add new item
    this.items.push({
      product: productId,
      quantity: quantity,
      price: price
    });
  }

  this.updatedAt = new Date();
  this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, quantity) {
  const itemIndex = this.items.findIndex(
    item => item.product.toString() === productId.toString()
  );

  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    this.items.splice(itemIndex, 1);
  } else {
    // Update quantity
    this.items[itemIndex].quantity = quantity;
    this.items[itemIndex].addedAt = new Date();
  }

  this.updatedAt = new Date();
  this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId) {
  const itemIndex = this.items.findIndex(
    item => item.product.toString() === productId.toString()
  );

  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }

  this.items.splice(itemIndex, 1);
  this.updatedAt = new Date();
  
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.updatedAt = new Date();
  return this.save();
};

// Method to get cart with populated product details
cartSchema.methods.getPopulatedCart = function() {
  return this.populate({
    path: 'items.product',
    select: 'name price image stock category',
    populate: { path: 'category', select: 'name' }
  });
};

// Method to validate cart items (check stock, prices, etc.)
cartSchema.methods.validateCart = async function() {
  const Product = require('./Product');
  const validationResults = {
    isValid: true,
    errors: [],
    warnings: []
  };

  for (const item of this.items) {
    try {
      const product = await Product.findById(item.product);
      
      if (!product) {
        validationResults.errors.push(`Product ${item.product} no longer exists`);
        validationResults.isValid = false;
        continue;
      }

      // Check stock
      if (product.stock < item.quantity) {
        validationResults.errors.push(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
        validationResults.isValid = false;
      } else if (product.stock < item.quantity + 2) { // Warning if stock is low
        validationResults.warnings.push(`Low stock for ${product.name}. Only ${product.stock} remaining`);
      }

      // Check price
      if (product.price !== item.price) {
        validationResults.warnings.push(`Price changed for ${product.name}. Old: $${item.price}, New: $${product.price}`);
        // Update price
        item.price = product.price;
      }

      // Check if product is archived
      if (product.archived) {
        validationResults.errors.push(`Product ${product.name} is no longer available`);
        validationResults.isValid = false;
      }

    } catch (error) {
      validationResults.errors.push(`Error validating product ${item.product}: ${error.message}`);
      validationResults.isValid = false;
    }
  }

  if (validationResults.errors.length > 0 || validationResults.warnings.length > 0) {
    await this.save(); // Save any price updates
  }

  return validationResults;
};

// Static method to get or create cart for user
cartSchema.statics.getOrCreateCart = async function(userId) {
  let cart = await this.findOne({ user: userId });
  
  if (!cart) {
    cart = new this({ user: userId });
    await cart.save();
  }
  
  return cart;
};

// Static method to clean up expired carts
cartSchema.statics.cleanupExpiredCarts = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  
  return result.deletedCount;
};

// Pre-save middleware to update timestamps
cartSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart; 