const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const { body, validationResult } = require('express-validator');
const ActivityLog = require('../models/ActivityLog');
const { parsePaginationParams, executePaginatedQuery, createPaginatedResponse } = require('../utils/pagination');
const { 
  sendSuccess, 
  sendError, 
  sendCreated, 
  sendUpdated, 
  sendDeleted, 
  sendNotFound, 
  sendConflict, 
  sendValidationError,
  sendPaginated
} = require('../utils/responseHandler');

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

    // Return just the array for frontend compatibility
    return sendSuccess(res, 200, 'Categories retrieved successfully', result.data);
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

    return sendSuccess(res, 200, 'Featured categories retrieved successfully', categories);
  } catch (err) {
    next(err);
  }
});

// Create a new category (admin only)
router.post('/', requireAuth, requireAdmin, [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendValidationError(res, errors.array());
  }
  try {
    const { name, description, featured, active, sortOrder, image } = req.body;
    
    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingCategory) {
      return sendConflict(res, 'Category');
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
    
    return sendCreated(res, 'Category created successfully', category);
  } catch (err) {
    next(err);
  }
});

// Update a category (admin only)
router.put('/:id', requireAuth, requireAdmin, [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendValidationError(res, errors.array());
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
        return sendConflict(res, 'Category');
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, featured, active, sortOrder, image },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return sendNotFound(res, 'Category');
    }
    
    await ActivityLog.create({ 
      user: req.user._id, 
      action: 'update_category', 
      description: `Updated category '${category.name}'` 
    });
    
    return sendUpdated(res, 'Category updated successfully', category);
  } catch (err) {
    next(err);
  }
});

// Delete a category (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return sendNotFound(res, 'Category');
    }

    // Check if category has products
    const Product = require('../models/Product');
    const productCount = await Product.countDocuments({ category: category._id });
    
    if (productCount > 0) {
      return sendError(res, 400, `Cannot delete category. It has ${productCount} associated products.`, null, 'CATEGORY_HAS_PRODUCTS');
    }

    await Category.findByIdAndDelete(req.params.id);
    
    await ActivityLog.create({ 
      user: req.user._id, 
      action: 'delete_category', 
      description: `Deleted category '${category.name}'` 
    });
    
    return sendDeleted(res, 'Category deleted successfully');
  } catch (err) {
    next(err);
  }
});

// PUT /api/categories/bulk/status - Bulk update category statuses (admin only)
router.put('/bulk/status', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { categoryIds, active, featured } = req.body;

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return sendError(res, 400, 'Category IDs array is required', null, 'INVALID_CATEGORY_IDS');
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

    return sendSuccess(res, 200, `Successfully updated ${result.modifiedCount} categories`, {
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/categories/stats - Get category statistics (admin only)
router.get('/stats', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ active: true });
    const featuredCategories = await Category.countDocuments({ featured: true });

    // Get categories with product counts
    const Product = require('../models/Product');
    const categoriesWithProductCounts = await Category.aggregate([
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
          active: 1,
          featured: 1
        }
      },
      { $sort: { productCount: -1 } }
    ]);

    const stats = {
      totalCategories,
      activeCategories,
      featuredCategories,
      categoriesWithProductCounts
    };

    return sendSuccess(res, 200, 'Category statistics retrieved successfully', stats);
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
      return sendNotFound(res, 'Category');
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

    return sendPaginated(
      res,
      result.data,
      paginationParams.page,
      paginationParams.limit,
      result.total,
      'Products in category retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
});

module.exports = router; 