const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require("express-validator");
const ActivityLog = require('../models/ActivityLog');
const { parsePaginationParams, executePaginatedQuery, createPaginatedResponse } = require('../utils/pagination');
const { generateToken, protect, admin } = require('../middlewares/auth');

// User signup
router.post(
  '/signup',
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      const newUser = new User({ name, email, password });
      await newUser.save();

      res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// User login - Simplified and more reliable
router.post(
  '/login',
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Check if account is active
      if (user.status === 'suspended') {
        return res.status(403).json({ message: 'Account is suspended. Please contact support.' });
      }

      // Check password
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Update login stats using the new method
      await user.updateLoginStats();

      // Generate token
      const tokenPayload = {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        role: user.role
      };
      const token = generateToken(tokenPayload);

      // Log activity
      await ActivityLog.create({
        user: user._id,
        action: 'user_login',
        description: `User logged in from ${req.ip}`,
        ipAddress: req.ip
      });

      res.status(200).json({
        token,
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
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// Get user profile (authenticated)
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin || false,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update user profile (authenticated, with password change logic)
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, currentPassword, newPassword, phone, address } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    if (newPassword) {
      // Check if current password is correct
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Set new password
      user.password = newPassword;
    }

    await user.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update_profile',
      description: 'User updated their profile'
    });

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update user role (admin only)
router.patch('/:id/role', protect, admin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: 'Role is required' });
    
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    await ActivityLog.create({ 
      user: req.user._id, 
      action: 'update_user_role', 
      description: `Changed role of user '${user.email}' to '${role}'` 
    });
    
    res.json({
      success: true,
      message: 'User role updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Role update error:', err);
    res.status(400).json({ message: 'Error updating user role', error: err.message });
  }
});

