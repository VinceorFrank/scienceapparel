const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, admin } = require('../middlewares/auth');
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
const { cache, invalidateEntityCache } = require('../utils/cache');
const { performanceMonitor } = require('../utils/performance');
const Order = require('../models/Order');
const fs = require('fs');
const path = require('path');
const ActivityLog = require('../models/ActivityLog');

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
    cache.set(cacheKey, result, 300000);

    res.json(createPaginatedResponse(
      result.data,
      paginationParams.page,
      paginationParams.limit,
      result.total
    ));
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
    const cachedProduct = cache.get(cacheKey);
    
    if (cachedProduct) {
      return res.json({
        success: true,
        data: cachedProduct
      });
    }

    const product = await Product.findById(req.params.id)
      .populate('category', 'name description')
      .populate('reviews.user', 'name');

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Cache the product for 10 minutes
    cache.set(cacheKey, product, 600000);

    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
router.post('/', protect, admin, validateProductCreate, validateRequest, async (req, res, next) => {
  try {
    const { name, description, price, image, stock, category, featured, archived, discountPrice, tags } = req.body;

    // Check if product with same name already exists
    const existingProduct = await Product.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Product with this name already exists',
          statusCode: 400
        }
      });
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
    invalidateEntityCache('products');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
router.put('/:id', protect, admin, validateProductUpdate, validateRequest, async (req, res, next) => {
  try {
    const { name } = req.body;

    // If name is being updated, check for duplicates
    if (name) {
      const existingProduct = await Product.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Product with this name already exists',
            statusCode: 400
          }
        });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!updatedProduct) {
      throw new NotFoundError('Product not found');
    }

    // Log the activity
    await ActivityLog.create({ 
      user: req.user._id, 
      action: 'update_product', 
      description: `Updated product '${updatedProduct.name}'` 
    });

    // Invalidate related cache
    invalidateEntityCache('products', req.params.id);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, validateProductId, validateRequest, async (req, res, next) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    
    if (!deletedProduct) {
      throw new NotFoundError('Product not found');
    }

    // Delete image file if it exists
    if (deletedProduct.image) {
      const imagePath = path.join(__dirname, '../uploads', deletedProduct.image);
      fs.unlink(imagePath, (err) => {
        // Ignore error if file does not exist
        if (err && err.code !== 'ENOENT') {
          console.error('Error deleting image file:', err);
        }
      });
    }

    // Log the activity
    await ActivityLog.create({ 
      user: req.user._id, 
      action: 'delete_product', 
      description: `Deleted product '${deletedProduct.name}'` 
    });

    // Invalidate related cache
    invalidateEntityCache('products', req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: deletedProduct
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Add a review to a product
// @route   POST /api/products/:id/reviews
// @access  Private
router.post('/:id/reviews', protect, validateReviewCreate, validateRequest, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user._id;
    const userName = req.user.name;

    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Check if user already reviewed this product
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === userId.toString()
    );
    
    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Product already reviewed by this user',
          statusCode: 400
        }
      });
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
    invalidateEntityCache('products', req.params.id);

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: review
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Add a review via secure token (no login required)
// @route   POST /api/products/:id/review-token
router.post('/:id/review-token', async (req, res) => {
  const { token, name, rating, comment } = req.body;

  try {
    const order = await Order.findOne({ reviewToken: token });

    if (!order) {
      return res.status(400).json({ message: 'Invalid or expired review token' });
    }

    const productId = req.params.id;
    const orderedProductIds = order.orderItems.map(item => item.product.toString());

    if (!orderedProductIds.includes(productId)) {
      return res.status(403).json({ message: 'This token does not grant review rights to this product' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Optional: check for duplicate name-based review
    const alreadyReviewed = product.reviews.find(r => r.name === name);
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'This person already reviewed the product' });
    }

    if (!rating || !comment || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Please provide a valid rating (1–5) and comment' });
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

    res.status(201).json({ message: 'Review submitted via token', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @desc    Get product review statistics (admin only)
// @route   GET /api/products/stats/reviews
// @access  Private/Admin
router.get('/stats/reviews', protect, admin, async (req, res, next) => {
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

    res.json({
      success: true,
      data: {
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
      }
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Export products to CSV
// @route   GET /api/products/export
// @access  Private/Admin
router.get('/export', protect, admin, async (req, res, next) => {
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
router.post('/import', protect, admin, async (req, res, next) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No file uploaded',
          statusCode: 400
        }
      });
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

    res.json({
      success: true,
      message: 'Import completed',
      data: results
    });

    await ActivityLog.create({ 
      user: req.user._id, 
      action: 'import_products', 
      description: `Imported products from CSV (${results.success} success, ${results.failed} failed)` 
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
