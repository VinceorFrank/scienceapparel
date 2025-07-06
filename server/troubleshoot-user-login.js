// troubleshoot-user-login.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Hardcode the MongoDB URI to match your backend
const MONGO_URI = 'mongodb://localhost:27017/ecommerce';

async function troubleshootLogin(email, password) {
  try {
    console.log('Connecting to MongoDB at', MONGO_URI);
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    console.log('Looking up user:', email);
    const user = await User.findOne({ email });
    console.log('User lookup result:', user);
    if (!user) {
      console.log('❌ No user found with email:', email);
      return;
    }
    console.log('User found:', user.email, '| status:', user.status, '| isAdmin:', user.isAdmin, '| role:', user.role);
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      console.log('✅ Password is correct! Login would succeed.');
    } else {
      console.log('❌ Password is incorrect! Login would fail.');
    }
  } catch (err) {
    console.error('Error during troubleshooting:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Usage: node troubleshoot-user-login.js <email> <password>
const [,, email, password] = process.argv;
if (!email || !password) {
  console.log('Usage: node troubleshoot-user-login.js <email> <password>');
  process.exit(1);
}
troubleshootLogin(email, password); 