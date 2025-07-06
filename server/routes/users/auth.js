/**
 * User Authentication Routes
 * Handles user registration, login, and authentication-related operations
 */

const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const ActivityLog = require('../../models/ActivityLog');
const { generateToken, requireAuth } = require('../../middlewares/auth');
const { 
  validateUserRegistration, 
  validateUserLogin 
} = require('../../middlewares/validators/userValidators');
const { sendSuccess, sendError, sendConflict } = require('../../utils/responseHandler');

/**
 * @swagger
 * /api/users/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     description: Create a new user account with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 507f1f77bcf86cd799439011
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         email:
 *                           type: string
 *                           example: john@example.com
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// User signup
router.post('/signup', validateUserRegistration, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendConflict(res, 'User');
    }

    // Create new user
    const newUser = new User({ name, email, password, phone });
    await newUser.save();

    // Log activity
    await ActivityLog.create({
      user: newUser._id,
      action: 'user_registration',
      description: `New user registered: ${email}`,
      ipAddress: req.ip
    });

    sendSuccess(res, 201, 'User created successfully', {
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (err) {
    sendError(res, 500, 'Server error', err);
  }
});

// User register (alias for signup)
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendConflict(res, 'User');
    }
    // Create new user
    const newUser = new User({ name, email, password, phone });
    await newUser.save();
    // Log activity
    await ActivityLog.create({
      user: newUser._id,
      action: 'user_registration',
      description: `New user registered: ${email}`,
      ipAddress: req.ip
    });
    sendSuccess(res, 201, 'User created successfully', {
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (err) {
    sendError(res, 500, 'Server error', err);
  }
});

/**
 * @swagger
 * /api/users/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     description: Authenticate user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 507f1f77bcf86cd799439011
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         email:
 *                           type: string
 *                           example: john@example.com
 *                         isAdmin:
 *                           type: boolean
 *                           example: false
 *                         role:
 *                           type: string
 *                           example: customer
 *                         status:
 *                           type: string
 *                           example: active
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Account suspended
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// User login
async function loginHandler(req, res) {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 400, 'Invalid credentials', null, 'INVALID_CREDENTIALS');
    }

    // Check if account is active
    if (user.status === 'suspended') {
      return sendError(res, 403, 'Account is suspended. Please contact support.', null, 'ACCOUNT_SUSPENDED');
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendError(res, 400, 'Invalid credentials', null, 'INVALID_CREDENTIALS');
    }

    // Update login stats
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
      event: 'login_success',
      action: 'user_login',
      description: `User logged in from ${req.ip}`,
      ipAddress: req.ip
    });

    sendSuccess(res, 200, 'Login successful', {
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
    sendError(res, 500, 'Server error', err);
  }
}

router.post('/login', validateUserLogin, loginHandler);

// Get user profile (authenticated)
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return sendError(res, 404, 'User not found', null, 'USER_NOT_FOUND');
    }

    sendSuccess(res, 200, 'Profile retrieved successfully', {
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
    sendError(res, 500, 'Server error', err);
  }
});

// Update user profile (authenticated)
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, currentPassword, newPassword, phone, address } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return sendError(res, 404, 'User not found', null, 'USER_NOT_FOUND');
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    if (newPassword) {
      // Check if current password is correct
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return sendError(res, 400, 'Current password is incorrect', null, 'INVALID_PASSWORD');
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

    sendSuccess(res, 200, 'Profile updated successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (err) {
    sendError(res, 500, 'Server error', err);
  }
});

module.exports = { router, loginHandler, validateUserLogin }; 