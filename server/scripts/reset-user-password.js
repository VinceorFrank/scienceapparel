const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

async function resetPassword(email, newPassword) {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ No user found with email:', email);
      return;
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();
    console.log(`✅ Password for ${email} has been reset to: ${newPassword}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Usage: node reset-user-password.js <email> <newPassword>
const [,, email, newPassword] = process.argv;
if (!email || !newPassword) {
  console.log('Usage: node reset-user-password.js <email> <newPassword>');
  process.exit(1);
}
resetPassword(email, newPassword); 