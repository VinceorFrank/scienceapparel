const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, admin } = require('../middlewares/auth');
const buildFilters = require('../utils/buildFilters'); // adjust path if needed
const { body, validationResult } = require('express-validator');
const { validateProductUpdate } = require('../middlewares/validators/productValidators');
const Order = require('../models/Order');
const fs = require('fs');
const path = require('path');


// @desc    Get all products
// @route   GET /api/products
router.get('/', async (req, res) => {
  try {
    const filters = buildFilters(req.query);


const page = Number(req.query.page) || 1;
const limit = Number(req.query.limit) || 10;
const skip = (page - 1) * limit;

//sort logic with validation
const allowedSortFields = ['price', 'name', 'createdAt', 'rating', 'numReviews'];
let sort = req.query.sort;

if (sort) {
  const sortFields = sort.split(',');
  const isValid = sortFields.every(field => {
    const cleanField = field.replace('-', '');
    return allowedSortFields.includes(cleanField);
  });

  if (!isValid) {
    sort = '-rating,-numReviews'; // fallback default
  }
} else {
  sort = '-rating,-numReviews'; // default
}

const products = await Product.find({ ...filters })
  .sort(sort)  // 👈 New line: apply sorting
  .skip(skip)
  .limit(limit);

// Optional: total number of products for frontend pagination
const total = await Product.countDocuments({ ...filters });

res.json({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  products,
});
    
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



// @desc    Create a new product
// @route   POST /api/products
router.post(
  '/',
  protect,
  admin,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description, price, image, stock, category } = req.body;

      const newProduct = new Product({
        name,
        description,
        price,
        image,
        stock,
        category,
      });

      await newProduct.save();
      res.status(201).json(newProduct);
    } catch (err) {
      res.status(400).json({ message: 'Error creating product', error: err.message });
    }
  }
);

// @desc    Update a product
// @route   PUT /api/products/:id
router.put(
  '/:id',
  protect,
  admin,
  validateProductUpdate,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });

      res.json({ message: 'Product updated', product: updatedProduct });
    } catch (err) {
      res.status(400).json({ message: 'Error updating product', error: err.message });
    }
  }
);

// @desc    Delete a product
// @route   DELETE /api/products/:id
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Delete image file if it exists
    if (deletedProduct.image) {
      const imagePath = path.join(__dirname, '../uploads', deletedProduct.image);
      fs.unlink(imagePath, (err) => {
        // Ignore error if file does not exist
      });
    }
    res.json({ message: 'Product deleted', product: deletedProduct });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
});

// @desc    Add a review to a product
// @route   POST /api/products/:id/reviews
router.post('/:id/reviews', protect, async (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user._id;
  const userName = req.user.name;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === userId.toString()
    );
    if (alreadyReviewed)
      return res.status(400).json({ message: 'Product already reviewed by this user' });

    if (!comment || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Please provide a rating (1–5) and comment' });
    }

    const review = {
      user: userId,
      name: userName,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;

    product.rating = (
      product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.numReviews
    ).toFixed(1); // One decimal

    await product.save();

    res.status(201).json({ message: 'Review added', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
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
// @route   GET /api/products/stats
router.get('/stats', protect, admin, async (req, res) => {
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
    // ➕ New stats
    const featuredCount = await Product.countDocuments({ featured: true });
    const archivedCount = await Product.countDocuments({ archived: true });
    const onSaleCount = await Product.countDocuments({ discountPrice: { $ne: null } });

    const tagStats = await Product.aggregate([
  { $unwind: '$tags' },
  { $group: { _id: '$tags', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);



    res.json({
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
});

// ✅ These two lines close the route properly:
} catch (err) {
  res.status(500).json({ message: 'Error retrieving stats', error: err.message });
}
});



// @desc    Get a single product by ID
// @route   GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json(product); // includes rating, numReviews, etc.
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @desc    Export products to CSV
// @route   GET /api/products/export
router.get('/export', protect, admin, async (req, res) => {
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
  } catch (err) {
    res.status(500).json({ message: 'Error exporting products', error: err.message });
  }
});

// @desc    Import products from CSV
// @route   POST /api/products/import
router.post('/import', protect, admin, async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: 'No file uploaded' });
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
      message: 'Import completed',
      results
    });
  } catch (err) {
    res.status(500).json({ message: 'Error importing products', error: err.message });
  }
});

module.exports = router;
