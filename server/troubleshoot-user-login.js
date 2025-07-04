// troubleshoot-user-login.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Adjusted path for server directory

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node troubleshoot-user-login.js <email> <password>');
  process.exit(1);
}

async function main() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ecommerce');

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found in database.');
      process.exit(1);
    }

    console.log('✅ User found:', user.email);

    if (!user.password.startsWith('$2b$')) {
      console.log('❌ Password is not hashed. User cannot log in.');
      process.exit(1);
    } else {
      console.log('✅ Password is hashed.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Password does not match.');
      process.exit(1);
    } else {
      console.log('✅ Password matches.');
    }

    if (user.status && user.status !== 'active') {
      console.log(`❌ User status is ${user.status}. Should be 'active'.`);
      process.exit(1);
    } else {
      console.log('✅ User status is active.');
    }

    console.log('🎉 All checks passed. User should be able to log in.');
    process.exit(0);
  } catch (err) {
    console.error('Error during troubleshooting:', err);
    process.exit(1);
  }
}

main(); 