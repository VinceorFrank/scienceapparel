const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { requireAuth } = require('../middlewares/auth');
const { requirePermission, requireAdmin } = require('../middlewares/rbac');
const { PERMISSIONS } = require('../middlewares/rbac');
const ActivityLog = require('../models/ActivityLog');
const { logger } = require('../utils/logger');
const { 
  validateObjectId,
  validateNumber,
  handleValidationResult
} = require('../middlewares/validators/unifiedValidators');
const { 
  sendSuccess, 
  sendError, 
  sendNotFound, 
  sendUpdated, 
  sendDeleted 
} = require('../utils/responseHandler');
const { body } = require('express-validator');

// ========================================
// 🛒 CART MANAGEMENT ROUTES
// ========================================

// GET /api/cart - Get user's cart
router.get('/', 
  requireAuth,
  requirePermission(PERMISSIONS.VIEW_OWN_ORDERS),
  async (req, res, next) => {
    try {
      const cart = await Cart.getOrCreateCart(req.user._id);
      const populatedCart = await cart.getPopulatedCart();
      
      // Validate cart items
      const validation = await cart.validateCart();
      
      return sendSuccess(res, 200, 'Cart retrieved successfully', {
        cart: {
          id: populatedCart._id,
          items: populatedCart.items,
          total: populatedCart.total,
          itemCount: populatedCart.itemCount,
          uniqueItemCount: populatedCart.uniqueItemCount,
          updatedAt: populatedCart.updatedAt,
          expiresAt: populatedCart.expiresAt
        },
        validation
      });
    } catch (err) {
      next(err);
    }
  }
);

// Add item to cart
const validateAddToCart = [
  body('productId').isMongoId().withMessage('productId must be a valid MongoDB ObjectId'),
  body('quantity').isInt({ min: 1, max: 100 }).withMessage('Quantity must be between 1 and 100'),
  handleValidationResult
];

