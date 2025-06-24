require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

const fixAdminPassword = async () => {
  try {
    console.log('🔧 Fixing admin password...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }

    console.log('✅ Admin user found, updating password...');
    
    // Set a new password that will be hashed by the pre-save hook
    adminUser.password = 'password123';
    await adminUser.save();
    
    console.log('✅ Admin password updated successfully!');
    
    // Test the password
    const isMatch = await adminUser.matchPassword('password123');
    console.log(`🔐 Password test: 'password123' matches = ${isMatch}`);
    
    if (isMatch) {
      console.log('🎉 SUCCESS: Admin login should now work!');
      console.log('\n📋 Login Credentials:');
      console.log('   Email: admin@example.com');
      console.log('   Password: password123');
    } else {
      console.log('❌ Password still not working!');
    }

  } catch (error) {
    console.error('❌ Error fixing admin password:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

fixAdminPassword(); 