/**
 * Database indexes setup for optimal performance
 * Automatically creates all indexes on startup
 */

const mongoose = require('mongoose');
const { logger } = require('./logger');

// Index creation status tracking
const indexCreationStatus = {
  total: 0,
  created: 0,
  failed: 0,
  errors: []
};

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

    logger.info('✅ Product indexes created successfully');
    return { success: true, count: 7 };
  } catch (error) {
    logger.error('❌ Error creating Product indexes:', error.message);
    return { success: false, error: error.message };
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

    // Index for account status queries
    await User.collection.createIndex(
      { status: 1, createdAt: -1 },
      { name: 'user_status_date' }
    );

    // Index for failed login attempts
    await User.collection.createIndex(
      { failedLoginAttempts: 1, accountLockedUntil: 1 },
      { name: 'user_login_security' }
    );

    logger.info('✅ User indexes created successfully');
    return { success: true, count: 6 };
  } catch (error) {
    logger.error('❌ Error creating User indexes:', error.message);
    return { success: false, error: error.message };
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

    // Index for order status queries
    await Order.collection.createIndex(
      { status: 1, createdAt: -1 },
      { name: 'order_status_date' }
    );

    logger.info('✅ Order indexes created successfully');
    return { success: true, count: 7 };
  } catch (error) {
    logger.error('❌ Error creating Order indexes:', error.message);
    return { success: false, error: error.message };
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

    // Index for parent category queries
    await Category.collection.createIndex(
      { parent: 1, createdAt: -1 },
      { name: 'category_parent_date' }
    );

    logger.info('✅ Category indexes created successfully');
    return { success: true, count: 4 };
  } catch (error) {
    logger.error('❌ Error creating Category indexes:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Create indexes for ActivityLog collection
 */
const createActivityLogIndexes = async () => {
  try {
    const ActivityLog = mongoose.model('ActivityLog');
    
    // Index for user activity queries
    await ActivityLog.collection.createIndex(
      { user: 1, createdAt: -1 },
      { name: 'activity_user_date' }
    );

    // Index for action type queries
    await ActivityLog.collection.createIndex(
      { action: 1, createdAt: -1 },
      { name: 'activity_action_date' }
    );

    // Index for IP address queries
    await ActivityLog.collection.createIndex(
      { ipAddress: 1, createdAt: -1 },
      { name: 'activity_ip_date' }
    );

    // Text search index for description
    await ActivityLog.collection.createIndex(
      { description: 'text' },
      { 
        name: 'activity_text_search',
        weights: {
          description: 10
        }
      }
    );

    logger.info('✅ ActivityLog indexes created successfully');
    return { success: true, count: 4 };
  } catch (error) {
    logger.error('❌ Error creating ActivityLog indexes:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Create indexes for Payment collection
 */
const createPaymentIndexes = async () => {
  try {
    const Payment = mongoose.model('Payment');
    
    // Index for user payment queries
    await Payment.collection.createIndex(
      { user: 1, createdAt: -1 },
      { name: 'payment_user_date' }
    );

    // Index for payment status queries
    await Payment.collection.createIndex(
      { status: 1, createdAt: -1 },
      { name: 'payment_status_date' }
    );

    // Index for payment method queries
    await Payment.collection.createIndex(
      { paymentMethod: 1, createdAt: -1 },
      { name: 'payment_method_date' }
    );

    // Index for amount range queries
    await Payment.collection.createIndex(
      { amount: 1, createdAt: -1 },
      { name: 'payment_amount_date' }
    );

    // Index for transaction ID queries
    await Payment.collection.createIndex(
      { transactionId: 1 },
      { name: 'payment_transaction_id' }
    );

    logger.info('✅ Payment indexes created successfully');
    return { success: true, count: 5 };
  } catch (error) {
    logger.error('❌ Error creating Payment indexes:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Create indexes for Cart collection
 */
const createCartIndexes = async () => {
  try {
    const Cart = mongoose.model('Cart');
    
    // Index for user cart queries
    await Cart.collection.createIndex(
      { user: 1, createdAt: -1 },
      { name: 'cart_user_date' }
    );

    // Index for cart status queries
    await Cart.collection.createIndex(
      { status: 1, createdAt: -1 },
      { name: 'cart_status_date' }
    );

    // Index for abandoned cart queries
    await Cart.collection.createIndex(
      { updatedAt: 1, status: 1 },
      { name: 'cart_abandoned' }
    );

    logger.info('✅ Cart indexes created successfully');
    return { success: true, count: 3 };
  } catch (error) {
    logger.error('❌ Error creating Cart indexes:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Create indexes for Newsletter collection
 */
const createNewsletterIndexes = async () => {
  try {
    const NewsletterSubscriber = mongoose.model('NewsletterSubscriber');
    
    // Index for email queries
    await NewsletterSubscriber.collection.createIndex(
      { email: 1 },
      { 
        name: 'newsletter_email_unique',
        unique: true 
      }
    );

    // Index for subscription status
    await NewsletterSubscriber.collection.createIndex(
      { isSubscribed: 1, createdAt: -1 },
      { name: 'newsletter_subscription_status' }
    );

    logger.info('✅ Newsletter indexes created successfully');
    return { success: true, count: 2 };
  } catch (error) {
    logger.error('❌ Error creating Newsletter indexes:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Create indexes for Support collection
 */
const createSupportIndexes = async () => {
  try {
    const Support = mongoose.model('Support');
    
    // Index for user support queries
    await Support.collection.createIndex(
      { user: 1, createdAt: -1 },
      { name: 'support_user_date' }
    );

    // Index for support status queries
    await Support.collection.createIndex(
      { status: 1, createdAt: -1 },
      { name: 'support_status_date' }
    );

    // Index for priority queries
    await Support.collection.createIndex(
      { priority: 1, createdAt: -1 },
      { name: 'support_priority_date' }
    );

    // Text search index for subject and message
    await Support.collection.createIndex(
      { subject: 'text', message: 'text' },
      { 
        name: 'support_text_search',
        weights: {
          subject: 10,
          message: 5
        }
      }
    );

    logger.info('✅ Support indexes created successfully');
    return { success: true, count: 4 };
  } catch (error) {
    logger.error('❌ Error creating Support indexes:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Create all indexes automatically on startup
 */
const createAllIndexes = async () => {
  logger.info('🚀 Starting automatic index creation...');
  
  const startTime = Date.now();
  const results = {};
  
  try {
    // Create indexes for all collections
    const indexFunctions = [
      { name: 'Product', func: createProductIndexes },
      { name: 'User', func: createUserIndexes },
      { name: 'Order', func: createOrderIndexes },
      { name: 'Category', func: createCategoryIndexes },
      { name: 'ActivityLog', func: createActivityLogIndexes },
      { name: 'Payment', func: createPaymentIndexes },
      { name: 'Cart', func: createCartIndexes },
      { name: 'NewsletterSubscriber', func: createNewsletterIndexes },
      { name: 'Support', func: createSupportIndexes }
    ];

    for (const { name, func } of indexFunctions) {
      try {
        const result = await func();
        results[name] = result;
        
        if (result.success) {
          indexCreationStatus.created += result.count;
          logger.info(`✅ ${name} indexes created: ${result.count} indexes`);
        } else {
          indexCreationStatus.failed += 1;
          indexCreationStatus.errors.push(`${name}: ${result.error}`);
          logger.error(`❌ ${name} indexes failed: ${result.error}`);
        }
      } catch (error) {
        indexCreationStatus.failed += 1;
        indexCreationStatus.errors.push(`${name}: ${error.message}`);
        logger.error(`❌ ${name} indexes error:`, error.message);
      }
    }

    const duration = Date.now() - startTime;
    
    logger.info('🎯 Index creation completed', {
      duration: `${duration}ms`,
      created: indexCreationStatus.created,
      failed: indexCreationStatus.failed,
      errors: indexCreationStatus.errors.length
    });

    return {
      success: indexCreationStatus.failed === 0,
      duration,
      created: indexCreationStatus.created,
      failed: indexCreationStatus.failed,
      errors: indexCreationStatus.errors,
      results
    };
    
  } catch (error) {
    logger.error('❌ Fatal error during index creation:', error);
    return {
      success: false,
      error: error.message,
      created: indexCreationStatus.created,
      failed: indexCreationStatus.failed,
      errors: indexCreationStatus.errors
    };
  }
};

/**
 * Get index information for all collections
 */
const getIndexInfo = async () => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const indexInfo = {};

    for (const collection of collections) {
      try {
        const indexes = await mongoose.connection.db.collection(collection.name).indexes();
        indexInfo[collection.name] = {
          count: indexes.length,
          indexes: indexes.map(idx => ({
            name: idx.name,
            key: idx.key,
            unique: idx.unique || false,
            sparse: idx.sparse || false,
            size: idx.size || 0
          }))
        };
      } catch (error) {
        logger.warn(`Failed to get index info for ${collection.name}:`, error.message);
        indexInfo[collection.name] = { error: error.message };
      }
    }

    return indexInfo;
  } catch (error) {
    logger.error('Failed to get index information:', error);
    return null;
  }
};

/**
 * Drop all indexes (use with caution!)
 */
const dropAllIndexes = async () => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const results = {};

    for (const collection of collections) {
      try {
        const indexes = await mongoose.connection.db.collection(collection.name).indexes();
        const droppedIndexes = [];

        for (const index of indexes) {
          if (index.name !== '_id_') { // Don't drop the _id index
            await mongoose.connection.db.collection(collection.name).dropIndex(index.name);
            droppedIndexes.push(index.name);
          }
        }

        results[collection.name] = {
          success: true,
          dropped: droppedIndexes.length,
          indexes: droppedIndexes
        };
      } catch (error) {
        results[collection.name] = {
          success: false,
          error: error.message
        };
      }
    }

    logger.warn('⚠️ All indexes dropped (except _id indexes)');
    return results;
  } catch (error) {
    logger.error('Failed to drop indexes:', error);
    return null;
  }
};

/**
 * Initialize indexes on startup
 */
const initializeIndexes = async () => {
  // Check if we should create indexes
  const shouldCreateIndexes = process.env.CREATE_INDEXES !== 'false';
  
  if (!shouldCreateIndexes) {
    logger.info('⏭️ Skipping index creation (CREATE_INDEXES=false)');
    return { skipped: true };
  }

  // Wait for database connection
  if (mongoose.connection.readyState !== 1) {
    logger.info('⏳ Waiting for database connection before creating indexes...');
    await new Promise(resolve => {
      mongoose.connection.once('connected', resolve);
    });
  }

  return await createAllIndexes();
};

module.exports = {
  createProductIndexes,
  createUserIndexes,
  createOrderIndexes,
  createCategoryIndexes,
  createActivityLogIndexes,
  createPaymentIndexes,
  createCartIndexes,
  createNewsletterIndexes,
  createSupportIndexes,
  createAllIndexes,
  getIndexInfo,
  dropAllIndexes,
  initializeIndexes
}; 