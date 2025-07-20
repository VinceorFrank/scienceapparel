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

    sendSuccess(res, 200, 'CLV calculated successfully', { 
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

    sendSuccess(res, 200, 'Conversion rate calculated successfully', {
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

    sendSuccess(res, 200, 'Abandoned cart metrics calculated successfully', {
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

// 4. Newsletter Analytics
exports.getNewsletterAnalytics = async (req, res) => {
  try {
    const NewsletterCampaign = require('../models/NewsletterCampaign');
    const NewsletterSubscriber = require('../models/NewsletterSubscriber');
    
    const totalSubscribers = await NewsletterSubscriber.countDocuments();
    const totalCampaigns = await NewsletterCampaign.countDocuments();
    const successfulCampaigns = await NewsletterCampaign.countDocuments({ status: 'sent' });
    const successRate = totalCampaigns > 0 ? (successfulCampaigns / totalCampaigns * 100) : 0;
    
    // Subscriber growth over time
    const subscriberGrowth = await NewsletterSubscriber.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          newSubscribers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    sendSuccess(res, 200, 'Newsletter analytics retrieved successfully', {
      totalSubscribers,
      totalCampaigns,
      successfulCampaigns,
      successRate: successRate.toFixed(2),
      subscriberGrowth
    });
  } catch (err) {
    sendError(res, 500, 'Error fetching newsletter analytics', err);
  }
};

// 5. Admin Activity Analytics
exports.getAdminActivityAnalytics = async (req, res) => {
  try {
    const ActivityLog = require('../models/ActivityLog');
    
    const totalActions = await ActivityLog.countDocuments({ userRole: 'admin' });
    const actionsByType = await ActivityLog.aggregate([
      { $match: { userRole: 'admin' } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    sendSuccess(res, 200, 'Admin activity analytics retrieved successfully', {
      totalActions,
      actionsByType: actionsByType.map(a => ({ action: a._id, count: a.count }))
    });
  } catch (err) {
    sendError(res, 500, 'Error fetching admin activity analytics', err);
  }
};

// 6. Revenue Over Time (monthly)
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
    sendSuccess(res, 200, 'Revenue over time retrieved successfully', revenue.map(r => ({ date: r._id, total: r.total })));
  } catch (err) {
    sendError(res, 500, 'Error fetching revenue', err);
  }
};

// 7. Top-Selling Products
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
    sendSuccess(res, 200, 'Top products retrieved successfully', result);
  } catch (err) {
    sendError(res, 500, 'Error fetching top products', err);
  }
};

// 8. Orders by Status
exports.getOrdersByStatus = async (req, res) => {
  try {
    const orders = await Order.find();
    const statusMap = {};
    orders.forEach(order => {
      const status = order.status || (order.isPaid ? (order.isDelivered ? 'Delivered' : 'Paid') : 'Pending');
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    sendSuccess(res, 200, 'Orders by status retrieved successfully', statusMap);
  } catch (err) {
    sendError(res, 500, 'Error fetching order status stats', err);
  }
};

// 9. New Customers Over Time (monthly)
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
    sendSuccess(res, 200, 'New customers over time retrieved successfully', customers.map(c => ({ month: c._id, count: c.count })));
  } catch (err) {
    sendError(res, 500, 'Error fetching new customers', err);
  }
};

// 10. Revenue by Category
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
    sendSuccess(res, 200, 'Revenue by category retrieved successfully', result);
  } catch (err) {
    sendError(res, 500, 'Error fetching revenue by category', err);
  }
};

// 11. Average Order Value (AOV)
exports.getAOV = async (req, res) => {
  try {
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const aov = orders.length > 0 ? totalRevenue / orders.length : 0;
    sendSuccess(res, 200, 'Average order value calculated successfully', { averageOrderValue: aov.toFixed(2) });
  } catch (err) {
    sendError(res, 500, 'Error calculating AOV', err);
  }
};

// 12. Low Stock Products
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ stock: { $lt: 10 } }).sort({ stock: 1 }).limit(10);
    sendSuccess(res, 200, 'Low stock products retrieved successfully', products.map(p => ({ name: p.name, stock: p.stock })));
  } catch (err) {
    sendError(res, 500, 'Error fetching low stock products', err);
  }
};

// 13. Repeat vs One-Time Customers
exports.getRepeatVsOneTimeCustomers = async (req, res) => {
  try {
    const customerOrders = await Order.aggregate([
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 }
        }
      }
    ]);
    
    const repeat = customerOrders.filter(c => c.orderCount > 1).length;
    const oneTime = customerOrders.filter(c => c.orderCount === 1).length;
    
    sendSuccess(res, 200, 'Customer loyalty analysis completed successfully', { repeat, oneTime });
  } catch (err) {
    sendError(res, 500, 'Error analyzing customer loyalty', err);
  }
};

