require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');

const IMAGES_DIR = path.join(__dirname, 'uploads', 'images');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  await fixProductImages();
  mongoose.connection.close();
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function fixProductImages() {
  const products = await Product.find({});
  let updated = 0;
  let missingFiles = 0;

  for (const product of products) {
    let img = product.image;
    if (!img) continue;

    // Remove leading slash, ensure it starts with 'images/'
    if (img.startsWith('/')) img = img.slice(1);
    if (!img.startsWith('images/')) img = 'images/' + img.replace(/^.*images[\\/]/, '');

    // Check if file exists
    const filePath = path.join(IMAGES_DIR, path.basename(img));
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File missing for product "${product.name}": ${filePath}`);
      missingFiles++;
    }

    // Update if changed
    if (product.image !== img) {
      product.image = img;
      await product.save();
      updated++;
      console.log(`✅ Updated image path for "${product.name}" to "${img}"`);
    }
  }

  console.log(`\nSummary:`);
  console.log(`- Updated products: ${updated}`);
  console.log(`- Products with missing image files: ${missingFiles}`);
  console.log('Done!');
}