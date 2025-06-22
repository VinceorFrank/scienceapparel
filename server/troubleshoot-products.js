require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');
const config = require('./config/env');

const checkProducts = async () => {
  console.log('--- Starting Product Troubleshooter ---');
  
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log('✅ MongoDB connected.');

    const products = await Product.find().limit(5).select('name image stock');
    
    if (products.length === 0) {
      console.log('🟡 No products found in the database.');
      return;
    }

    console.log(`\nFound ${products.length} products to check:`);

    for (const product of products) {
      console.log(`\n--- Checking Product: ${product.name} ---`);
      
      const imageUrl = product.image;
      console.log(`  🖼️ Image URL from DB: ${imageUrl}`);
      
      if (!imageUrl || typeof imageUrl !== 'string') {
        console.log('  ❌ Error: Image URL is missing or not a string.');
        continue;
      }
      
      // Check 1: URL format
      if (imageUrl.startsWith('http')) {
        console.log('  ✅ URL is absolute.');
      } else if (imageUrl.startsWith('/uploads/images/')) {
        console.log('  ✅ URL path is in the expected format.');
      } else {
        console.log('  ⚠️ Warning: URL path has an unexpected format.');
      }
      
      // Check 2: Physical file existence
      const imagePath = path.join(__dirname, imageUrl);
      if (fs.existsSync(imagePath)) {
        console.log(`  ✅ File exists at: ${imagePath}`);
      } else {
        // Try resolving from project root for paths like /uploads/...
        const serverRootPath = path.resolve(__dirname, '..');
        const projectRootPath = path.join(serverRootPath, imageUrl);
        if (fs.existsSync(projectRootPath)) {
            console.log(`  ✅ File exists at: ${projectRootPath}`);
        } else {
            console.log(`  ❌ Error: File NOT FOUND at: ${imagePath}`);
            console.log(`  🤔 Also checked: ${projectRootPath}`);
        }
      }
    }

  } catch (error) {
    console.error('\n--- ❌ An error occurred ---');
    console.error(error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Troubleshooter finished. MongoDB disconnected.');
  }
};

checkProducts(); 