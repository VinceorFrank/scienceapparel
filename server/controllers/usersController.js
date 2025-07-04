const User = require('../models/User');
const Order = require('../models/Order');

exports.getUsersWithFilters = async (req, res, next) => {
  try {
    const {
      search, role, minOrders, maxOrders, minSpend, maxSpend, registeredAfter, registeredBefore, sort, page = 1, limit = 20
    } = req.query;
    const match = {};
    if (role) match.role = role;
    if (search) {
      match.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (registeredAfter) match.createdAt = { ...match.createdAt, $gte: new Date(registeredAfter) };
    if (registeredBefore) match.createdAt = { ...match.createdAt, $lte: new Date(registeredBefore) };

    // Aggregate users with order stats
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders'
        }
      },
      {
        $addFields: {
          orderCount: { $size: '$orders' },
          totalSpend: { $sum: '$orders.totalPrice' }
        }
      }
    ];
    if (minOrders) pipeline.push({ $match: { orderCount: { $gte: parseInt(minOrders) } } });
    if (maxOrders) pipeline.push({ $match: { orderCount: { $lte: parseInt(maxOrders) } } });
    if (minSpend) pipeline.push({ $match: { totalSpend: { $gte: parseFloat(minSpend) } } });
    if (maxSpend) pipeline.push({ $match: { totalSpend: { $lte: parseFloat(maxSpend) } } });
    // Sorting
    let sortObj = { createdAt: -1 };
    if (sort) {
      if (sort === 'orders') sortObj = { orderCount: -1 };
      if (sort === 'spend') sortObj = { totalSpend: -1 };
      if (sort === 'name') sortObj = { name: 1 };
    }
    pipeline.push({ $sort: sortObj });
    // Pagination
    pipeline.push({ $skip: (parseInt(page) - 1) * parseInt(limit) });
    pipeline.push({ $limit: parseInt(limit) });
    // Project fields
    pipeline.push({
      $project: {
        name: 1,
        email: 1,
        role: 1,
        createdAt: 1,
        orderCount: 1,
        totalSpend: 1
      }
    });
    const users = await User.aggregate(pipeline);
    // Total count for pagination
    const total = await User.countDocuments(match);
    res.json({
      success: true,
      users,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    err.status = 500;
    err.message = 'Failed to fetch users with filters';
    next(err);
  }
}; 