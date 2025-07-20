// Migration script to convert homepageSlot to placement array
// Run this script once to migrate existing products

const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const migratePlacement = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    // Find all products with homepageSlot that is not empty
    const productsToMigrate = await Product.find({
      homepageSlot: { $exists: true, $ne: "" }
    });

    console.log(`Found ${productsToMigrate.length} products to migrate`);

    if (productsToMigrate.length === 0) {
      console.log('No products need migration');
      return;
    }

    // Migrate each product
    for (const product of productsToMigrate) {
      console.log(`Migrating product: ${product.name} (${product._id})`);
      console.log(`  Current homepageSlot: "${product.homepageSlot}"`);

      // Create placement array from homepageSlot
      const placement = [
        {
          page: 'home',
          slot: product.homepageSlot
        }
      ];

      // Update the product
      await Product.findByIdAndUpdate(product._id, {
        $set: { placement },
        $unset: { homepageSlot: "" }
      });

      console.log(`  Migrated to placement:`, placement);
    }

    console.log('Migration completed successfully!');
    console.log(`Migrated ${productsToMigrate.length} products`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration
migratePlacement(); 