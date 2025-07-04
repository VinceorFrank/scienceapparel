const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// 1. Customer Lifetime Value (CLV) - Enhanced with individual customer data
exports.getCLV = async (req, res) => {
  try {
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const uniqueCustomerCount = new Set(orders.map(order => order.user.toString())).size;
    const averageCLV = uniqueCustomerCount > 0 ? totalRevenue / uniqueCustomerCount : 0;
    
    // Calculate individual customer CLV
    const customerCLV = await Order.aggregate([
      {
        $group: {
          _id: '$user',
          totalSpend: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 },
          firstOrder: { $min: '$createdAt' },
          lastOrder: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      {
        $unwind: '$customerInfo'
      },
      {
        $project: {
          customerName: '$customerInfo.name',
          customerEmail: '$customerInfo.email',
          totalSpend: 1,
          orderCount: 1,
          firstOrder: 1,
          lastOrder: 1,
          clv: '$totalSpend'
        }
      },
      {
        $sort: { totalSpend: -1 }
      }
    ]);

    sendSuccess(res, { 
      averageCLV: averageCLV.toFixed(2),
      totalRevenue: totalRevenue.toFixed(2),
      uniqueCustomers: uniqueCustomerCount,
      customerCLV: customerCLV.slice(0, 20) // Top 20 customers
    });
  } catch (err) {
    sendError(res, 500, 'Error calculating CLV', err);
  }
};

// 2. Conversion Rate Analytics
exports.getConversionRate = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);
    
    // Get orders in the period
    const orders = await Order.find({ createdAt: { $gte: daysAgo } });
    
    // Calculate conversion metrics
    const totalOrders = orders.length;
    const uniqueCustomers = new Set(orders.map(order => order.user.toString())).size;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    
    // Get total users in the period (potential customers)
    const totalUsers = await User.countDocuments({ 
      role: 'customer', 
      createdAt: { $gte: daysAgo } 
    });
    
    // Calculate conversion rates
    const conversionRate = totalUsers > 0 ? (uniqueCustomers / totalUsers * 100) : 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Daily conversion tracking
    const dailyConversions = await Order.aggregate([
      { $match: { createdAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
          uniqueCustomers: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          date: '$_id',
          orders: 1,
          revenue: 1,
          uniqueCustomers: { $size: '$uniqueCustomers' }
        }
      },
      { $sort: { date: 1 } }
    ]);

    sendSuccess(res, {
      period: `${period} days`,
      conversionRate: conversionRate.toFixed(2),
      totalOrders,
      uniqueCustomers,
      totalRevenue: totalRevenue.toFixed(2),
      averageOrderValue: averageOrderValue.toFixed(2),
      totalPotentialCustomers: totalUsers,
      dailyConversions
    });
  } catch (err) {
    sendError(res, 500, 'Error calculating conversion rate', err);
  }
};

// 3. Abandoned Cart Analytics (based on incomplete orders)
exports.getAbandonedCartMetrics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);
    
    // Get abandoned carts (orders with status 'pending' or 'cart')
    const abandonedOrders = await Order.find({
      createdAt: { $gte: daysAgo },
      $or: [
        { status: 'pending' },
        { status: 'cart' },
        { isPaid: false }
      ]
    });
    
    // Get completed orders for comparison
    const completedOrders = await Order.find({
      createdAt: { $gte: daysAgo },
      $or: [
        { status: 'completed' },
        { status: 'delivered' },
        { isPaid: true }
      ]
    });
    
    const abandonedCount = abandonedOrders.length;
    const completedCount = completedOrders.length;
    const totalOrders = abandonedCount + completedCount;
    
    const abandonmentRate = totalOrders > 0 ? (abandonedCount / totalOrders * 100) : 0;
    
    // Calculate potential revenue lost
    const potentialRevenueLost = abandonedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    
    // Abandonment by category
    const abandonmentByCategory = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: daysAgo },
          $or: [
            { status: 'pending' },
            { status: 'cart' },
            { isPaid: false }
          ]
        }
      },
      { $unwind: "$orderItems" },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.product",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$productInfo.category",
          abandonedCount: { $sum: 1 },
          potentialRevenue: { $sum: "$orderItems.price" }
        }
      },
      { $sort: { abandonedCount: -1 } }
    ]);
    
    // Populate category names
    const categories = await Category.find({ _id: { $in: abandonmentByCategory.map(item => item._id) } });
    const abandonmentByCategoryWithNames = abandonmentByCategory.map(item => {
      const category = categories.find(cat => cat._id.toString() === item._id.toString());
      return {
        category: category ? category.name : 'Unknown',
        abandonedCount: item.abandonedCount,
        potentialRevenue: item.potentialRevenue
      };
    });

    sendSuccess(res, {
      period: `${period} days`,
      abandonmentRate: abandonmentRate.toFixed(2),
      abandonedCount,
      completedCount,
      totalOrders,
      potentialRevenueLost: potentialRevenueLost.toFixed(2),
      abandonmentByCategory: abandonmentByCategoryWithNames
    });
  } catch (err) {
    sendError(res, 500, 'Error calculating abandoned cart metrics', err);
  }
};

