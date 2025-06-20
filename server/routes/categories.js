const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, admin } = require('../middlewares/auth');
const { body, validationResult } = require('express-validator');
const ActivityLog = require('../models/ActivityLog');
const { parsePaginationParams, executePaginatedQuery, createPaginatedResponse } = require('../utils/pagination');

// Get all categories with pagination and search
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const paginationParams = parsePaginationParams({ page, limit });

    const filters = {};
    if (search) {
      filters.name = { $regex: search, $options: 'i' };
    }

    const result = await executePaginatedQuery(Category, filters, paginationParams, {
      sort: { name: 1 }
    });

    res.json(createPaginatedResponse(result.data, result.page, result.limit, result.total));
  } catch (err) {
    next(err);
  }
});

// Create a new category (admin only)
router.post('/', protect, admin, [
  body('name').notEmpty().withMessage('Name is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { name, description } = req.body;
    const category = new Category({ name, description });
    await category.save();
    await ActivityLog.create({ user: req.user._id, action: 'create_category', description: `Created category '${category.name}'` });
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: 'Error creating category', error: err.message });
  }
});

// Update a category (admin only)
router.put('/:id', protect, admin, [
  body('name').notEmpty().withMessage('Name is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { name, description } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ message: 'Category not found' });
    await ActivityLog.create({ user: req.user._id, action: 'update_category', description: `Updated category '${category.name}'` });
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: 'Error updating category', error: err.message });
  }
});

// Delete a category (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    await ActivityLog.create({ user: req.user._id, action: 'delete_category', description: `Deleted category '${category.name}'` });
    res.json({ message: 'Category deleted', category });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting category', error: err.message });
  }
});

module.exports = router; 