require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  checkAdminUsers();
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function checkAdminUsers() {
  try {
    // Find all admin users
    const adminUsers = await User.find({ isAdmin: true }).select('-password');
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in database');
      console.log('💡 Run: node create-admin.js to create an admin user');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. Admin User:`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Name: ${user.name}`);
        console.log(`   🏷️  Role: ${user.role}`);
        console.log(`   📅 Created: ${user.createdAt}`);
      });
    }
    
    // Also show all users for reference
    const allUsers = await User.find({}).select('-password');
    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking admin users:', error);
    process.exit(1);
  }
} 