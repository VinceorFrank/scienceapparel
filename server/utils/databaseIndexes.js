/**
 * Database indexes setup for optimal performance
 */

const mongoose = require('mongoose');

/**
 * Create indexes for Product collection
 */
const createProductIndexes = async () => {
  try {
    const Product = mongoose.model('Product');
    
    // Text search index for name and description
    await Product.collection.createIndex(
      { name: 'text', description: 'text', tags: 'text' },
      { 
        name: 'product_text_search',
        weights: {
          name: 10,
          description: 5,
          tags: 3
        }
      }
    );

    // Compound indexes for common queries
    await Product.collection.createIndex(
      { category: 1, archived: 1, featured: 1 },
      { name: 'product_category_status' }
    );

    await Product.collection.createIndex(
      { price: 1, archived: 1 },
      { name: 'product_price_status' }
    );

    await Product.collection.createIndex(
      { rating: -1, numReviews: -1 },
      { name: 'product_rating_reviews' }
    );

    await Product.collection.createIndex(
      { createdAt: -1, archived: 1 },
      { name: 'product_created_date' }
    );

    // Index for stock queries
    await Product.collection.createIndex(
      { stock: 1, archived: 1 },
      { name: 'product_stock_status' }
    );

    // Index for discount price queries
    await Product.collection.createIndex(
      { discountPrice: 1, archived: 1 },
      { name: 'product_discount_status' }
    );

    // Unique index for product name (case insensitive)
    await Product.collection.createIndex(
      { name: 1 },
      { 
        name: 'product_name_unique',
        unique: true,
        collation: { locale: 'en', strength: 2 }
      }
    );

    console.log('✅ Product indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating Product indexes:', error.message);
  }
};

/**
 * Create indexes for User collection
 */
const createUserIndexes = async () => {
  try {
    const User = mongoose.model('User');
    
    // Text search index for name and email
    await User.collection.createIndex(
      { name: 'text', email: 'text' },
      { 
        name: 'user_text_search',
        weights: {
          name: 5,
          email: 10
        }
      }
    );

    // Compound indexes for common queries
    await User.collection.createIndex(
      { email: 1 },
      { 
        name: 'user_email_unique',
        unique: true 
      }
    );

    await User.collection.createIndex(
      { role: 1, isAdmin: 1 },
      { name: 'user_role_admin' }
    );

    await User.collection.createIndex(
      { createdAt: -1 },
      { name: 'user_created_date' }
    );

    console.log('✅ User indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating User indexes:', error.message);
  }
};

/**
 * Create indexes for Order collection
 */
const createOrderIndexes = async () => {
  try {
    const Order = mongoose.model('Order');
    
    // Compound indexes for common queries
    await Order.collection.createIndex(
      { user: 1, createdAt: -1 },
      { name: 'order_user_date' }
    );

    await Order.collection.createIndex(
      { isPaid: 1, isDelivered: 1 },
      { name: 'order_payment_delivery' }
    );

    await Order.collection.createIndex(
      { totalPrice: 1, createdAt: -1 },
      { name: 'order_total_date' }
    );

    await Order.collection.createIndex(
      { createdAt: -1 },
      { name: 'order_created_date' }
    );

    await Order.collection.createIndex(
      { paymentMethod: 1, createdAt: -1 },
      { name: 'order_payment_method' }
    );

    // Index for shipping address queries
    await Order.collection.createIndex(
      { 'shippingAddress.country': 1, createdAt: -1 },
      { name: 'order_shipping_country' }
    );

    console.log('✅ Order indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating Order indexes:', error.message);
  }
};

/**
 * Create indexes for Category collection
 */
const createCategoryIndexes = async () => {
  try {
    const Category = mongoose.model('Category');
    
    // Text search index for name and description
    await Category.collection.createIndex(
      { name: 'text', description: 'text' },
      { 
        name: 'category_text_search',
        weights: {
          name: 10,
          description: 5
        }
      }
    );

    // Unique index for category name
    await Category.collection.createIndex(
      { name: 1 },
      { 
        name: 'category_name_unique',
        unique: true,
        collation: { locale: 'en', strength: 2 }
      }
    );

    await Category.collection.createIndex(
      { createdAt: -1 },
      { name: 'category_created_date' }
    );

    console.log('✅ Category indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating Category indexes:', error.message);
  }
};

