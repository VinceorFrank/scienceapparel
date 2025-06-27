// troubleshoot-dashboard.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Category = require('./models/Category');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

async function troubleshoot() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB:', MONGO_URI);

  const userCount = await User.countDocuments();
  const productCount = await Product.countDocuments();
  const orderCount = await Order.countDocuments();
  const categoryCount = await Category.countDocuments();

  console.log('User count:', userCount);
  console.log('Product count:', productCount);
  console.log('Order count:', orderCount);
  console.log('Category count:', categoryCount);

  const sampleUsers = await User.find().limit(2);
  const sampleProducts = await Product.find().limit(2);
  const sampleOrders = await Order.find().limit(2);
  const sampleCategories = await Category.find().limit(2);

  console.log('\nSample Users:', sampleUsers);
  console.log('\nSample Products:', sampleProducts);
  console.log('\nSample Orders:', sampleOrders);
  console.log('\nSample Categories:', sampleCategories);

  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
}

troubleshoot(); 