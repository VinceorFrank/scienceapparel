const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${config.MONGO_URI}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB; 