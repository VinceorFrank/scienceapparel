require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB:', MONGO_URI);

  // Aggregation with { createdAt: {} }
  const withEmptyMatch = await Order.aggregate([
    { $match: { createdAt: {} } },
    { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$totalPrice' } } }
  ]);

  // Aggregation with no $match (all documents)
  const withNoMatch = await Order.aggregate([
    { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$totalPrice' } } }
  ]);

  console.log('\nWith $match: { createdAt: {} }:', withEmptyMatch);
  console.log('\nWith no $match:', withNoMatch);

  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
}

run(); 