const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

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
router.post('/', async (req, res) => {
  try {
    const { name, description, price, image, countInStock, category } = req.body;

    const newProduct = new Product({
      name,
      description,
      price,
      image,
      countInStock,
      category,
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product created', product: newProduct });
  } catch (err) {
    res.status(400).json({ message: 'Error creating product', error: err.message });
  }
});

module.exports = router;




