/**
 * Admin User Management Routes
 * Handles admin operations for user management
 */

const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const ActivityLog = require('../../models/ActivityLog');
const { requireAuth, requireAdmin } = require('../../middlewares/auth');
const { 
  validateUserUpdate, 
  validateUserStatusUpdate 
} = require('../../middlewares/validators/userValidators');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseHandler');
const { buildFilters } = require('../../utils/buildFilters');

// GET /api/users/admin - Get all users with advanced filtering (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', ...filters } = req.query;
    
    // Build filters
    const filterQuery = buildFilters(filters, {
      name: { type: 'regex', field: 'name' },
      email: { type: 'regex', field: 'email' },
      status: { type: 'exact', field: 'status' },
      role: { type: 'exact', field: 'role' },
      isAdmin: { type: 'boolean', field: 'isAdmin' },
      dateFrom: { type: 'dateRange', field: 'createdAt', operator: 'gte' },
      dateTo: { type: 'dateRange', field: 'createdAt', operator: 'lte' }
    });

    // Build sort object
    const sortObj = {};
    if (sort.startsWith('-')) {
      sortObj[sort.slice(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(filterQuery)
      .select('-password')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(filterQuery);

    sendSuccess(res, 200, 'Users retrieved successfully', {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    sendError(res, 500, 'Server error', err);
  }
});

// GET /api/users/admin/:id - Get specific user (admin only)
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return sendNotFound(res, 'User');
    }

    sendSuccess(res, 200, 'User retrieved successfully', { user });
  } catch (err) {
    sendError(res, 500, 'Server error', err);
  }
});

// PUT /api/users/admin/:id - Update user (admin only)
router.put('/:id', requireAuth, requireAdmin, validateUserUpdate, async (req, res) => {
  try {
    const { name, email, phone, address, isAdmin, role, status, statusReason } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendNotFound(res, 'User');
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (typeof isAdmin !== 'undefined') user.isAdmin = isAdmin;
    if (role) user.role = role;
    if (status) user.status = status;
    if (statusReason) user.statusReason = statusReason;

    await user.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update_user',
      description: `Admin updated user '${user.email}'`,
      targetUser: user._id
    });

    sendSuccess(res, 200, 'User updated successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    sendError(res, 500, 'Server error', err);
  }
});

// PATCH /api/users/admin/:id/status - Update user status (admin only)
router.patch('/:id/status', requireAuth, requireAdmin, validateUserStatusUpdate, async (req, res) => {
  try {
    const { status, statusReason } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendNotFound(res, 'User');
    }

    const previousStatus = user.status;
    user.status = status;
    if (statusReason) user.statusReason = statusReason;

    await user.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update_user_status',
      description: `Admin changed user '${user.email}' status from ${previousStatus} to ${status}`,
      targetUser: user._id
    });

    sendSuccess(res, 200, 'User status updated successfully', {
      user: {
        id: user._id,
        email: user.email,
        status: user.status,
        statusReason: user.statusReason
      }
    });
  } catch (err) {
    sendError(res, 500, 'Server error', err);
  }
});

// DELETE /api/users/admin/:id - Delete user (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendNotFound(res, 'User');
    }

    // Check if user has any orders
    const Order = require('../../models/Order');
    const orderCount = await Order.countDocuments({ user: user._id });
    
    if (orderCount > 0) {
      // If user has orders, suspend instead of delete
      user.status = 'suspended';
      user.statusReason = 'Account suspended due to deletion request (has orders)';
      await user.save();
      
      await ActivityLog.create({
        user: req.user._id,
        action: 'suspend_user',
        description: `Suspended user '${user.email}' instead of deletion (has ${orderCount} orders)`,
        targetUser: user._id
      });

      sendSuccess(res, 200, `User has ${orderCount} orders and has been suspended instead of deleted`);
    } else {
      // Delete user if no orders
      await User.findByIdAndDelete(user._id);
      
      await ActivityLog.create({
        user: req.user._id,
        action: 'delete_user',
        description: `Deleted user '${user.email}'`,
        targetUser: user._id
      });

      sendSuccess(res, 200, 'User deleted successfully');
    }
  } catch (err) {
    sendError(res, 500, 'Server error', err);
  }
});

// GET /api/users/admin/analytics/registration - User registration analytics
router.get('/analytics/registration', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const result = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - getPeriodInMs(period))
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    sendSuccess(res, 200, 'Registration analytics retrieved successfully', {
      period,
      analytics: result
    });
  } catch (err) {
    sendError(res, 500, 'Server error', err);
  }
});

// Helper function for period conversion
function getPeriodInMs(period) {
  const periods = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    '1y': 365 * 24 * 60 * 60 * 1000
  };
  return periods[period] || periods['30d'];
}

module.exports = router; 