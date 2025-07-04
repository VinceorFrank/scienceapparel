const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const ActivityLog = require('../models/ActivityLog');
const { logger } = require('../utils/logger');
const { 
  validateAddToCart, 
  validateUpdateCartItem, 
  validateRemoveCartItem, 
  validateCartQueries 
} = require('../middlewares/validators/cartValidators');
const { 
  sendSuccess, 
  sendError, 
  sendNotFound, 
  sendUpdated, 
  sendDeleted 
} = require('../utils/responseHandler');

// ========================================
// 🛒 CART MANAGEMENT ROUTES
// ========================================

// GET /api/cart - Get user's cart
router.get('/', requireAuth, validateCartQueries, async (req, res, next) => {
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
});

// POST /api/cart/items - Add item to cart
router.post('/items', requireAuth, validateAddToCart, async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Validation is now handled by middleware

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

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'add_to_cart',
      description: `Added ${quantity}x ${product.name} to cart`
    });

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
});

// PUT /api/cart/items/:productId - Update item quantity
router.put('/items/:productId', requireAuth, validateUpdateCartItem, async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return sendError(res, 400, 'Valid quantity is required', null, 'INVALID_QUANTITY');
    }

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

    // Log activity
    const action = quantity === 0 ? 'remove_from_cart' : 'update_cart_quantity';
    const description = quantity === 0 
      ? `Removed ${product.name} from cart`
      : `Updated ${product.name} quantity to ${quantity}`;

    await ActivityLog.create({
      user: req.user._id,
      action: action,
      description: description
    });

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
});

// DELETE /api/cart/items/:productId - Remove item from cart
router.delete('/items/:productId', requireAuth, validateRemoveCartItem, async (req, res, next) => {
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

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'remove_from_cart',
      description: `Removed ${productName} from cart`
    });

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
});

// DELETE /api/cart - Clear entire cart
router.delete('/', requireAuth, async (req, res, next) => {
  try {
    const cart = await Cart.getOrCreateCart(req.user._id);
    
    // Log activity before clearing
    await ActivityLog.create({
      user: req.user._id,
      action: 'clear_cart',
      description: `Cleared entire cart (${cart.items.length} items)`
    });

    // Clear cart
    await cart.clearCart();
    
    return sendDeleted(res, 'Cart cleared successfully');
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/validate - Validate cart items
router.post('/validate', requireAuth, async (req, res, next) => {
  try {
    const cart = await Cart.getOrCreateCart(req.user._id);
    const validation = await cart.validateCart();
    
    return sendSuccess(res, 200, 'Cart validation completed', validation);
  } catch (err) {
    next(err);
  }
});

// GET /api/cart/summary - Get cart summary
router.get('/summary', requireAuth, async (req, res, next) => {
  try {
    const cart = await Cart.getOrCreateCart(req.user._id);
    const populatedCart = await cart.getPopulatedCart();
    
    const summary = {
      itemCount: populatedCart.itemCount,
      uniqueItemCount: populatedCart.uniqueItemCount,
      total: populatedCart.total,
      hasItems: populatedCart.items.length > 0,
      expiresAt: populatedCart.expiresAt
    };
    
    return sendSuccess(res, 200, 'Cart summary retrieved successfully', summary);
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/merge - Merge guest cart with user cart (for login)
router.post('/merge', requireAuth, async (req, res, next) => {
  try {
    const { guestCartItems } = req.body;

    if (!guestCartItems || !Array.isArray(guestCartItems)) {
      return sendError(res, 400, 'Guest cart items array is required', null, 'INVALID_GUEST_CART_ITEMS');
    }

    const cart = await Cart.getOrCreateCart(req.user._id);
    let mergedCount = 0;

    for (const guestItem of guestCartItems) {
      try {
        const { productId, quantity } = guestItem;
        
        // Verify product exists
        const product = await Product.findById(productId);
        if (!product || product.archived) continue;

        // Check stock
        if (product.stock < quantity) continue;

        // Add to cart (will merge with existing items)
        await cart.addItem(productId, quantity, product.price);
        mergedCount++;
      } catch (error) {
        logger.warn('Failed to merge guest cart item', {
          userId: req.user._id,
          productId: guestItem.productId,
          error: error.message
        });
      }
    }

    const populatedCart = await cart.getPopulatedCart();

    // Log activity
    if (mergedCount > 0) {
      await ActivityLog.create({
        user: req.user._id,
        action: 'merge_guest_cart',
        description: `Merged ${mergedCount} items from guest cart`
      });
    }

    return sendSuccess(res, 200, `Merged ${mergedCount} items from guest cart`, {
      mergedCount,
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
});

// ========================================
// 🧹 CART MAINTENANCE ROUTES (Admin only)
// ========================================

// POST /api/cart/cleanup - Clean up expired carts (admin only)
router.post('/cleanup', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const deletedCount = await Cart.cleanupExpiredCarts();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'cleanup_expired_carts',
      description: `Cleaned up ${deletedCount} expired carts`
    });

    return sendSuccess(res, 200, `Cleaned up ${deletedCount} expired carts`, { deletedCount });
  } catch (err) {
    next(err);
  }
});

module.exports = router; 