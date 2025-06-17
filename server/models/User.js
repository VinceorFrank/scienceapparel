const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User model: stores user credentials, roles, and authentication info
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
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false, // Normal users by default
  },
  role: { type: String, enum: ['admin', 'product_manager', 'order_manager', 'support_agent', 'customer'], default: 'customer' },
}, { timestamps: true });

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

module.exports = mongoose.model('User', userSchema);