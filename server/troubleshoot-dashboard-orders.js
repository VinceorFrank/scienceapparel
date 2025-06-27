require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB:', MONGO_URI);

  // Run the same aggregation as the dashboard (no $match)
  const result = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
        averageOrderValue: { $avg: '$totalPrice' },
        paidOrders: { $sum: { $cond: ['$isPaid', 1, 0] } },
        shippedOrders: { $sum: { $cond: ['$isShipped', 1, 0] } },
        pendingOrders: { $sum: { $cond: [{ $eq: ['$isShipped', false] }, 1, 0] } }
      }
    }
  ]);

  console.log('Order dashboard aggregation result:', result);

  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
}

run(); 