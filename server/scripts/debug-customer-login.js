const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Adjust path if needed

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

async function debugLogin(email, plainPassword) {
  try {
    console.log('🔍 Starting customer login debug...');
    console.log('📧 Email:', email);
    console.log('🔑 Password length:', plainPassword.length);
    console.log('---');

    await mongoose.connect(MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ No user found with email:', email);
      console.log('💡 Check if the email is correct or if the user exists in the database');
      return;
    }

    console.log('✅ User found:', {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      isLocked: user.isLocked,
      lockUntil: user.lockUntil,
      createdAt: user.createdAt,
      // Add more fields as needed
    });

    if (!user.password) {
      console.log('❌ User has no password set.');
      console.log('💡 This might be a user created without a password or with a different auth method');
      return;
    }

    const isHashed = user.password.startsWith('$2');
    console.log('🔐 Password is hashed:', isHashed);

    if (isHashed) {
      const match = await bcrypt.compare(plainPassword, user.password);
      console.log('🔍 Password matches input:', match);
      
      if (!match) {
        console.log('❌ Password verification failed');
        console.log('💡 The password you entered does not match the stored hash');
      } else {
        console.log('✅ Password verification successful!');
      }
    } else {
      console.log('❌ Password is not hashed! This is a security risk.');
      console.log('💡 Stored password:', user.password);
      console.log('💡 Input password:', plainPassword);
      console.log('💡 They match:', user.password === plainPassword);
    }

    // Check account status
    if (user.isLocked || (user.lockUntil && user.lockUntil > Date.now())) {
      console.log('⚠️ User account is locked.');
      if (user.lockUntil) {
        console.log('🔒 Locked until:', new Date(user.lockUntil));
      }
    } else {
      console.log('✅ Account is not locked');
    }

    // Check if user is active
    if (user.status === 'inactive' || user.status === 'suspended') {
      console.log('⚠️ User account is not active. Status:', user.status);
    } else {
      console.log('✅ Account is active');
    }

    console.log('---');
    console.log('📊 Summary:');
    console.log('- User exists:', !!user);
    console.log('- Password set:', !!user.password);
    console.log('- Password hashed:', isHashed);
    console.log('- Password matches:', isHashed ? await bcrypt.compare(plainPassword, user.password) : 'N/A (not hashed)');
    console.log('- Account locked:', user.isLocked || (user.lockUntil && user.lockUntil > Date.now()));
    console.log('- Account active:', user.status === 'active');

  } catch (error) {
    console.error('❌ Error during debug:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Usage: node debug-customer-login.js user@example.com password123
const [,, email, password] = process.argv;
if (!email || !password) {
  console.log('❌ Usage: node debug-customer-login.js <email> <password>');
  console.log('💡 Example: node debug-customer-login.js customer@example.com mypassword123');
  process.exit(1);
}

debugLogin(email, password); 