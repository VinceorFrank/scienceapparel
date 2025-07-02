const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { requireAuth, admin } = require('../middlewares/auth');
const { body, validationResult } = require('express-validator');
const ActivityLog = require('../models/ActivityLog');
const { parsePaginationParams, executePaginatedQuery, createPaginatedResponse } = require('../utils/pagination');

// Get all categories with pagination and search
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, search, featured, sortBy = 'name', sortOrder = 'asc' } = req.query;
    const paginationParams = parsePaginationParams({ page, limit });

    const filters = {};
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (featured === 'true') {
      filters.featured = true;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const result = await executePaginatedQuery(Category, filters, paginationParams, {
      sort: sort
    });

    res.json(createPaginatedResponse(result.data, result.page, result.limit, result.total));
  } catch (err) {
    next(err);
  }
});

// Get featured categories (public)
router.get('/featured', async (req, res, next) => {
  try {
    const categories = await Category.find({ featured: true, active: true })
      .sort({ sortOrder: 1, name: 1 })
      .limit(10);

    res.json({
      success: true,
      data: categories
    });
  } catch (err) {
    next(err);
  }
});

// Create a new category (admin only)
router.post('/', requireAuth, admin, [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { name, description, featured, active, sortOrder, image } = req.body;
    
    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        message: 'Category with this name already exists' 
      });
    }

    const category = new Category({ 
      name, 
      description, 
      featured: featured || false,
      active: active !== false, // Default to true
      sortOrder: sortOrder || 0,
      image
    });
    await category.save();
    
    await ActivityLog.create({ 
      user: req.user._id, 
      action: 'create_category', 
      description: `Created category '${category.name}'` 
    });
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (err) {
    res.status(400).json({ message: 'Error creating category', error: err.message });
  }
});

// Update a category (admin only)
router.put('/:id', requireAuth, admin, [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { name, description, featured, active, sortOrder, image } = req.body;
    
    // Check if name is being updated and if it conflicts with existing category
    if (name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        return res.status(400).json({ 
          message: 'Category with this name already exists' 
        });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, featured, active, sortOrder, image },
      { new: true, runValidators: true }
    );
    
    if (!category) return res.status(404).json({ message: 'Category not found' });
    
    await ActivityLog.create({ 
      user: req.user._id, 
      action: 'update_category', 
      description: `Updated category '${category.name}'` 
    });
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (err) {
    res.status(400).json({ message: 'Error updating category', error: err.message });
  }
});

// Delete a category (admin only)
router.delete('/:id', requireAuth, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Check if category has products
    const Product = require('../models/Product');
    const productCount = await Product.countDocuments({ category: category._id });
    
    if (productCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. It has ${productCount} associated products.` 
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    
    await ActivityLog.create({ 
      user: req.user._id, 
      action: 'delete_category', 
      description: `Deleted category '${category.name}'` 
    });
    
    res.json({ 
      success: true,
      message: 'Category deleted successfully',
      data: category
    });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting category', error: err.message });
  }
});

// PUT /api/categories/bulk/status - Bulk update category statuses (admin only)
router.put('/bulk/status', requireAuth, admin, async (req, res, next) => {
  try {
    const { categoryIds, active, featured } = req.body;

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ message: 'Category IDs array is required' });
    }

    const updateData = {};
    if (active !== undefined) updateData.active = active;
    if (featured !== undefined) updateData.featured = featured;

    const result = await Category.updateMany(
      { _id: { $in: categoryIds } },
      updateData
    );

    // Log the activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'bulk_update_categories',
      description: `Bulk updated ${result.modifiedCount} categories`
    });

    res.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} categories`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/categories/analytics/summary - Get category analytics (admin only)
router.get('/analytics/summary', requireAuth, admin, async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    
    const analytics = await Category.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'products'
        }
      },
      {
        $project: {
          name: 1,
          productCount: { $size: '$products' },
          activeProducts: {
            $size: {
              $filter: {
                input: '$products',
                cond: { $eq: ['$$this.archived', false] }
              }
            }
          },
          featured: 1,
          active: 1
        }
      },
      {
        $group: {
          _id: null,
          totalCategories: { $sum: 1 },
          activeCategories: { $sum: { $cond: ['$active', 1, 0] } },
          featuredCategories: { $sum: { $cond: ['$featured', 1, 0] } },
          totalProducts: { $sum: '$productCount' },
          avgProductsPerCategory: { $avg: '$productCount' }
        }
      }
    ]);

    const result = analytics[0] || {
      totalCategories: 0,
      activeCategories: 0,
      featuredCategories: 0,
      totalProducts: 0,
      avgProductsPerCategory: 0
    };

    res.json({
      success: true,
      analytics: result
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/categories/:id/products - Get products in a category
router.get('/:id/products', async (req, res, next) => {
  try {
    const { page, limit, sortBy = 'name', sortOrder = 'asc' } = req.query;
    const paginationParams = parsePaginationParams({ page, limit });

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const filters = { category: req.params.id, archived: false };
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const Product = require('../models/Product');
    const result = await executePaginatedQuery(Product, filters, paginationParams, {
      sort: sort,
      populate: 'category'
    });

    res.json(createPaginatedResponse(result.data, result.page, result.limit, result.total));
  } catch (err) {
    next(err);
  }
});

module.exports = router; 