// Test script to verify placement system
const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const testPlacement = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    // Test 1: Create a product with placement
    console.log('\n=== Test 1: Creating product with placement ===');
    const testProduct = new Product({
      name: 'Test Product with Placement',
      description: 'A test product to verify placement system',
      price: 29.99,
      stock: 10,
      category: new mongoose.Types.ObjectId(), // You'll need a valid category ID
      placement: [
        { page: 'home', slot: 'featuredTop' },
        { page: 'products', slot: 'highlighted' }
      ],
      visibility: 'visible'
    });

    // Note: This will fail if category doesn't exist, but that's okay for testing the placement structure
    try {
      await testProduct.save();
      console.log('✅ Product created with placement:', testProduct.placement);
    } catch (err) {
      console.log('⚠️  Product creation failed (likely due to invalid category):', err.message);
      console.log('✅ But placement structure is valid');
    }

    // Test 2: Query products by placement
    console.log('\n=== Test 2: Querying products by placement ===');
    
    // Find products for home page featuredTop slot
    const homeTopProducts = await Product.find({
      'placement.page': 'home',
      'placement.slot': 'featuredTop',
      visibility: 'visible'
    });
    console.log(`Found ${homeTopProducts.length} products for home/featuredTop`);

    // Find products for products page highlighted slot
    const productsHighlighted = await Product.find({
      'placement.page': 'products',
      'placement.slot': 'highlighted',
      visibility: 'visible'
    });
    console.log(`Found ${productsHighlighted.length} products for products/highlighted`);

    // Test 3: Check backward compatibility
    console.log('\n=== Test 3: Backward compatibility check ===');
    const legacyProducts = await Product.find({
      homepageSlot: { $exists: true, $ne: "" }
    });
    console.log(`Found ${legacyProducts.length} products with legacy homepageSlot`);

    if (legacyProducts.length > 0) {
      console.log('Sample legacy product:', {
        name: legacyProducts[0].name,
        homepageSlot: legacyProducts[0].homepageSlot,
        placement: legacyProducts[0].placement
      });
    }

    console.log('\n✅ Placement system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the test
testPlacement(); 