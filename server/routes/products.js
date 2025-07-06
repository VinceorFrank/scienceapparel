const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const { buildFilters, buildSortObject } = require('../utils/buildFilters');
const { validateRequest } = require('../middlewares/errorHandler');
const { 
  validateProductCreate, 
  validateProductUpdate, 
  validateProductQuery, 
  validateProductId,
  validateReviewCreate 
} = require('../middlewares/validators/productValidators');
const { NotFoundError } = require('../middlewares/errorHandler');
const { 
  parsePaginationParams, 
  executePaginatedQuery, 
  createPaginatedResponse 
} = require('../utils/pagination');
const { cacheManager } = require('../utils/advancedCache');
const { performanceMonitor } = require('../utils/performance');
const Order = require('../models/Order');
const fs = require('fs');
const path = require('path');
const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');
const { 
  sendSuccess, 
  sendError, 
  sendPaginated, 
  sendCreated, 
  sendUpdated, 
  sendDeleted, 
  sendNotFound, 
  sendConflict 
} = require('../utils/responseHandler');

// @desc    Get all products with advanced pagination and filtering
// @route   GET /api/products
// @access  Public
router.get('/', validateProductQuery, validateRequest, async (req, res, next) => {
  try {
    // Parse pagination parameters
    const paginationParams = parsePaginationParams(req.query, {
      defaultLimit: 12,
      maxLimit: 50
    });

    // Build filters
    const filters = buildFilters(req.query, 'product');

    // Build sort object
    const allowedSortFields = {
      price: 1,
      name: 1,
      createdAt: 1,
      rating: 1,
      numReviews: 1
    };
    const sort = buildSortObject(req.query.sort, allowedSortFields);

    // Execute paginated query with performance monitoring
    const startTime = process.hrtime.bigint();
    
    const result = await executePaginatedQuery(
      Product,
      filters,
      paginationParams,
      {
        sort: sort,
        populate: 'category',
        lean: true
      }
    );

    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;
    
    // Track query performance
    performanceMonitor.trackQuery(
      'find',
      'products',
      filters,
      duration,
      result.data.length
    );

    // Cache the result for 5 minutes
    const cacheKey = `products:${JSON.stringify(req.query)}`;
    await cacheManager.set(cacheKey, result, { ttl: 300 });

    return sendPaginated(
      res,
      result.data,
      paginationParams.page,
      paginationParams.limit,
      result.total,
      'Products retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
});

// @desc    Get all products for the admin panel
// @route   GET /api/products/admin
// @access  Private/Admin
router.get('/admin', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { page, limit, search, category } = req.query;
    const paginationParams = parsePaginationParams({ page, limit });

    const filters = {};
    if (search) {
      filters.name = { $regex: search, $options: 'i' };
    }
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filters.category = category;
    }

    const result = await executePaginatedQuery(
      Product,
      filters,
      paginationParams,
      {
        populate: 'category',
        sort: { createdAt: -1 }
      }
    );

    return sendPaginated(
      res,
      result.data,
      paginationParams.page,
      paginationParams.limit,
      result.total,
      'Admin products retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', validateProductId, validateRequest, async (req, res, next) => {
  try {
    // Try to get from cache first
    const cacheKey = `product:${req.params.id}`;
    const cachedProduct = await cacheManager.get(cacheKey);
    
    if (cachedProduct) {
      return sendSuccess(res, 200, 'Product retrieved successfully', cachedProduct);
    }

    const product = await Product.findById(req.params.id)
      .populate('category', 'name description')
      .populate('reviews.user', 'name');

    if (!product) {
      return sendNotFound(res, 'Product');
    }

    // Cache the product for 10 minutes
    await cacheManager.set(cacheKey, product, { ttl: 600 });

    return sendSuccess(res, 200, 'Product retrieved successfully', product);
  } catch (err) {
    next(err);
  }
});

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
router.post('/', requireAuth, requireAdmin, (req, res, next) => {
  // Defensive fix: ensure tags is always an array
  if (req.body.tags && !Array.isArray(req.body.tags)) {
    req.body.tags = [];
  }
  next();
}, validateProductCreate, validateRequest, async (req, res, next) => {
  try {
    const { name, description, price, image, stock, category, featured, archived, discountPrice, tags } = req.body;

    // Check if product with same name already exists
    const existingProduct = await Product.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingProduct) {
      return sendConflict(res, 'Product');
    }

    const newProduct = new Product({
      name,
      description,
      price,
      image,
      stock,
      category,
      featured: featured || false,
      archived: archived || false,
      discountPrice,
      tags: tags || []
    });

    await newProduct.save();
    
    // Log the activity
    await ActivityLog.create({ 
      user: req.user._id, 
      action: 'create_product', 
      description: `Created product '${newProduct.name}'` 
    });

    // Invalidate related cache
    await cacheManager.invalidateByTags(['products']);

    return sendCreated(res, 'Product created successfully', newProduct);
  } catch (err) {
    next(err);
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
router.put('/:id', requireAuth, requireAdmin, (req, res, next) => {
  // Defensive fix: ensure tags is always an array
  if (req.body.tags && !Array.isArray(req.body.tags)) {
    req.body.tags = [];
  }
  next();
}, validateProductUpdate, validateRequest, async (req, res, next) => {
  try {
    const { name } = req.body;

    // If name is being updated, check for duplicates
    if (name) {
      const existingProduct = await Product.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      
      if (existingProduct) {
        return sendConflict(res, 'Product');
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!updatedProduct) {
      return sendNotFound(res, 'Product');
    }

    // Log the activity
    await ActivityLog.create({ 
      user: req.user._id, 
      action: 'update_product', 
      description: `Updated product '${updatedProduct.name}'` 
    });

    // Invalidate caches
    await cacheManager.invalidateByTags(['products']);
    await cacheManager.delete(`product:${req.params.id}`);

    return sendUpdated(res, 'Product updated successfully', updatedProduct);
    
  } catch (err) {
    next(err);
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete('/:id', requireAuth, requireAdmin, validateProductId, validateRequest, async (req, res, next) => {
  try {
    const productId = req.params.id;
    
    const product = await Product.findById(productId);

    if (!product) {
      return sendNotFound(res, 'Product');
    }

    // Check if the product is in any existing orders
    const orderCount = await Order.countDocuments({ 'orderItems.product': productId });

    if (orderCount > 0) {
      // If the product is in an order, archive it instead of deleting
      product.archived = true;
      await product.save();
      
      await ActivityLog.create({ 
        user: req.user._id, 
        action: 'archive_product', 
        description: `Archived product '${product.name}' due to being part of ${orderCount} order(s)` 
      });

      return sendSuccess(res, 200, `Product is part of ${orderCount} order(s) and has been archived instead of deleted.`);
    } else {
      // If not in any orders, delete it permanently
      const imagePath = product.image;
      
      await Product.findByIdAndDelete(productId);

      // And delete its image from the server
      if (imagePath && imagePath.startsWith('/uploads/images/')) {
        const serverImagePath = path.join(__dirname, '..', imagePath);
        
        // Check if file exists before attempting deletion
        if (fs.existsSync(serverImagePath)) {
          fs.unlink(serverImagePath, (err) => {
            if (err) {
              // Log error but don't fail the request
              const { logger } = require('../utils/logger');
              logger.error('Failed to delete image file', {
                path: serverImagePath,
                error: err.message
              });
        }
          });
        }
      }
      
      await ActivityLog.create({ 
        user: req.user._id, 
        action: 'delete_product', 
        description: `Permanently deleted product '${product.name}'` 
      });

      return sendDeleted(res, 'Product permanently deleted successfully');
    }

    // Invalidate cache after delete/archive
    await cacheManager.invalidateByTags(['products']);
    await cacheManager.delete(`product:${productId}`);

  } catch (err) {
    next(err);
  }
});

// @desc    Add a review to a product
// @route   POST /api/products/:id/reviews
// @access  Private
router.post('/:id/reviews', requireAuth, validateReviewCreate, validateRequest, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user._id;
    const userName = req.user.name;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return sendNotFound(res, 'Product');
    }

    // Check if user already reviewed this product
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === userId.toString()
    );
    
    if (alreadyReviewed) {
      return sendConflict(res, 'Review');
    }

    const review = {
      user: userId,
      name: userName,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;

    // Calculate new average rating
    product.rating = (
      product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.numReviews
    ).toFixed(1);

    await product.save();

    // Invalidate product cache
    await cacheManager.invalidateByTags(['products']);
    await cacheManager.delete(`product:${req.params.id}`);

    return sendCreated(res, 'Review added successfully', review);
  } catch (err) {
    next(err);
  }
});

// @desc    Add a review via secure token (no login required)
// @route   POST /api/products/:id/review-token
router.post('/:id/review-token', async (req, res, next) => {
  const { token, name, rating, comment } = req.body;

  try {
    const order = await Order.findOne({ reviewToken: token });

    if (!order) {
      return sendError(res, 400, 'Invalid or expired review token', null, 'INVALID_TOKEN');
    }

    const productId = req.params.id;
    const orderedProductIds = order.orderItems.map(item => item.product.toString());

    if (!orderedProductIds.includes(productId)) {
      return sendError(res, 403, 'This token does not grant review rights to this product', null, 'INSUFFICIENT_PERMISSIONS');
    }

    const product = await Product.findById(productId);
    if (!product) {
      return sendNotFound(res, 'Product');
    }

    // Optional: check for duplicate name-based review
    const alreadyReviewed = product.reviews.find(r => r.name === name);
    if (alreadyReviewed) {
      return sendConflict(res, 'Review');
    }

    if (!rating || !comment || rating < 1 || rating > 5) {
      return sendError(res, 400, 'Please provide a valid rating (1–5) and comment', null, 'INVALID_RATING');
    }

    const review = {
      user: null, // no user account
      name,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating = (
      product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.numReviews
    ).toFixed(1);

    await product.save();

    // Invalidate token after use
    order.reviewToken = null;
    await order.save();

    return sendCreated(res, 'Review submitted via token', review);
  } catch (err) {
    next(err);
  }
});

// @desc    Get product review statistics (admin only)
// @route   GET /api/products/stats/reviews
// @access  Private/Admin
router.get('/stats/reviews', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();

    const avgRating = await Product.aggregate([
      { $match: { numReviews: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: '$numReviews' }
        }
      }
    ]);

    const avgPrice = await Product.aggregate([
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$price' }
        }
      }
    ]);

    const highestPriceProduct = await Product.findOne().sort({ price: -1 });
    const lowStockProducts = await Product.find({ stock: { $gt: 0, $lt: 5 } });

    const topRated = await Product.find().sort({ rating: -1 }).limit(5);
    const mostReviewed = await Product.find().sort({ numReviews: -1 }).limit(5);

    const productsPerCategory = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const reviewsPerCategory = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalReviews: { $sum: '$numReviews' }
        }
      },
      { $sort: { totalReviews: -1 } }
    ]);

    const outOfStockCount = await Product.countDocuments({ stock: { $lte: 0 } });
    const fiveStarOnlyCount = await Product.countDocuments({ rating: 5 });
    const featuredCount = await Product.countDocuments({ featured: true });
    const archivedCount = await Product.countDocuments({ archived: true });
    const onSaleCount = await Product.countDocuments({ discountPrice: { $ne: null } });

    const tagStats = await Product.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const data = {
        totals: {
          totalProducts,
          totalReviews: avgRating[0]?.totalReviews || 0,
          averageRating: avgRating[0]?.avgRating.toFixed(1) || 0,
          averagePrice: avgPrice[0]?.avgPrice.toFixed(2) || 0,
          outOfStockCount,
          fiveStarOnlyCount,
          lowStockCount: lowStockProducts.length
        },
        topRated,
        mostReviewed,
        highestPriceProduct,
        lowStockProducts,
        productsPerCategory: productsPerCategory.reduce((acc, cat) => {
          acc[cat._id] = cat.count;
          return acc;
        }, {}),
        reviewsPerCategory: reviewsPerCategory.reduce((acc, cat) => {
          acc[cat._id] = cat.totalReviews;
          return acc;
        }, {}),
        customStats: {
          featuredCount,
          archivedCount,
          onSaleCount,
          tags: tagStats.reduce((acc, tag) => {
            acc[tag._id] = tag.count;
            return acc;
          }, {})
        }
    };

    return sendSuccess(res, 200, 'Product statistics retrieved successfully', data);
  } catch (err) {
    next(err);
  }
});