// 4. Enhanced Newsletter Analytics
exports.getNewsletterAnalytics = async (req, res) => {
  try {
    const NewsletterSubscriber = require('../models/NewsletterSubscriber');
    const NewsletterCampaign = require('../models/NewsletterCampaign');
    
    // Subscriber growth over time
    const subscriberGrowth = await NewsletterSubscriber.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$subscribedAt" } },
          newSubscribers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Campaign performance
    const campaignStats = await NewsletterCampaign.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRecipients: { $sum: '$recipientCount' }
        }
      }
    ]);
    
    // Recent campaign performance
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentCampaigns = await NewsletterCampaign.find({
      sentAt: { $gte: thirtyDaysAgo }
    }).populate('sentBy', 'name');
    
    // Calculate engagement metrics
    const totalSubscribers = await NewsletterSubscriber.countDocuments({ status: 'subscribed' });
    const totalCampaigns = await NewsletterCampaign.countDocuments();
    const successfulCampaigns = await NewsletterCampaign.countDocuments({ status: 'sent' });
    const successRate = totalCampaigns > 0 ? (successfulCampaigns / totalCampaigns * 100) : 0;
    
    sendSuccess(res, {
      subscriberGrowth,
      campaignStats,
      recentCampaigns,
      totalSubscribers,
      totalCampaigns,
      successfulCampaigns,
      successRate: successRate.toFixed(2)
    });
  } catch (err) {
    sendError(res, 500, 'Error fetching newsletter analytics', err);
  }
};

// 5. Enhanced Admin Activity Analytics
exports.getAdminActivityAnalytics = async (req, res) => {
  try {
    const ActivityLog = require('../models/ActivityLog');
    
    // Activity frequency by action type
    const activityByType = await ActivityLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Activity over time
    const activityOverTime = await ActivityLog.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          activities: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Most active admins
    const adminActivity = await ActivityLog.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $match: { 'userInfo.role': 'admin' }
      },
      {
        $group: {
          _id: '$user',
          adminName: { $first: '$userInfo.name' },
          activityCount: { $sum: 1 },
          lastActivity: { $max: '$createdAt' }
        }
      },
      { $sort: { activityCount: -1 } }
    ]);
    
    sendSuccess(res, {
      activityByType,
      activityOverTime,
      adminActivity,
      totalActivities: await ActivityLog.countDocuments()
    });
  } catch (err) {
    sendError(res, 500, 'Error fetching admin activity analytics', err);
  }
};