// GET /api/users - Get all users (admin only)
router.get('/', protect, admin, async (req, res, next) => {
  try {
    const { page, limit, search, role, status, dateFrom, dateTo, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const paginationParams = parsePaginationParams({ page, limit });

    const filters = {};
    
    // Enhanced search
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && role !== 'all') {
      filters.role = role;
    }
    
    if (status && status !== 'all') {
      filters.status = status;
    }

    // Date range filtering
    if (dateFrom || dateTo) {
      filters.createdAt = {};
      if (dateFrom) filters.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filters.createdAt.$lte = new Date(dateTo);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const result = await executePaginatedQuery(User, filters, paginationParams, {
      select: '-password',
      sort: sort
    });

    res.json(createPaginatedResponse(result.data, result.page, result.limit, result.total));
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id - Get specific user (admin only)
router.get('/:id', protect, admin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id/status - Update user status (admin only)
router.put('/:id/status', protect, admin, async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldStatus = user.status;
    user.status = status;
    
    if (reason) {
      user.statusReason = reason;
    }

    await user.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update_user_status',
      description: `Changed status of user '${user.email}' from '${oldStatus}' to '${status}'${reason ? ` - Reason: ${reason}` : ''}`
    });

    res.json({
      success: true,
      message: 'User status updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        statusReason: user.statusReason
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/bulk/status - Bulk update user statuses (admin only)
router.put('/bulk/status', protect, admin, async (req, res, next) => {
  try {
    const { userIds, status, reason } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const updateData = { status };
    if (reason) updateData.statusReason = reason;

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      updateData
    );

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'bulk_update_user_status',
      description: `Bulk updated ${result.modifiedCount} users to status: ${status}${reason ? ` - Reason: ${reason}` : ''}`
    });

    res.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} users`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/analytics/summary - Get user analytics (admin only)
router.get('/analytics/summary', protect, admin, async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    
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

    const analytics = await User.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          suspendedUsers: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
          adminUsers: { $sum: { $cond: ['$isAdmin', 1, 0] } }
        }
      }
    ]);

    const result = analytics[0] || {
      totalUsers: 0,
      activeUsers: 0,
      suspendedUsers: 0,
      adminUsers: 0
    };

    res.json({
      success: true,
      period,
      analytics: result
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', protect, admin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has any orders
    const Order = require('../models/Order');
    const orderCount = await Order.countDocuments({ user: user._id });
    
    if (orderCount > 0) {
      // If user has orders, suspend instead of delete
      user.status = 'suspended';
      user.statusReason = 'Account suspended due to deletion request (has orders)';
      await user.save();
      
      await ActivityLog.create({
        user: req.user._id,
        action: 'suspend_user',
        description: `Suspended user '${user.email}' instead of deletion (has ${orderCount} orders)`
      });

      res.json({
        success: true,
        message: `User has ${orderCount} orders and has been suspended instead of deleted`
      });
    } else {
      // Delete user if no orders
      await User.findByIdAndDelete(user._id);
      
      await ActivityLog.create({
        user: req.user._id,
        action: 'delete_user',
        description: `Deleted user '${user.email}'`
      });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/users (with advanced filters)
router.get('/', require('../controllers/usersController').getUsersWithFilters);

// ========================================
// 🏠 CUSTOMER-SPECIFIC ROUTES
// ========================================

// GET /api/users/me - Get current user's full profile
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/me - Update current user's profile
router.put('/me', protect, async (req, res, next) => {
  try {
    const { name, phone, preferences } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic info
    if (name) user.name = name;
    if (phone) user.phone = phone;
    
    // Update preferences
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update_profile',
      description: 'User updated their profile information'
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/me/password - Change password
router.put('/me/password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'change_password',
      description: 'User changed their password'
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    next(err);
  }
});

// ========================================
// 🏠 ADDRESS MANAGEMENT ROUTES
// ========================================

// GET /api/users/me/addresses - Get user's addresses
router.get('/me/addresses', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      addresses: user.addresses
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/me/addresses - Add new address
router.post('/me/addresses', protect, async (req, res, next) => {
  try {
    const { 
      type, firstName, lastName, address, city, state, postalCode, country, phone, company, isDefault 
    } = req.body;

    // Validate required fields
    if (!type || !firstName || !lastName || !address || !city || !state || !postalCode || !country) {
      return res.status(400).json({ 
        message: 'Type, firstName, lastName, address, city, state, postalCode, and country are required' 
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const addressData = {
      type,
      firstName,
      lastName,
      address,
      city,
      state,
      postalCode,
      country,
      phone,
      company,
      isDefault: isDefault || false
    };

    await user.addAddress(addressData);

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'add_address',
      description: `Added new ${type} address`
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      addresses: user.addresses
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/me/addresses/:id - Update address
router.put('/me/addresses/:id', protect, async (req, res, next) => {
  try {
    const { 
      firstName, lastName, address, city, state, postalCode, country, phone, company, isDefault 
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (postalCode) updateData.postalCode = postalCode;
    if (country) updateData.country = country;
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    await user.updateAddress(req.params.id, updateData);

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update_address',
      description: 'Updated address information'
    });

    res.json({
      success: true,
      message: 'Address updated successfully',
      addresses: user.addresses
    });
  } catch (err) {
    if (err.message === 'Address not found') {
      return res.status(404).json({ message: 'Address not found' });
    }
    next(err);
  }
});

// DELETE /api/users/me/addresses/:id - Delete address
router.delete('/me/addresses/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteAddress(req.params.id);

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'delete_address',
      description: 'Deleted address'
    });

    res.json({
      success: true,
      message: 'Address deleted successfully',
      addresses: user.addresses
    });
  } catch (err) {
    if (err.message === 'Address not found') {
      return res.status(404).json({ message: 'Address not found' });
    }
    next(err);
  }
});

// GET /api/users/me/addresses/default/:type - Get default address by type
router.get('/me/addresses/default/:type', protect, async (req, res, next) => {
  try {
    const { type } = req.params;
    
    if (!['shipping', 'billing'].includes(type)) {
      return res.status(400).json({ message: 'Type must be either shipping or billing' });
    }

    const user = await User.findById(req.user._id).select('addresses');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const defaultAddress = user.getDefaultAddress(type);

    res.json({
      success: true,
      address: defaultAddress
    });
  } catch (err) {
    next(err);
  }
});

// ========================================
// ⚙️ PREFERENCES MANAGEMENT ROUTES
// ========================================

// GET /api/users/me/preferences - Get user preferences
router.get('/me/preferences', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('preferences');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      preferences: user.preferences
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/me/preferences - Update user preferences
router.put('/me/preferences', protect, async (req, res, next) => {
  try {
    const { newsletter, marketing, language, currency, timezone } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {};
    if (newsletter !== undefined) updateData.newsletter = newsletter;
    if (marketing !== undefined) updateData.marketing = marketing;
    if (language) updateData.language = language;
    if (currency) updateData.currency = currency;
    if (timezone) updateData.timezone = timezone;

    user.preferences = { ...user.preferences, ...updateData };
    await user.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update_preferences',
      description: 'Updated user preferences'
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;