// @desc    Export products to CSV
// @route   GET /api/products/export
// @access  Private/Admin
router.get('/export', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const products = await Product.find().select('-reviews');
    
    // Convert products to CSV format
    const csvHeader = 'Name,Description,Price,Stock,Category,Featured,Archived,DiscountPrice,Tags\n';
    const csvRows = products.map(product => {
      return [
        `"${product.name}"`,
        `"${product.description}"`,
        product.price,
        product.stock,
        `"${product.category}"`,
        product.featured,
        product.archived,
        product.discountPrice || '',
        `"${product.tags.join(',')}"`
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    
    res.send(csv);

    await ActivityLog.create({ 
      user: req.user._id, 
      action: 'export_products', 
      description: 'Exported products to CSV' 
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Import products from CSV
// @route   POST /api/products/import
// @access  Private/Admin
router.post('/import', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (!req.files || !req.files.file) {
      return sendError(res, 400, 'No file uploaded', null, 'NO_FILE');
    }

    const file = req.files.file;
    const fileContent = file.data.toString();
    const rows = fileContent.split('\n');
    
    // Skip header row
    const dataRows = rows.slice(1);
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const row of dataRows) {
      if (!row.trim()) continue;

      const [
        name,
        description,
        price,
        stock,
        category,
        featured,
        archived,
        discountPrice,
        tags
      ] = row.split(',').map(field => field.trim().replace(/^"|"$/g, ''));

      try {
        const product = new Product({
          name,
          description,
          price: parseFloat(price),
          stock: parseInt(stock),
          category,
          featured: featured === 'true',
          archived: archived === 'true',
          discountPrice: discountPrice ? parseFloat(discountPrice) : null,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        });

        await product.save();
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          row: row,
          error: err.message
        });
      }
    }

    await ActivityLog.create({ 
      user: req.user._id, 
      action: 'import_products', 
      description: `Imported products from CSV (${results.success} success, ${results.failed} failed)` 
    });

    return sendSuccess(res, 200, 'Import completed', results);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
