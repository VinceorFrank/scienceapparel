const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

async function fixUsers() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find({});
  const seen = new Set();
  let removed = 0;
  for (const user of users) {
    // Remove duplicate users (by email, case-insensitive)
    const email = user.email.toLowerCase();
    if (seen.has(email)) {
      await User.deleteOne({ _id: user._id });
      removed++;
      continue;
    }
    seen.add(email);
    // Reset lockout fields
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;
    await user.save();
  }
  console.log(`Removed ${removed} duplicate users and reset lockout fields for all users.`);
  await mongoose.disconnect();
}

fixUsers().catch(err => {
  console.error('Error fixing users:', err);
  process.exit(1);
}); 