const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

async function listAllUsers() {
  try {
    console.log('🔍 Checking all users in database...');
    console.log('---');

    await mongoose.connect(MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('✅ Connected to MongoDB');

    const users = await User.find({});
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('💡 The database is empty. You need to seed it with data.');
      console.log('💡 Run: node seed.js');
    } else {
      console.log(`✅ Found ${users.length} user(s):`);
      console.log('---');
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Has Password: ${!!user.password}`);
        console.log(`   Password Hashed: ${user.password ? user.password.startsWith('$2') : 'N/A'}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('---');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

listAllUsers(); 