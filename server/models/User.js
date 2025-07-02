const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Address schema for shipping and billing addresses
const addressSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['shipping', 'billing'], 
    required: true 
  },
  isDefault: { 
    type: Boolean, 
    default: false 
  },
  firstName: { 
    type: String, 
    required: true 
  },
  lastName: { 
    type: String, 
    required: true 
  },
  address: { 
    type: String, 
    required: true 
  },
  city: { 
    type: String, 
    required: true 
  },
  state: { 
    type: String, 
    required: true 
  },
  postalCode: { 
    type: String, 
    required: true 
  },
  country: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String 
  },
  company: { 
    type: String 
  }
}, { timestamps: true });

// User model: stores user credentials, roles, authentication info, and e-commerce data
// Passwords are hashed before saving for security
// Never return the password field in API responses!
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  isAdmin: {
    type: Boolean,
    default: false, // Normal users by default
  },
  role: { 
    type: String, 
    enum: ['admin', 'product_manager', 'order_manager', 'support_agent', 'customer'], 
    default: 'customer' 
  },
  
  // 🏠 Address Management
  addresses: [addressSchema],
  
  // ⚙️ User Preferences
  preferences: {
    newsletter: { 
      type: Boolean, 
      default: true 
    },
    marketing: { 
      type: Boolean, 
      default: false 
    },
    language: { 
      type: String, 
      default: 'en' 
    },
    currency: { 
      type: String, 
      default: 'CAD' 
    },
    timezone: { 
      type: String, 
      default: 'America/Toronto' 
    }
  },
  
  // 📊 Account Statistics
  stats: {
    totalOrders: { 
      type: Number, 
      default: 0 
    },
    totalSpent: { 
      type: Number, 
      default: 0 
    },
    lastOrderDate: { 
      type: Date 
    },
    loginCount: { 
      type: Number, 
      default: 0 
    },
    lastLogin: { 
      type: Date 
    }
  },
  
  // 🔒 Account Status
  status: { 
    type: String, 
    enum: ['active', 'suspended', 'pending_verification'], 
    default: 'active' 
  },
  statusReason: { 
    type: String 
  },
  emailVerified: { 
    type: Boolean, 
    default: false 
  },
  emailVerificationToken: { 
    type: String 
  },
  emailVerificationExpires: { 
    type: Date 
  },
  
  // 🔄 Password Reset
  passwordResetToken: { 
    type: String 
  },
  passwordResetExpires: { 
    type: Date 
  }
  
}, { timestamps: true });

// Add database indexes for better performance
userSchema.index({ isAdmin: 1 }); // Admin queries
userSchema.index({ role: 1 }); // Role-based queries
userSchema.index({ createdAt: -1 }); // New users
userSchema.index({ email: 1 }); // Email queries
userSchema.index({ status: 1 }); // Status queries
userSchema.index({ 'stats.totalOrders': -1 }); // Top customers
userSchema.index({ 'stats.totalSpent': -1 }); // High value customers

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get default address by type
userSchema.methods.getDefaultAddress = function(type) {
  return this.addresses.find(addr => addr.type === type && addr.isDefault) || 
         this.addresses.find(addr => addr.type === type) || 
         null;
};

// Method to add new address
userSchema.methods.addAddress = function(addressData) {
  // If this is the first address of this type, make it default
  const existingAddressesOfType = this.addresses.filter(addr => addr.type === addressData.type);
  if (existingAddressesOfType.length === 0) {
    addressData.isDefault = true;
  }
  
  // If setting as default, unset other defaults of same type
  if (addressData.isDefault) {
    this.addresses.forEach(addr => {
      if (addr.type === addressData.type) {
        addr.isDefault = false;
      }
    });
  }
  
  this.addresses.push(addressData);
  return this.save();
};

// Method to update address
userSchema.methods.updateAddress = function(addressId, updateData) {
  const addressIndex = this.addresses.findIndex(addr => addr._id.toString() === addressId);
  if (addressIndex === -1) {
    throw new Error('Address not found');
  }
  
  // If setting as default, unset other defaults of same type
  if (updateData.isDefault) {
    this.addresses.forEach(addr => {
      if (addr.type === this.addresses[addressIndex].type) {
        addr.isDefault = false;
      }
    });
  }
  
  Object.assign(this.addresses[addressIndex], updateData);
  return this.save();
};

// Method to delete address
userSchema.methods.deleteAddress = function(addressId) {
  const addressIndex = this.addresses.findIndex(addr => addr._id.toString() === addressId);
  if (addressIndex === -1) {
    throw new Error('Address not found');
  }
  
  const addressToDelete = this.addresses[addressIndex];
  this.addresses.splice(addressIndex, 1);
  
  // If we deleted the default address, make another one default
  if (addressToDelete.isDefault) {
    const remainingAddressesOfType = this.addresses.filter(addr => addr.type === addressToDelete.type);
    if (remainingAddressesOfType.length > 0) {
      remainingAddressesOfType[0].isDefault = true;
    }
  }
  
  return this.save();
};

// Method to update user stats
userSchema.methods.updateStats = function(orderData) {
  this.stats.totalOrders += 1;
  this.stats.totalSpent += orderData.totalPrice || 0;
  this.stats.lastOrderDate = new Date();
  return this.save();
};

// Method to update login stats
userSchema.methods.updateLoginStats = function() {
  this.stats.loginCount += 1;
  this.stats.lastLogin = new Date();
  return this.save();
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  return this.name || this.email.split('@')[0];
});

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    status: this.status,
    stats: this.stats,
    preferences: this.preferences,
    addresses: this.addresses,
    createdAt: this.createdAt,
    lastLogin: this.stats.lastLogin
  };
};

module.exports = mongoose.model('User', userSchema);