// 2. Users by Country (now based on shipping country from orders)
exports.getUsersByCountry = async (req, res) => {
  try {
    const countryCounts = await Order.aggregate([
      { $match: { 'shippingAddress.country': { $exists: true, $ne: '' } } },
      { $group: { _id: '$shippingAddress.country', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const result = {};
    countryCounts.forEach(c => { result[c._id] = c.count; });
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, 500, 'Error fetching user country stats', err);
  }
};

// 3. Revenue Over Time (monthly)
exports.getRevenueOverTime = async (req, res) => {
  try {
    const revenue = await Order.aggregate([
      { $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          total: { $sum: "$totalPrice" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    sendSuccess(res, revenue.map(r => ({ month: r._id, total: r.total })));
  } catch (err) {
    sendError(res, 500, 'Error fetching revenue', err);
  }
};

// 4. Top-Selling Products
exports.getTopProducts = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: "$orderItems" },
      { $group: {
          _id: "$orderItems.product",
          totalSold: { $sum: "$orderItems.qty" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);
    // Populate product names
    const products = await Product.find({ _id: { $in: topProducts.map(p => p._id) } });
    const result = topProducts.map(tp => {
      const prod = products.find(p => p._id.toString() === tp._id.toString());
      return { name: prod ? prod.name : 'Unknown', totalSold: tp.totalSold };
    });
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, 500, 'Error fetching top products', err);
  }
};

// 5. Orders by Status
exports.getOrdersByStatus = async (req, res) => {
  try {
    const orders = await Order.find();
    const statusMap = {};
    orders.forEach(order => {
      const status = order.status || (order.isPaid ? (order.isDelivered ? 'Delivered' : 'Paid') : 'Pending');
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    sendSuccess(res, statusMap);
  } catch (err) {
    sendError(res, 500, 'Error fetching order status stats', err);
  }
};

// 6. New Customers Over Time (monthly)
exports.getNewCustomersOverTime = async (req, res) => {
  try {
    const customers = await User.aggregate([
      { $match: { role: 'customer' } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    sendSuccess(res, customers.map(c => ({ month: c._id, count: c.count })));
  } catch (err) {
    sendError(res, 500, 'Error fetching new customers', err);
  }
};

// 7. Revenue by Category
exports.getRevenueByCategory = async (req, res) => {
  try {
    const revenue = await Order.aggregate([
      { $unwind: "$orderItems" },
      { $lookup: {
          from: "products",
          localField: "orderItems.product",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      { $group: {
          _id: "$productInfo.category",
          total: { $sum: "$orderItems.price" }
        }
      },
      { $sort: { total: -1 } }
    ]);
    // Populate category names
    const categories = await Category.find({ _id: { $in: revenue.map(r => r._id) } });
    const result = revenue.map(r => {
      const cat = categories.find(c => c._id.toString() === r._id.toString());
      return { category: cat ? cat.name : 'Unknown', total: r.total };
    });
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, 500, 'Error fetching revenue by category', err);
  }
};

// 8. Average Order Value (AOV)
exports.getAOV = async (req, res) => {
  try {
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const orderCount = orders.length;
    const aov = orderCount > 0 ? totalRevenue / orderCount : 0;
    sendSuccess(res, { aov: aov.toFixed(2) });
  } catch (err) {
    sendError(res, 500, 'Error calculating AOV', err);
  }
};

// 9. Low Stock Products
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ stock: { $lt: 10 } });
    sendSuccess(res, products.map(p => ({ name: p.name, stock: p.stock })));
  } catch (err) {
    sendError(res, 500, 'Error fetching low stock products', err);
  }
};

// 10. Repeat vs One-Time Customers
exports.getRepeatVsOneTimeCustomers = async (req, res) => {
  try {
    const orders = await Order.find();
    const userOrderCounts = {};
    orders.forEach(order => {
      const userId = order.user.toString();
      userOrderCounts[userId] = (userOrderCounts[userId] || 0) + 1;
    });
    let repeat = 0, oneTime = 0;
    Object.values(userOrderCounts).forEach(count => {
      if (count > 1) repeat++;
      else oneTime++;
    });
    sendSuccess(res, { repeat, oneTime });
  } catch (err) {
    sendError(res, 500, 'Error calculating repeat customers', err);
  }
};

exports.getCustomPieChart = async (req, res) => {
  try {
    const { collection, groupBy, filter = {} } = req.body;
    if (!collection || !groupBy) return sendError(res, 400, 'Missing params');

    const modelMap = {
      users: require('../models/User'),
      orders: require('../models/Order'),
      products: require('../models/Product'),
      categories: require('../models/Category'),
    };
    const Model = modelMap[collection];
    if (!Model) return sendError(res, 400, 'Invalid collection');

    // Build aggregation
    const pipeline = [];
    if (Object.keys(filter).length) pipeline.push({ $match: filter });
    pipeline.push({
      $group: {
        _id: `$${groupBy}`,
        value: { $sum: 1 }
      }
    });
    pipeline.push({ $sort: { value: -1 } });

    const data = await Model.aggregate(pipeline);

    // If grouping by a reference (category or product), populate names
    if ((collection === 'products' && groupBy === 'category') || (collection === 'orders' && groupBy === 'orderItems.product')) {
      // Category or Product reference
      let refModel, refField;
      if (groupBy === 'category') {
        refModel = require('../models/Category');
        refField = 'name';
      } else if (groupBy === 'orderItems.product') {
        refModel = require('../models/Product');
        refField = 'name';
      }
      const ids = data.map(d => d._id).filter(id => id);
      const refs = await refModel.find({ _id: { $in: ids } });
      sendSuccess(res, data.map(d => ({
        label: (() => {
          if (!d._id) return 'Unknown';
          const ref = refs.find(r => r._id.toString() === d._id.toString());
          return ref ? ref[refField] : 'Unknown';
        })(),
        value: d.value
      })));
      return;
    }

    sendSuccess(res, data.map(d => ({ label: d._id || 'Unknown', value: d.value })));
  } catch (err) {
    sendError(res, 500, 'Error fetching custom pie chart', err);
  }
};

// Support Ticket Status Summary
exports.getSupportTicketStats = async (req, res) => {
  try {
    const Support = require('../models/Support');
    const tickets = await Support.find();
    const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const unresolved = tickets.length - resolved;
    // Average response time (in hours)
    let totalResponseTime = 0, responseCount = 0;
    tickets.forEach(ticket => {
      if (ticket.responses && ticket.responses.length > 0) {
        const firstResponse = ticket.responses[0];
        const responseTime = (firstResponse.createdAt - ticket.createdAt) / (1000 * 60 * 60);
        totalResponseTime += responseTime;
        responseCount++;
      }
    });
    const avgResponseTime = responseCount > 0 ? (totalResponseTime / responseCount) : 0;
    sendSuccess(res, { total: tickets.length, resolved, unresolved, avgResponseTime: avgResponseTime.toFixed(2) });
  } catch (err) {
    sendError(res, 500, 'Error fetching support ticket stats', err);
  }
};

// Top Customers by Order Count and Spend
exports.getTopCustomers = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const User = require('../models/User');
    const ordersByUser = await Order.aggregate([
      { $group: { _id: '$user', orderCount: { $sum: 1 }, totalSpend: { $sum: '$totalPrice' } } },
      { $sort: { orderCount: -1, totalSpend: -1 } },
      { $limit: 10 }
    ]);
    const users = await User.find({ _id: { $in: ordersByUser.map(u => u._id) } });
    const result = ordersByUser.map(u => {
      const user = users.find(x => x._id.toString() === u._id.toString());
      return {
        name: user ? user.name : 'Unknown',
        email: user ? user.email : '',
        orderCount: u.orderCount,
        totalSpend: u.totalSpend
      };
    });
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, 500, 'Error fetching top customers', err);
  }
};

// Revenue by Product
exports.getRevenueByProduct = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const Product = require('../models/Product');
    const revenue = await Order.aggregate([
      { $unwind: '$orderItems' },
      { $group: { _id: '$orderItems.product', total: { $sum: '$orderItems.price' }, qty: { $sum: '$orderItems.qty' } } },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);
    const products = await Product.find({ _id: { $in: revenue.map(r => r._id) } });
    const result = revenue.map(r => {
      const prod = products.find(p => p._id.toString() === r._id.toString());
      return { name: prod ? prod.name : 'Unknown', total: r.total, qty: r.qty };
    });
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, 500, 'Error fetching revenue by product', err);
  }
};

// Order Status Over Time (stacked)
exports.getOrderStatusOverTime = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const statuses = ['pending', 'paid', 'delivered', 'cancelled'];
    const data = await Order.aggregate([
      { $group: {
        _id: { month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, status: '$status' },
        count: { $sum: 1 }
      } },
      { $group: {
        _id: '$_id.month',
        statusCounts: { $push: { status: '$_id.status', count: '$count' } }
      } },
      { $sort: { _id: 1 } }
    ]);
    // Format for stacked chart
    const result = data.map(d => {
      const counts = {};
      statuses.forEach(s => { counts[s] = 0; });
      d.statusCounts.forEach(sc => { counts[sc.status] = sc.count; });
      return { month: d._id, ...counts };
    });
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, 500, 'Error fetching order status over time', err);
  }
}; 