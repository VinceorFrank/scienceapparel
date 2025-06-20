const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { body, validationResult } = require("express-validator");
const ActivityLog = require('../models/ActivityLog');
const { generateToken } = require('../middlewares/auth');
const { parsePaginationParams, executePaginatedQuery, createPaginatedResponse } = require('../utils/pagination');
const mongoose = require('mongoose');


// User signup
router.post(
  '/signup',
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    try {
      // ✅ Your original logic stays
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const newUser = new User({ name, email, password });
      await newUser.save();

      res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// User login
router.post(
  '/login',
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token using the auth middleware's function
      const token = generateToken({
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        role: user.role
      });

      // Send response with complete user info
      res.status(200).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          role: user.role
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

const { protect, admin } = require('../middlewares/auth'); // ✅ Make sure this is at the top of your file (if not already)

// Get user profile (authenticated)
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin || false
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update user profile (authenticated, with password change logic)
router.put('/profile', protect, async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    if (name) user.name = name;

    if (newPassword) {
      // Check if current password is correct
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: "Mot de passe actuel incorrect" });
      }

      // Set new password
      user.password = newPassword;
    }

    await user.save();

    res.json({
      message: "Profil mis à jour avec succès",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Update user role (admin only)
router.patch('/:id/role', protect, admin, async (req, res) => {
  const { role } = req.body;
  if (!role) return res.status(400).json({ message: 'Role is required' });
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    await ActivityLog.create({ user: req.user._id, action: 'update_user_role', description: `Changed role of user '${user.email}' to '${role}'` });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: 'Error updating user role', error: err.message });
  }
});

// GET /api/users - Get all users (admin only)
router.get('/', protect, admin, async (req, res, next) => {
  try {
    const { page, limit, search, role } = req.query;
    const paginationParams = parsePaginationParams({ page, limit });

    const filters = {};
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      filters.role = role;
    }

    const result = await executePaginatedQuery(User, filters, paginationParams, {
      select: '-password' // Exclude passwords from the result
    });

    res.json(createPaginatedResponse(result.data, result.page, result.limit, result.total));
  } catch (err) {
    next(err);
  }
});

module.exports = router;




