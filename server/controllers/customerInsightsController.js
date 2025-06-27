const User = require('../models/User');
const Order = require('../models/Order');

exports.getCustomerInsights = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Total customers
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // New customers (last 30 days)
    const newCustomers = await User.countDocuments({ role: 'customer', createdAt: { $gte: thirtyDaysAgo } });

    // Orders grouped by user
    const ordersByUser = await Order.aggregate([
      { $group: {
        _id: '$user',
        orderCount: { $sum: 1 },
        totalSpend: { $sum: '$totalPrice' },
        lastOrder: { $max: '$createdAt' }
      }}
    ]);

    // Returning customers (>1 order)
    const returningCustomers = ordersByUser.filter(u => u.orderCount > 1).length;

    // Top customers by spend
    const topCustomersBySpend = ordersByUser
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 5);

    // Top customers by order count
    const topCustomersByOrders = ordersByUser
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5);

    // Inactive customers (no orders in 60 days)
    const inactiveCustomerIds = ordersByUser.filter(u => u.lastOrder < sixtyDaysAgo).map(u => u._id.toString());
    const allCustomerIds = (await User.find({ role: 'customer' }, '_id')).map(u => u._id.toString());
    const neverOrderedIds = allCustomerIds.filter(id => !ordersByUser.some(u => u._id && u._id.toString() === id));
    const inactiveCustomers = inactiveCustomerIds.concat(neverOrderedIds);
    const inactiveCount = inactiveCustomers.length;

    // CLV stats
    const clvs = ordersByUser.map(u => u.totalSpend);
    const avgCLV = clvs.length ? clvs.reduce((a, b) => a + b, 0) / clvs.length : 0;
    const maxCLV = clvs.length ? Math.max(...clvs) : 0;
    const minCLV = clvs.length ? Math.min(...clvs) : 0;

    // Populate top customer details
    const topCustomerIds = [
      ...topCustomersBySpend.map(u => u._id),
      ...topCustomersByOrders.map(u => u._id)
    ];
    const topCustomerDetails = await User.find({ _id: { $in: topCustomerIds } }, 'name email createdAt');
    const topCustomers = topCustomerDetails.map(user => {
      const spend = topCustomersBySpend.find(u => u._id && u._id.toString() === user._id.toString());
      const orders = topCustomersByOrders.find(u => u._id && u._id.toString() === user._id.toString());
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        totalSpend: spend ? spend.totalSpend : 0,
        orderCount: orders ? orders.orderCount : 0
      };
    });

    res.json({
      success: true,
      totalCustomers,
      newCustomers,
      returningCustomers,
      inactiveCount,
      avgCLV,
      maxCLV,
      minCLV,
      topCustomers,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getCLVDistribution = async (req, res) => {
  try {
    const ordersByUser = await Order.aggregate([
      { $group: { _id: '$user', totalSpend: { $sum: '$totalPrice' } } }
    ]);
    const clvs = ordersByUser.map(u => u.totalSpend);
    res.json({ clvs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getGeoDistribution = async (req, res) => {
  try {
    const geo = await User.aggregate([
      { $match: { role: 'customer', 'address.country': { $exists: true, $ne: '' } } },
      { $group: { _id: '$address.country', count: { $sum: 1 } } }
    ]);
    res.json({ geo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}; 