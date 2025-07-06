/**
 * User Service - Microservice for user management
 * Handles user authentication, profiles, and permissions
 */

const User = require('../models/User');
const { logger } = require('../utils/logger');
const { auditLog, AUDIT_EVENTS } = require('../utils/auditLogger');
const { cacheManager } = require('../utils/advancedCache');
const { messageQueue } = require('../utils/messageQueue');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserService {
  constructor() {
    this.cachePrefix = 'user:';
    this.defaultTTL = 3600; // 1 hour
  }

  /**
   * Create a new user
   */
  async createUser(userData) {
    try {
      // Validate user data
      const { email, password, role = 'customer', ...otherData } = userData;
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = new User({
        email,
        password: hashedPassword,
        role,
        ...otherData,
        createdAt: new Date(),
        lastLogin: null
      });

      await user.save();

      // Clear cache
      await cacheManager.delete(`${this.cachePrefix}email:${email}`);

      // Send welcome email
      await messageQueue.addJob('email', {
        to: email,
        subject: 'Welcome to Our E-commerce Platform',
        template: 'welcome',
        data: { email, role }
      }, { priority: 2 });

      // Audit log
      await auditLog(AUDIT_EVENTS.USER_CREATED, {
        action: 'user_created',
        userId: user._id,
        email: user.email,
        role: user.role
      }, null, {
        userId: user._id,
        email: user.email
      });

      logger.info('User created successfully', { userId: user._id, email });

      return {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      };
    } catch (error) {
      logger.error('User creation failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate user
   */
  async authenticateUser(email, password) {
    try {
      // Try cache first
      const cacheKey = `${this.cachePrefix}auth:${email}`;
      const cachedUser = await cacheManager.get(cacheKey);
      
      if (cachedUser && cachedUser.password) {
        const isValid = await bcrypt.compare(password, cachedUser.password);
        if (isValid) {
          return this.generateUserResponse(cachedUser);
        }
      }

      // Find user in database
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Cache user data (without password)
      const userData = user.toObject();
      delete userData.password;
      await cacheManager.set(cacheKey, userData, { ttl: 1800 }); // 30 minutes

      // Audit log
      await auditLog(AUDIT_EVENTS.USER_LOGIN, {
        action: 'user_login',
        userId: user._id,
        email: user.email
      }, null, {
        userId: user._id,
        email: user.email
      });

      return this.generateUserResponse(user);
    } catch (error) {
      logger.error('User authentication failed:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      // Try cache first
      const cacheKey = `${this.cachePrefix}id:${userId}`;
      const cachedUser = await cacheManager.get(cacheKey);
      
      if (cachedUser) {
        return cachedUser;
      }

      // Get from database
      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new Error('User not found');
      }

      // Cache user data
      await cacheManager.set(cacheKey, user.toObject(), { ttl: this.defaultTTL });

      return user.toObject();
    } catch (error) {
      logger.error('Get user by ID failed:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    try {
      // Try cache first
      const cacheKey = `${this.cachePrefix}email:${email}`;
      const cachedUser = await cacheManager.get(cacheKey);
      
      if (cachedUser) {
        return cachedUser;
      }

      // Get from database
      const user = await User.findOne({ email }).select('-password');
      if (!user) {
        throw new Error('User not found');
      }

      // Cache user data
      await cacheManager.set(cacheKey, user.toObject(), { ttl: this.defaultTTL });

      return user.toObject();
    } catch (error) {
      logger.error('Get user by email failed:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId, updateData) {
    try {
      // Validate update data
      const allowedFields = ['firstName', 'lastName', 'phone', 'addresses'];
      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});

      if (Object.keys(filteredData).length === 0) {
        throw new Error('No valid fields to update');
      }

      // Update user
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { ...filteredData, updatedAt: new Date() } },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      // Clear cache
      await cacheManager.delete(`${this.cachePrefix}id:${userId}`);
      await cacheManager.delete(`${this.cachePrefix}email:${user.email}`);

      // Audit log
      await auditLog(AUDIT_EVENTS.USER_UPDATED, {
        action: 'user_updated',
        userId: user._id,
        updatedFields: Object.keys(filteredData)
      }, null, {
        userId: user._id,
        updatedFields: Object.keys(filteredData)
      });

      logger.info('User updated successfully', { userId, updatedFields: Object.keys(filteredData) });

      return user.toObject();
    } catch (error) {
      logger.error('User update failed:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user with password
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      user.password = hashedPassword;
      user.updatedAt = new Date();
      await user.save();

      // Clear cache
      await cacheManager.delete(`${this.cachePrefix}id:${userId}`);
      await cacheManager.delete(`${this.cachePrefix}email:${user.email}`);
      await cacheManager.delete(`${this.cachePrefix}auth:${user.email}`);

      // Send password change notification
      await messageQueue.addJob('email', {
        to: user.email,
        subject: 'Password Changed Successfully',
        template: 'password_changed',
        data: { email: user.email }
      }, { priority: 3 });

      // Audit log
      await auditLog(AUDIT_EVENTS.USER_PASSWORD_CHANGED, {
        action: 'password_changed',
        userId: user._id,
        email: user.email
      }, null, {
        userId: user._id,
        email: user.email
      });

      logger.info('Password changed successfully', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Password change failed:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    try {
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Clear cache
      await cacheManager.delete(`${this.cachePrefix}id:${userId}`);
      await cacheManager.delete(`${this.cachePrefix}email:${user.email}`);
      await cacheManager.delete(`${this.cachePrefix}auth:${user.email}`);

      // Audit log
      await auditLog(AUDIT_EVENTS.USER_DELETED, {
        action: 'user_deleted',
        userId: user._id,
        email: user.email
      }, null, {
        userId: user._id,
        email: user.email
      });

      logger.info('User deleted successfully', { userId, email: user.email });

      return { success: true };
    } catch (error) {
      logger.error('User deletion failed:', error);
      throw error;
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10, sort = '-createdAt' } = pagination;
      const { role, search, status } = filters;

      // Build query
      const query = {};
      if (role) query.role = role;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ];
      }

      // Execute query
      const users = await User.find(query)
        .select('-password')
        .sort(sort)
        .limit(limit)
        .skip((page - 1) * limit);

      const total = await User.countDocuments(query);

      return {
        users: users.map(user => user.toObject()),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get all users failed:', error);
      throw error;
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });
  }

  /**
   * Generate user response with token
   */
  generateUserResponse(user) {
    const token = this.generateToken(user);
    
    return {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      token
    };
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await this.getUserById(decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Token verification failed:', error);
      throw new Error('Invalid token');
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            avgCreatedAt: { $avg: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } } }
          }
        }
      ]);

      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });

      return {
        totalUsers,
        activeUsers,
        byRole: stats,
        activeRate: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(2) : 0
      };
    } catch (error) {
      logger.error('Get user stats failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const userService = new UserService();

module.exports = {
  UserService,
  userService
}; 