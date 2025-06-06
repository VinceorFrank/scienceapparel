const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, admin } = require('../middlewares/auth');

// @desc    Get all products
// @route   GET /api/products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @desc    Create a new product
// @route   POST /api/products
router.post('/', protect, admin, async (req, res) => {
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
    res.status(201).json({ message: 'Product created', product: newProduct });
  } catch (err) {
    res.status(400).json({ message: 'Error creating product', error: err.message });
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
router.put('/:id', async (req, res) => {
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
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted', product: deletedProduct });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
});

// @desc    Add a review to a product
// @route   POST /api/products/:id/reviews
router.post('/:id/reviews', async (req, res) => {
  const { name, rating, comment, user } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === user
    );
    if (alreadyReviewed) return res.status(400).json({ message: 'Product already reviewed by this user' });

    const review = {
      user,
      name,
      rating: Number(rating),
      comment
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, r) => r.rating + acc, 0) / product.numReviews;

    await product.save();
    res.status(201).json({ message: 'Review added', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;