// 14. Users by Country
exports.getUsersByCountry = async (req, res) => {
  try {
    const data = await User.aggregate([
      { $match: { role: 'customer' } },
      {
        $group: {
          _id: '$shippingAddress.country',
          value: { $sum: 1 }
        }
      },
      { $sort: { value: -1 } }
    ]);
    
    sendSuccess(res, 200, 'Users by country retrieved successfully', data.map(d => ({
      label: d._id || 'Unknown',
      value: d.value
    })));
  } catch (err) {
    sendError(res, 500, 'Error fetching users by country', err);
  }
};

// 15. Support Ticket Stats
exports.getSupportTicketStats = async (req, res) => {
  try {
    const Support = require('../models/Support');
    
    const tickets = await Support.find();
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const unresolved = tickets.filter(t => t.status !== 'resolved').length;
    
    // Calculate average response time (mock data for now)
    const avgResponseTime = 24; // hours
    
    sendSuccess(res, 200, 'Support ticket stats retrieved successfully', { 
      total: tickets.length, 
      resolved, 
      unresolved, 
      avgResponseTime: avgResponseTime.toFixed(2) 
    });
  } catch (err) {
    sendError(res, 500, 'Error fetching support ticket stats', err);
  }
};

// 16. Top Customers
exports.getTopCustomers = async (req, res) => {
  try {
    const topCustomers = await Order.aggregate([
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);
    
    // Populate customer names
    const users = await User.find({ _id: { $in: topCustomers.map(c => c._id) } });
    const result = topCustomers.map(c => {
      const user = users.find(u => u._id.toString() === c._id.toString());
      return {
        name: user ? user.name : 'Unknown',
        email: user ? user.email : 'Unknown',
        totalSpent: c.totalSpent,
        orderCount: c.orderCount
      };
    });
    
    sendSuccess(res, 200, 'Top customers retrieved successfully', result);
  } catch (err) {
    sendError(res, 500, 'Error fetching top customers', err);
  }
};

// 17. Revenue by Product
exports.getRevenueByProduct = async (req, res) => {
  try {
    const revenue = await Order.aggregate([
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          totalRevenue: { $sum: "$orderItems.price" },
          unitsSold: { $sum: "$orderItems.qty" }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);
    
    // Populate product names
    const products = await Product.find({ _id: { $in: revenue.map(r => r._id) } });
    const result = revenue.map(r => {
      const product = products.find(p => p._id.toString() === r._id.toString());
      return {
        name: product ? product.name : 'Unknown',
        totalRevenue: r.totalRevenue,
        unitsSold: r.unitsSold
      };
    });
    
    sendSuccess(res, 200, 'Revenue by product retrieved successfully', result);
  } catch (err) {
    sendError(res, 500, 'Error fetching revenue by product', err);
  }
};

// 18. Order Status Over Time
exports.getOrderStatusOverTime = async (req, res) => {
  try {
    const statusOverTime = await Order.aggregate([
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    sendSuccess(res, 200, 'Order status over time retrieved successfully', statusOverTime);
  } catch (err) {
    sendError(res, 500, 'Error fetching order status over time', err);
  }
};

// 19. Custom Pie Chart Builder
exports.getCustomPieChart = async (req, res) => {
  try {
    const { dataSource, groupBy, limit = 10 } = req.body;
    
    let pipeline = [];
    
    // Build aggregation pipeline based on data source
    switch (dataSource) {
      case 'orders':
        pipeline = [
          { $group: { _id: `$${groupBy}`, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: parseInt(limit) }
        ];
        break;
      case 'products':
        pipeline = [
          { $group: { _id: `$${groupBy}`, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: parseInt(limit) }
        ];
        break;
      case 'users':
        pipeline = [
          { $match: { role: 'customer' } },
          { $group: { _id: `$${groupBy}`, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: parseInt(limit) }
        ];
        break;
      default:
        return sendError(res, 400, 'Invalid data source');
    }
    
    const Model = dataSource === 'orders' ? Order : dataSource === 'products' ? Product : User;
    const result = await Model.aggregate(pipeline);
    
    sendSuccess(res, 200, 'Custom pie chart data generated successfully', result);
  } catch (err) {
    sendError(res, 500, 'Error generating custom pie chart', err);
  }
}; 