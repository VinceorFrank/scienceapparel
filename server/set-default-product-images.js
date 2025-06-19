require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');

const DEFAULT_IMAGE = 'images/placeholder.png';
const IMAGES_DIR = path.join(__dirname, 'uploads', 'images');

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB');
  await setDefaultImages();
  mongoose.connection.close();
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function setDefaultImages() {
  const products = await Product.find({});
  let updated = 0;

  for (const product of products) {
    let img = product.image;

    // If image is missing or file does not exist, set to default
    let needsUpdate = false;
    if (!img) {
      needsUpdate = true;
    } else {
      // Remove leading slash for consistency
      if (img.startsWith('/')) img = img.slice(1);
      const filePath = path.join(IMAGES_DIR, path.basename(img));
      if (!fs.existsSync(filePath)) {
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      product.image = DEFAULT_IMAGE;
      await product.save();
      updated++;
      console.log(`✅ Set default image for "${product.name}"`);
    }
  }

  console.log(`\nSummary:`);
  console.log(`- Products updated with default image: ${updated}`);
  console.log('Done!');
}