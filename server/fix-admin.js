require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  try {
    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found. Creating new admin...');
      // Create new admin
      const newAdmin = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin123!',
        isAdmin: true,
        role: 'admin'
      });
      await newAdmin.save();
      console.log('✅ New admin user created!');
    } else {
      console.log('Found existing admin:', {
        id: adminUser._id,
        email: adminUser.email,
        isAdmin: adminUser.isAdmin,
        role: adminUser.role
      });
      
      // Update admin privileges
      adminUser.isAdmin = true;
      adminUser.role = 'admin';
      adminUser.password = 'Admin123!'; // This will be hashed automatically
      await adminUser.save();
      
      console.log('✅ Admin user updated with proper privileges');
    }
    
    console.log('📧 Admin email: admin@example.com');
    console.log('🔑 Admin password: Admin123!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
}); 