/**
 * Create indexes for ActivityLog collection
 */
const createActivityLogIndexes = async () => {
  try {
    const ActivityLog = mongoose.model('ActivityLog');
    
    // Compound indexes for common queries
    await ActivityLog.collection.createIndex(
      { user: 1, createdAt: -1 },
      { name: 'activity_user_date' }
    );

    await ActivityLog.collection.createIndex(
      { action: 1, createdAt: -1 },
      { name: 'activity_action_date' }
    );

    await ActivityLog.collection.createIndex(
      { createdAt: -1 },
      { name: 'activity_created_date' }
    );

    console.log('✅ ActivityLog indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating ActivityLog indexes:', error.message);
  }
};

/**
 * Create indexes for Payment collection
 */
const createPaymentIndexes = async () => {
  try {
    const Payment = mongoose.model('Payment');
    
    // Compound indexes for common queries
    await Payment.collection.createIndex(
      { order: 1 },
      { name: 'payment_order' }
    );

    await Payment.collection.createIndex(
      { customer: 1, createdAt: -1 },
      { name: 'payment_customer_date' }
    );

    await Payment.collection.createIndex(
      { status: 1, createdAt: -1 },
      { name: 'payment_status_date' }
    );

    await Payment.collection.createIndex(
      { stripePaymentIntentId: 1 },
      { name: 'payment_stripe_intent' }
    );

    await Payment.collection.createIndex(
      { paypalPaymentId: 1 },
      { name: 'payment_paypal_id' }
    );

    await Payment.collection.createIndex(
      { createdAt: -1 },
      { name: 'payment_created_date' }
    );

    console.log('✅ Payment indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating Payment indexes:', error.message);
  }
};

/**
 * Create all database indexes
 */
const createAllIndexes = async () => {
  console.log('🔄 Creating database indexes...');
  
  try {
    await Promise.all([
      createProductIndexes(),
      createUserIndexes(),
      createOrderIndexes(),
      createCategoryIndexes(),
      createActivityLogIndexes(),
      createPaymentIndexes()
    ]);
    
    console.log('✅ All database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
  }
};

/**
 * Get index information for all collections
 */
const getIndexInfo = async () => {
  try {
    const collections = ['products', 'users', 'orders', 'categories', 'activitylogs', 'payments'];
    const indexInfo = {};

    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.collection(collectionName);
        const indexes = await collection.indexes();
        indexInfo[collectionName] = indexes.map(index => ({
          name: index.name,
          key: index.key,
          unique: index.unique || false,
          sparse: index.sparse || false
        }));
      } catch (error) {
        console.warn(`⚠️ Could not get indexes for ${collectionName}:`, error.message);
      }
    }

    return indexInfo;
  } catch (error) {
    console.error('❌ Error getting index info:', error.message);
    return {};
  }
};

/**
 * Drop all indexes (use with caution!)
 */
const dropAllIndexes = async () => {
  console.log('⚠️ Dropping all database indexes...');
  
  try {
    const collections = ['products', 'users', 'orders', 'categories', 'activitylogs', 'payments'];
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.collection(collectionName);
        await collection.dropIndexes();
        console.log(`✅ Dropped indexes for ${collectionName}`);
      } catch (error) {
        console.warn(`⚠️ Could not drop indexes for ${collectionName}:`, error.message);
      }
    }
    
    console.log('✅ All indexes dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping indexes:', error.message);
  }
};

module.exports = {
  createAllIndexes,
  createProductIndexes,
  createUserIndexes,
  createOrderIndexes,
  createCategoryIndexes,
  createActivityLogIndexes,
  createPaymentIndexes,
  getIndexInfo,
  dropAllIndexes
}; 