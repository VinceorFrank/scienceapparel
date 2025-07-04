// test-mongo-connection.js
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/ecommerce')
  .then(() => {
    console.log('✅ Connected to MongoDB!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err);
    process.exit(1);
  }); 