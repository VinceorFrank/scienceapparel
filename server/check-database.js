require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

const checkDatabase = async () => {
  try {
    console.log('🔍 Checking database content...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check all users
    const users = await User.find({}).select('-password');
    console.log('\n📊 Users in database:');
    console.log(`Total users: ${users.length}`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}, Admin: ${user.isAdmin}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    // Check specific admin user
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log(`   Name: ${adminUser.name}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Is Admin: ${adminUser.isAdmin}`);
      console.log(`   Password hash exists: ${!!adminUser.password}`);
    } else {
      console.log('❌ Admin user NOT found!');
    }

    // Test password matching
    if (adminUser) {
      console.log('\n🔐 Testing password matching...');
      
      // Test with 'password123' (from seed file)
      const testPassword123 = await adminUser.matchPassword('password123');
      console.log(`   'password123' matches: ${testPassword123}`);
      
      // Test with 'Admin123!' (from test script)
      const testAdmin123 = await adminUser.matchPassword('Admin123!');
      console.log(`   'Admin123!' matches: ${testAdmin123}`);
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

checkDatabase(); 