const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { body, validationResult } = require("express-validator");


// POST /api/users/signup
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

// POST /api/users/login
router.post(
  '/login',
  [
    body("email").isEmail().withMessage("Veuillez fournir un email valide"),
    body("password").notEmpty().withMessage("Le mot de passe est requis"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Recherche l'utilisateur
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Identifiants invalides' });
      }

      // Utilise la méthode du modèle pour comparer les mots de passe
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Identifiants invalides' });
      }

      // Génère un token JWT
      const token = jwt.sign(
        { id: user._id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.status(200).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } catch (err) {
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  }
);

const { protect } = require('../middlewares/auth'); // ✅ Make sure this is at the top of your file (if not already)

// GET /api/users/profile
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


module.exports = router;




