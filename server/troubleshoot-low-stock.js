// troubleshoot-low-stock.js
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB:', MONGO_URI);

  const lowStockProducts = await Product.find({ stock: { $lte: 10 } });

  console.log('Low Stock Products:', lowStockProducts);

  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
}

run(); 