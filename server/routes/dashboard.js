const express = require('express');
const router = express.Router();
const { requireAuth: protect, admin } = require('../middlewares/auth');
const { parsePaginationParams, executePaginatedQuery, createPaginatedResponse } = require('../utils/pagination');
const ActivityLog = require('../models/ActivityLog');

// GET /api/dashboard/overview - Get comprehensive dashboard overview (admin only)
router.get('/overview', protect, admin, async (req, res, next) => {
  try {
    const { period } = req.query;
    
    let dateFilter = {};
    if (period) {
      const now = new Date();
      switch (period) {
        case '7d':
          dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
          break;
        case '30d':
          dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
          break;
        case '90d':
          dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
          break;
        case '1y':
          dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
          break;
        default:
          dateFilter = {};
      }
    }

    // Import models
    const User = require('../models/User');
    const Product = require('../models/Product');
    const Order = require('../models/Order');
    const Category = require('../models/Category');
    const Support = require('../models/Support');
    const NewsletterSubscriber = require('../models/NewsletterSubscriber');

    // Build aggregation match stages
    const userMatch = period ? [{ $match: { createdAt: dateFilter } }] : [];
    const productMatch = period ? [{ $match: { createdAt: dateFilter } }] : [];
    const orderMatch = period ? [{ $match: { createdAt: dateFilter } }] : [];
    const supportMatch = period ? [{ $match: { createdAt: dateFilter } }] : [];
    const newsletterMatch = period ? [{ $match: { subscribedAt: dateFilter } }] : [];

    // Get all metrics in parallel
    const [
      userStats,
      productStats,
      orderStats,
      categoryStats,
      supportStats,
      newsletterStats,
      recentActivity
    ] = await Promise.all([
      // User statistics
      User.aggregate([
        ...userMatch,
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            suspendedUsers: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
            adminUsers: { $sum: { $cond: ['$isAdmin', 1, 0] } }
          }
        }
      ]),

      // Product statistics
      Product.aggregate([
        ...productMatch,
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            activeProducts: { $sum: { $cond: [{ $eq: ['$archived', false] }, 1, 0] } },
            featuredProducts: { $sum: { $cond: ['$featured', 1, 0] } },
            lowStockProducts: { $sum: { $cond: [{ $lte: ['$stock', 10] }, 1, 0] } },
            outOfStockProducts: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } }
          }
        }
      ]),

      // Order statistics
      Order.aggregate([
        ...orderMatch,
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
      ]),

      // Category statistics (no date filter)
      Category.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'category',
            as: 'products'
          }
        },
        {
          $group: {
            _id: null,
            totalCategories: { $sum: 1 },
            activeCategories: { $sum: { $cond: ['$active', 1, 0] } },
            featuredCategories: { $sum: { $cond: ['$featured', 1, 0] } },
            avgProductsPerCategory: { $avg: { $size: '$products' } }
          }
        }
      ]),

      // Support statistics
      Support.aggregate([
        ...supportMatch,
        {
          $group: {
            _id: null,
            totalTickets: { $sum: 1 },
            openTickets: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
            resolvedTickets: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
            highPriorityTickets: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } }
          }
        }
      ]),

      // Newsletter statistics
      NewsletterSubscriber.aggregate([
        ...newsletterMatch,
        {
          $group: {
            _id: null,
            totalSubscribers: { $sum: 1 },
            activeSubscribers: { $sum: { $cond: [{ $eq: ['$status', 'subscribed'] }, 1, 0] } }
          }
        }
      ]),

      // Recent activity
      ActivityLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'name email')
    ]);

    // Process results
    const userData = userStats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      suspendedUsers: 0,
      adminUsers: 0
    };

    const productData = productStats[0] || {
      totalProducts: 0,
      activeProducts: 0,
      featuredProducts: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0
    };

    const orderData = orderStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      paidOrders: 0,
      shippedOrders: 0,
      pendingOrders: 0
    };

    const categoryData = categoryStats[0] || {
      totalCategories: 0,
      activeCategories: 0,
      featuredCategories: 0,
      avgProductsPerCategory: 0
    };

    const supportData = supportStats[0] || {
      totalTickets: 0,
      openTickets: 0,
      resolvedTickets: 0,
      highPriorityTickets: 0
    };

    const newsletterData = newsletterStats[0] || {
      totalSubscribers: 0,
      activeSubscribers: 0
    };

    // Add lowStockProducts array to the overview response
    const lowStockProductsArr = await Product.find({ stock: { $lte: 10 } });

    res.json({
      success: true,
      period,
      // Flat metrics for frontend compatibility
      totalSales: orderData.totalRevenue || 0,
      totalOrders: orderData.totalOrders || 0,
      activeUsers: userData.activeUsers || 0,
      pendingOrders: orderData.pendingOrders || 0,
      lowStock: productData.lowStockProducts || 0,
      lowStockProducts: lowStockProductsArr,
      recentRegistrations: userData.totalUsers || 0, // or another field if you track this separately
      averageOrderValue: orderData.averageOrderValue || 0,
      returnRate: 0, // (set to 0 or calculate if you have returns)
      alerts: 0, // (set to 0 or calculate if you have alerts)
      // Keep the original nested overview for backward compatibility
      overview: {
        users: userData,
        products: productData,
        orders: orderData,
        categories: categoryData,
        support: supportData,
        newsletter: newsletterData,
        lowStockProducts: lowStockProductsArr
      },
      recentActivity
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/sales-chart - Get sales data for charts (admin only)
router.get('/sales-chart', protect, admin, async (req, res, next) => {
  try {
    const { period = '30d', groupBy = 'day' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '90d':
        dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case '1y':
        dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
        break;
    }

    const Order = require('../models/Order');

    let groupStage = {};
    if (groupBy === 'day') {
      groupStage = {
        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
      };
    } else if (groupBy === 'week') {
      groupStage = {
        $dateToString: { format: "%Y-W%U", date: "$createdAt" }
      };
    } else if (groupBy === 'month') {
      groupStage = {
        $dateToString: { format: "%Y-%m", date: "$createdAt" }
      };
    }

    const salesData = await Order.aggregate([
      { $match: { createdAt: dateFilter, isPaid: true } },
      {
        $group: {
          _id: groupStage,
          totalRevenue: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalPrice' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      period,
      groupBy,
      salesData
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/top-products - Get top selling products (admin only)
router.get('/top-products', protect, admin, async (req, res, next) => {
  try {
    const { limit = 10, period = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '90d':
        dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case '1y':
        dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
        break;
    }

    const Order = require('../models/Order');

    const topProducts = await Order.aggregate([
      { $match: { createdAt: dateFilter } },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          totalSold: { $sum: '$orderItems.qty' },
          totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          productImage: '$product.image',
          totalSold: 1,
          totalRevenue: 1,
          orderCount: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      period,
      topProducts
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/recent-orders - Get recent orders (admin only)
router.get('/recent-orders', protect, admin, async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const Order = require('../models/Order');

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .populate('orderItems.product', 'name price image');

    res.json({
      success: true,
      recentOrders
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/activity-log - Get recent activity log (admin only)
router.get('/activity-log', protect, admin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action, user } = req.query;
    const paginationParams = parsePaginationParams({ page, limit });

    const filters = {};
    if (action) filters.action = action;
    if (user) filters.user = user;

    const result = await executePaginatedQuery(ActivityLog, filters, paginationParams, {
      populate: 'user',
      sort: { createdAt: -1 }
    });

    res.json(createPaginatedResponse(result.data, result.page, result.limit, result.total));
  } catch (err) {
    next(err);
  }
});

module.exports = router; 