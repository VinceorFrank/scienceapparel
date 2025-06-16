const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// Helper function to get date range
const getDateRange = (days) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
};

// @desc    Get all dashboard metrics
// @route   GET /api/admin/dashboard/metrics
// @access  Private/Admin
router.get('/metrics', protect, admin, async (req, res) => {
  try {
    // Get date ranges
    const today = getDateRange(1);
    const lastWeek = getDateRange(7);
    const lastMonth = getDateRange(30);

    // Get total sales
    const totalSales = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    // Get total orders
    const totalOrders = await Order.countDocuments();

    // Get active users (users who made orders in last 30 days)
    const activeUsers = await Order.distinct('user', {
      createdAt: { $gte: lastMonth.start }
    });

    // Get pending orders
    const pendingOrders = await Order.countDocuments({ isPaid: false });

    // Get low stock items (less than 10 items)
    const lowStockItems = await Product.countDocuments({ countInStock: { $lt: 10 } });

    // Get recent registrations (last 7 days)
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: lastWeek.start }
    });

    // Calculate average order value
    const averageOrderValue = totalSales[0]?.total / totalOrders || 0;

    // Get return rate (orders with status 'returned')
    const returnedOrders = await Order.countDocuments({ status: 'returned' });
    const returnRate = (returnedOrders / totalOrders) * 100 || 0;

    res.json({
      totalSales: totalSales[0]?.total || 0,
      totalOrders,
      activeUsers: activeUsers.length,
      pendingOrders,
      lowStockItems,
      recentRegistrations,
      averageOrderValue,
      returnRate
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get sales metrics
// @route   GET /api/admin/dashboard/sales
// @access  Private/Admin
router.get('/sales', protect, admin, async (req, res) => {
  try {
    const lastWeek = getDateRange(7);
    const lastMonth = getDateRange(30);

    // Get daily sales for the last week
    const dailySales = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: lastWeek.start }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$totalPrice' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get monthly sales for the last month
    const monthlySales = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: lastMonth.start }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$totalPrice' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      dailySales,
      monthlySales
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get recent orders
// @route   GET /api/admin/dashboard/recent-orders
// @access  Private/Admin
router.get('/recent-orders', protect, admin, async (req, res) => {
  try {
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name price');

    res.json(recentOrders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get stock alerts
// @route   GET /api/admin/dashboard/stock-alerts
// @access  Private/Admin
router.get('/stock-alerts', protect, admin, async (req, res) => {
  try {
    const lowStockProducts = await Product.find({ countInStock: { $lt: 10 } })
      .select('name countInStock price')
      .sort({ countInStock: 1 });

    res.json(lowStockProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get customer activity
// @route   GET /api/admin/dashboard/customer-activity
// @access  Private/Admin
router.get('/customer-activity', protect, admin, async (req, res) => {
  try {
    const lastWeek = getDateRange(7);

    // Get new customers
    const newCustomers = await User.countDocuments({
      createdAt: { $gte: lastWeek.start }
    });

    // Get active customers (made orders in last week)
    const activeCustomers = await Order.distinct('user', {
      createdAt: { $gte: lastWeek.start }
    });

    // Get customer orders
    const customerOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: lastWeek.start }
        }
      },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $project: {
          name: '$userDetails.name',
          email: '$userDetails.email',
          orderCount: 1,
          totalSpent: 1
        }
      }
    ]);

    res.json({
      newCustomers,
      activeCustomers: activeCustomers.length,
      customerOrders
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 