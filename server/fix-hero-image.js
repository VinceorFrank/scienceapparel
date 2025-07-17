const mongoose = require('mongoose');
const PageAsset = require('./models/PageAsset');
require('dotenv').config();

async function fixHeroImage() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
    console.log('Connecting to MongoDB with URI:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find the hero asset for home page
    const heroAsset = await PageAsset.findOne({ pageSlug: 'home', slot: 'hero' });
    
    if (heroAsset) {
      console.log('Found hero asset. Current imageUrl:', heroAsset.imageUrl);
      
      // Define the correct image URL (without .png extension)
      const correctImageUrl = '/uploads/images/8745bbd60e6c75cc6864615a6ec717f6';
      
      if (heroAsset.imageUrl !== correctImageUrl) {
        heroAsset.imageUrl = correctImageUrl;
        await heroAsset.save();
        console.log('Hero image URL fixed successfully to:', heroAsset.imageUrl);
      } else {
        console.log('Hero image URL is already correct:', heroAsset.imageUrl);
      }
    } else {
      console.log('Hero asset not found for home page.');
    }
  } catch (error) {
    console.error('Error fixing hero image:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixHeroImage(); 