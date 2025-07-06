/**
 * Product Service - Microservice for product management
 * Handles product CRUD, inventory, pricing, and search
 */

const Product = require('../models/Product');
const Category = require('../models/Category');
const { logger } = require('../utils/logger');
const { auditLog, AUDIT_EVENTS } = require('../utils/auditLogger');
const { cacheManager } = require('../utils/advancedCache');
const { messageQueue } = require('../utils/messageQueue');

class ProductService {
  constructor() {
    this.cachePrefix = 'product:';
    this.defaultTTL = 1800; // 30 minutes
  }

  /**
   * Create a new product
   */
  async createProduct(productData) {
    try {
      // Validate product data
      const { name, price, categoryId, description, ...otherData } = productData;
      
      if (!name || !price || !categoryId) {
        throw new Error('Name, price, and category are required');
      }

      // Validate category exists
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      // Create product
      const product = new Product({
        name,
        price,
        categoryId,
        description,
        ...otherData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await product.save();

      // Clear cache
      await this.clearProductCache();

      // Send notification for new product
      await messageQueue.addJob('notifications', {
        type: 'new_product',
        data: {
          productId: product._id,
          productName: product.name,
          category: category.name
        }
      }, { priority: 2 });

      // Audit log
      await auditLog(AUDIT_EVENTS.PRODUCT_CREATED, {
        action: 'product_created',
        productId: product._id,
        productName: product.name,
        categoryId: product.categoryId
      }, null, {
        productId: product._id,
        productName: product.name
      });

      logger.info('Product created successfully', { productId: product._id, name });

      return product.toObject();
    } catch (error) {
      logger.error('Product creation failed:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(productId) {
    try {
      // Try cache first
      const cacheKey = `${this.cachePrefix}id:${productId}`;
      const cachedProduct = await cacheManager.get(cacheKey);
      
      if (cachedProduct) {
        return cachedProduct;
      }

      // Get from database with category
      const product = await Product.findById(productId)
        .populate('categoryId', 'name description')
        .populate('reviews');

      if (!product) {
        throw new Error('Product not found');
      }

      // Cache product data
      await cacheManager.set(cacheKey, product.toObject(), { ttl: this.defaultTTL });

      return product.toObject();
    } catch (error) {
      logger.error('Get product by ID failed:', error);
      throw error;
    }
  }

  /**
   * Get products with filters and pagination
   */
  async getProducts(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 12, sort = '-createdAt' } = pagination;
      const { categoryId, minPrice, maxPrice, search, inStock, featured } = filters;

      // Build cache key
      const cacheKey = `${this.cachePrefix}list:${JSON.stringify({ filters, pagination })}`;
      const cachedProducts = await cacheManager.get(cacheKey);
      
      if (cachedProducts) {
        return cachedProducts;
      }

      // Build query
      const query = {};
      if (categoryId) query.categoryId = categoryId;
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = minPrice;
        if (maxPrice) query.price.$lte = maxPrice;
      }
      if (inStock !== undefined) query.inStock = inStock;
      if (featured !== undefined) query.featured = featured;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      // Execute query
      const products = await Product.find(query)
        .populate('categoryId', 'name')
        .sort(sort)
        .limit(limit)
        .skip((page - 1) * limit);

      const total = await Product.countDocuments(query);

      const result = {
        products: products.map(product => product.toObject()),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        filters
      };

      // Cache result
      await cacheManager.set(cacheKey, result, { ttl: this.defaultTTL });

      return result;
    } catch (error) {
      logger.error('Get products failed:', error);
      throw error;
    }
  }

  /**
   * Update product
   */
  async updateProduct(productId, updateData) {
    try {
      // Validate update data
      const allowedFields = ['name', 'price', 'description', 'images', 'inStock', 'featured', 'tags'];
      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});

      if (Object.keys(filteredData).length === 0) {
        throw new Error('No valid fields to update');
      }

      // Update product
      const product = await Product.findByIdAndUpdate(
        productId,
        { $set: { ...filteredData, updatedAt: new Date() } },
        { new: true, runValidators: true }
      ).populate('categoryId', 'name');

      if (!product) {
        throw new Error('Product not found');
      }

      // Clear cache
      await this.clearProductCache();

      // Audit log
      await auditLog(AUDIT_EVENTS.PRODUCT_UPDATED, {
        action: 'product_updated',
        productId: product._id,
        productName: product.name,
        updatedFields: Object.keys(filteredData)
      }, null, {
        productId: product._id,
        productName: product.name
      });

      logger.info('Product updated successfully', { productId, updatedFields: Object.keys(filteredData) });

      return product.toObject();
    } catch (error) {
      logger.error('Product update failed:', error);
      throw error;
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(productId) {
    try {
      const product = await Product.findByIdAndDelete(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Clear cache
      await this.clearProductCache();

      // Audit log
      await auditLog(AUDIT_EVENTS.PRODUCT_DELETED, {
        action: 'product_deleted',
        productId: product._id,
        productName: product.name
      }, null, {
        productId: product._id,
        productName: product.name
      });

      logger.info('Product deleted successfully', { productId, name: product.name });

      return { success: true };
    } catch (error) {
      logger.error('Product deletion failed:', error);
      throw error;
    }
  }

  /**
   * Search products
   */
  async searchProducts(query, options = {}) {
    try {
      const { page = 1, limit = 12, sort = '-createdAt' } = options;
      
      // Build search query
      const searchQuery = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      };

      // Execute search
      const products = await Product.find(searchQuery)
        .populate('categoryId', 'name')
        .sort(sort)
        .limit(limit)
        .skip((page - 1) * limit);

      const total = await Product.countDocuments(searchQuery);

      return {
        products: products.map(product => product.toObject()),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        query
      };
    } catch (error) {
      logger.error('Product search failed:', error);
      throw error;
    }
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit = 8) {
    try {
      const cacheKey = `${this.cachePrefix}featured:${limit}`;
      const cachedProducts = await cacheManager.get(cacheKey);
      
      if (cachedProducts) {
        return cachedProducts;
      }

      const products = await Product.find({ featured: true, inStock: true })
        .populate('categoryId', 'name')
        .sort('-createdAt')
        .limit(limit);

      const result = products.map(product => product.toObject());

      // Cache result
      await cacheManager.set(cacheKey, result, { ttl: 3600 }); // 1 hour

      return result;
    } catch (error) {
      logger.error('Get featured products failed:', error);
      throw error;
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId, options = {}) {
    try {
      const { page = 1, limit = 12, sort = '-createdAt' } = options;
      
      const cacheKey = `${this.cachePrefix}category:${categoryId}:${JSON.stringify(options)}`;
      const cachedProducts = await cacheManager.get(cacheKey);
      
      if (cachedProducts) {
        return cachedProducts;
      }

      const products = await Product.find({ categoryId, inStock: true })
        .populate('categoryId', 'name')
        .sort(sort)
        .limit(limit)
        .skip((page - 1) * limit);

      const total = await Product.countDocuments({ categoryId, inStock: true });

      const result = {
        products: products.map(product => product.toObject()),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        categoryId
      };

      // Cache result
      await cacheManager.set(cacheKey, result, { ttl: this.defaultTTL });

      return result;
    } catch (error) {
      logger.error('Get products by category failed:', error);
      throw error;
    }
  }

  /**
   * Update product inventory
   */
  async updateInventory(productId, quantity, operation = 'add') {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      let newQuantity;
      if (operation === 'add') {
        newQuantity = product.quantity + quantity;
      } else if (operation === 'subtract') {
        newQuantity = Math.max(0, product.quantity - quantity);
      } else if (operation === 'set') {
        newQuantity = quantity;
      } else {
        throw new Error('Invalid operation');
      }

      product.quantity = newQuantity;
      product.inStock = newQuantity > 0;
      product.updatedAt = new Date();
      await product.save();

      // Clear cache
      await cacheManager.delete(`${this.cachePrefix}id:${productId}`);

      // Send low stock notification if needed
      if (newQuantity <= 5 && newQuantity > 0) {
        await messageQueue.addJob('notifications', {
          type: 'low_stock',
          data: {
            productId: product._id,
            productName: product.name,
            quantity: newQuantity
          }
        }, { priority: 1 });
      }

      // Audit log
      await auditLog(AUDIT_EVENTS.INVENTORY_UPDATED, {
        action: 'inventory_updated',
        productId: product._id,
        productName: product.name,
        operation,
        quantity,
        newQuantity
      }, null, {
        productId: product._id,
        productName: product.name
      });

      logger.info('Inventory updated successfully', { productId, operation, quantity, newQuantity });

      return product.toObject();
    } catch (error) {
      logger.error('Inventory update failed:', error);
      throw error;
    }
  }

  /**
   * Get product statistics
   */
  async getProductStats() {
    try {
      const stats = await Product.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
            avgPrice: { $avg: '$price' },
            inStock: { $sum: { $cond: ['$inStock', 1, 0] } },
            outOfStock: { $sum: { $cond: ['$inStock', 0, 1] } }
          }
        }
      ]);

      const categoryStats = await Product.aggregate([
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $unwind: '$category'
        },
        {
          $group: {
            _id: '$category.name',
            count: { $sum: 1 },
            avgPrice: { $avg: '$price' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      return {
        ...stats[0],
        categoryStats,
        stockRate: stats[0] ? (stats[0].inStock / stats[0].totalProducts * 100).toFixed(2) : 0
      };
    } catch (error) {
      logger.error('Get product stats failed:', error);
      throw error;
    }
  }

  /**
   * Clear product cache
   */
  async clearProductCache() {
    try {
      const keys = await cacheManager.client.keys(`${this.cachePrefix}*`);
      if (keys.length > 0) {
        await cacheManager.client.del(...keys);
      }
      logger.info('Product cache cleared');
    } catch (error) {
      logger.error('Clear product cache failed:', error);
    }
  }

  /**
   * Bulk update products
   */
  async bulkUpdateProducts(updates) {
    try {
      const operations = updates.map(update => ({
        updateOne: {
          filter: { _id: update.productId },
          update: { $set: { ...update.data, updatedAt: new Date() } }
        }
      }));

      const result = await Product.bulkWrite(operations);

      // Clear cache
      await this.clearProductCache();

      // Audit log
      await auditLog(AUDIT_EVENTS.BULK_UPDATE, {
        action: 'bulk_product_update',
        updatedCount: result.modifiedCount,
        totalCount: updates.length
      }, null, {
        updatedCount: result.modifiedCount,
        totalCount: updates.length
      });

      logger.info('Bulk update completed', { updatedCount: result.modifiedCount, totalCount: updates.length });

      return result;
    } catch (error) {
      logger.error('Bulk update failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const productService = new ProductService();

module.exports = {
  ProductService,
  productService
}; 