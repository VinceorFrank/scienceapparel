// scripts/migrateFeatured.js

const mongoose = require('mongoose');
const Product = require('../server/models/Product');
const { HOMEPAGE_SLOTS } = require('../server/utils/config');

// Load environment variables
require('dotenv').config({ path: '../server/.env' });

async function runMigration() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
  
  console.log('Connecting to MongoDB...');
  console.log('URI:', mongoUri.replace(/\/\/.*@/, '//***@')); // Hide credentials in logs
  
  try {
    await mongoose.connect(mongoUri, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('✅ Connected to DB successfully');

    // 1) Migrate featured:true → homepageSlot:'featuredTop', visibility:'visible'
    const featuredResult = await Product.updateMany(
      { featured: true },
      {
        $set: {
          homepageSlot: 'featuredTop',
          visibility: 'visible'
        },
        $unset: { featured: '', archived: '' }
      }
    );
    console.log(`✅ Migrated ${featuredResult.modifiedCount} featured products.`);

    // 2) Migrate archived:true → visibility:'archived'
    const archivedResult = await Product.updateMany(
      { archived: true, featured: { $ne: true } },
      {
        $set: { visibility: 'archived' },
        $unset: { archived: '' }
      }
    );
    console.log(`✅ Migrated ${archivedResult.modifiedCount} archived products.`);

    // 3) For all others, ensure defaults
    const defaultResult = await Product.updateMany(
      { homepageSlot: { $exists: false } },
      { $set: { homepageSlot: '', visibility: 'visible' } }
    );
    console.log(`✅ Defaulted ${defaultResult.modifiedCount} products without slot/visibility.`);

    // 4) Show summary
    const totalProducts = await Product.countDocuments();
    const visibleProducts = await Product.countDocuments({ visibility: 'visible' });
    const hiddenProducts = await Product.countDocuments({ visibility: 'hidden' });
    const archivedProducts = await Product.countDocuments({ visibility: 'archived' });
    
    console.log('\n📊 Migration Summary:');
    console.log(`Total products: ${totalProducts}`);
    console.log(`Visible: ${visibleProducts}`);
    console.log(`Hidden: ${hiddenProducts}`);
    console.log(`Archived: ${archivedProducts}`);

    await mongoose.disconnect();
    console.log('✅ Migration complete, disconnected from DB.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

runMigration().catch(err => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
}); 