// POST /api/cart/items - Add item to cart
router.post('/items', 
  requireAuth,
  requirePermission(PERMISSIONS.CREATE_OWN_ORDER),
  validateAddToCart,
  async (req, res, next) => {
    try {
      const { productId, quantity = 1 } = req.body;

      // Verify product exists and is available
      const product = await Product.findById(productId);
      if (!product) {
        return sendNotFound(res, 'Product');
      }

      if (product.archived) {
        return sendError(res, 400, 'Product is no longer available', null, 'PRODUCT_UNAVAILABLE');
      }

      if (product.stock < quantity) {
        return sendError(res, 400, `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`, null, 'INSUFFICIENT_STOCK');
      }

      // Get or create cart
      const cart = await Cart.getOrCreateCart(req.user._id);
      
      // Add item to cart
      await cart.addItem(productId, quantity, product.price);
      
      // Get populated cart for response
      const populatedCart = await cart.getPopulatedCart();

      // Log activity (with error catch)
      try {
        await ActivityLog.create({
          user: req.user._id,
          event: 'cart_action',
          action: 'add_to_cart',
          description: `Added ${quantity}x ${product.name} to cart`
        });
      } catch (logErr) {
        console.error('ActivityLog error (add_to_cart):', logErr);
      }

      logger.info('Item added to cart', {
        userId: req.user._id,
        productId: productId,
        quantity: quantity,
        productName: product.name
      });

      return sendSuccess(res, 200, 'Item added to cart successfully', {
        cart: {
          id: populatedCart._id,
          items: populatedCart.items,
          total: populatedCart.total,
          itemCount: populatedCart.itemCount,
          uniqueItemCount: populatedCart.uniqueItemCount
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/cart/items/:productId - Update item quantity
router.put('/items/:productId', 
  requireAuth,
  requirePermission(PERMISSIONS.CREATE_OWN_ORDER),
  [
    validateObjectId('productId'),
    validateNumber('quantity', { min: 0, max: 100 }),
    handleValidationResult
  ],
  async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;

      // Verify product exists
      const product = await Product.findById(productId);
      if (!product) {
        return sendNotFound(res, 'Product');
      }

      // Get cart
      const cart = await Cart.getOrCreateCart(req.user._id);
      
      // Check if item exists in cart
      const existingItem = cart.items.find(
        item => item.product.toString() === productId
      );

      if (!existingItem) {
        return sendNotFound(res, 'Cart item');
      }

      // Check stock if increasing quantity
      if (quantity > existingItem.quantity && product.stock < quantity) {
        return sendError(res, 400, `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`, null, 'INSUFFICIENT_STOCK');
      }

      // Update quantity
      await cart.updateItemQuantity(productId, quantity);
      
      // Get populated cart for response
      const populatedCart = await cart.getPopulatedCart();

      // Log activity (with error catch)
      const action = quantity === 0 ? 'remove_from_cart' : 'update_cart_quantity';
      const description = quantity === 0 
        ? `Removed ${product.name} from cart`
        : `Updated ${product.name} quantity to ${quantity}`;

      try {
        await ActivityLog.create({
          user: req.user._id,
          event: 'cart_action',
          action: action,
          description: description
        });
      } catch (logErr) {
        console.error('ActivityLog error (update/remove):', logErr);
      }

      return sendUpdated(res, quantity === 0 ? 'Item removed from cart' : 'Item quantity updated', {
        cart: {
          id: populatedCart._id,
          items: populatedCart.items,
          total: populatedCart.total,
          itemCount: populatedCart.itemCount,
          uniqueItemCount: populatedCart.uniqueItemCount
        }
      });
    } catch (err) {
      if (err.message === 'Item not found in cart') {
        return sendNotFound(res, 'Cart item');
      }
      next(err);
    }
  }
);

// DELETE /api/cart/items/:productId - Remove item from cart
router.delete('/items/:productId', 
  requireAuth,
  requirePermission(PERMISSIONS.CREATE_OWN_ORDER),
  [
    validateObjectId('productId'),
    handleValidationResult
  ],
  async (req, res, next) => {
    try {
      const { productId } = req.params;

      // Get cart
      const cart = await Cart.getOrCreateCart(req.user._id);
      
      // Get product info for logging
      const product = await Product.findById(productId);
      const productName = product ? product.name : 'Unknown Product';
      
      // Remove item
      await cart.removeItem(productId);
      
      // Get populated cart for response
      const populatedCart = await cart.getPopulatedCart();

      // Log activity (with error catch)
      try {
        await ActivityLog.create({
          user: req.user._id,
          event: 'cart_action',
          action: 'remove_from_cart',
          description: `Removed ${productName} from cart`
        });
      } catch (logErr) {
        console.error('ActivityLog error (remove_from_cart):', logErr);
      }

      return sendDeleted(res, 'Item removed from cart', {
        cart: {
          id: populatedCart._id,
          items: populatedCart.items,
          total: populatedCart.total,
          itemCount: populatedCart.itemCount,
          uniqueItemCount: populatedCart.uniqueItemCount
        }
      });
    } catch (err) {
      if (err.message === 'Item not found in cart') {
        return sendNotFound(res, 'Cart item');
      }
      next(err);
    }
  }
);

// DELETE /api/cart - Clear entire cart
router.delete('/', 
  requireAuth,
  requirePermission(PERMISSIONS.CREATE_OWN_ORDER),
  async (req, res, next) => {
    try {
      const cart = await Cart.getOrCreateCart(req.user._id);
      
      // Log activity before clearing (with error catch)
      const itemCount = cart.items.length;
      try {
        await ActivityLog.create({
          user: req.user._id,
          event: 'cart_action',
          action: 'clear_cart',
          description: `Cleared cart with ${itemCount} items`
        });
      } catch (logErr) {
        console.error('ActivityLog error (clear_cart):', logErr);
      }

      // Clear cart
      await cart.clearCart();
      
      return sendDeleted(res, 'Cart cleared successfully', {
        cart: {
          id: cart._id,
          items: [],
          total: 0,
          itemCount: 0,
          uniqueItemCount: 0
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/cart/merge - Merge guest cart with user cart
router.post('/merge', 
  requireAuth,
  requirePermission(PERMISSIONS.CREATE_OWN_ORDER),
  async (req, res, next) => {
    try {
      const { guestCartItems } = req.body;

      if (!guestCartItems || !Array.isArray(guestCartItems)) {
        return sendError(res, 400, 'Guest cart items are required', null, 'INVALID_GUEST_CART');
      }

      const cart = await Cart.getOrCreateCart(req.user._id);
      
      // Merge guest cart items
      let mergedCount = 0;
      for (const item of guestCartItems) {
        try {
          const product = await Product.findById(item.productId);
          if (product && !product.archived && product.stock >= item.quantity) {
            await cart.addItem(item.productId, item.quantity, product.price);
            mergedCount++;
          }
        } catch (error) {
          logger.warn('Failed to merge cart item', {
            productId: item.productId,
            error: error.message
          });
        }
      }

      // Get populated cart for response
      const populatedCart = await cart.getPopulatedCart();

      // Log activity (with error catch)
      try {
        await ActivityLog.create({
          user: req.user._id,
          event: 'cart_action',
          action: 'merge_cart',
          description: `Merged ${mergedCount} items from guest cart`
        });
      } catch (logErr) {
        console.error('ActivityLog error (merge_cart):', logErr);
      }

      return sendSuccess(res, 200, `Successfully merged ${mergedCount} items`, {
        cart: {
          id: populatedCart._id,
          items: populatedCart.items,
          total: populatedCart.total,
          itemCount: populatedCart.itemCount,
          uniqueItemCount: populatedCart.uniqueItemCount
        },
        mergedCount
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;