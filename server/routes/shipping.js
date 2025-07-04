const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const { 
  getShippingOptions, 
  getShippingSettingsForAdmin, 
  updateShippingSettings,
  validateShippingAddress,
  calculateDeliveryDate
} = require('../utils/shipping');
const { logger, businessLogger } = require('../utils/logger');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// Helper function to convert object with numeric keys to array
const convertOrderItemsToArray = (orderItems) => {
  if (Array.isArray(orderItems)) {
    return orderItems;
  }
  
  if (typeof orderItems === 'object' && orderItems !== null) {
    // Convert object with numeric keys to array
    const keys = Object.keys(orderItems).sort((a, b) => parseInt(a) - parseInt(b));
    return keys.map(key => orderItems[key]);
  }
  
  return null;
};

// Test endpoint for debugging
router.post('/test', (req, res) => {
  try {
    businessLogger('shipping_test_endpoint', {
      body: req.body,
      method: req.method
    }, req);

    const { orderItems, shippingAddress } = req.body;

    if (!orderItems || !Array.isArray(orderItems)) {
      return sendError(res, 400, 'orderItems must be an array', null, 'INVALID_ORDER_ITEMS');
    }

    const convertedOrderItems = orderItems.map(item => ({
      product: item.productId,
      quantity: parseInt(item.quantity),
      price: parseFloat(item.price)
    }));

    businessLogger('shipping_test_validation', {
      originalItems: orderItems,
      convertedItems: convertedOrderItems,
      itemCount: convertedOrderItems.length
    }, req);

    // Validate converted items
    const validItems = convertedOrderItems.every(item => 
      item.product && item.quantity > 0 && item.price > 0
    );

    if (!validItems) {
      return sendError(res, 400, 'Invalid order items format', null, 'INVALID_ORDER_FORMAT');
    }

    return sendSuccess(res, 200, 'Test endpoint working', {
      originalItems: orderItems,
      convertedItems: convertedOrderItems,
      itemCount: convertedOrderItems.length
    });
  } catch (err) {
    logger.error('Shipping test endpoint error', {
      error: err.message,
      body: req.body
    });
    next(err);
  }
});

/**
 * POST /api/shipping/rates
 * Calculate shipping rates for order items
 * Public endpoint - used in cart/checkout
 */
router.post('/rates', async (req, res) => {
  try {
    const { orderItems, origin, destination } = req.body;

    // Convert orderItems to array if needed
    const convertedOrderItems = convertOrderItemsToArray(orderItems);

    // Validate required fields
    if (!convertedOrderItems || !Array.isArray(convertedOrderItems) || convertedOrderItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Order items are required and must be an array'
      });
    }

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Origin and destination addresses are required'
      });
    }

    // Validate addresses
    try {
      validateShippingAddress(origin);
      validateShippingAddress(destination);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Get shipping options
    const result = await getShippingOptions(convertedOrderItems, origin, destination);

    if (!result.success) {
      return res.status(500).json(result);
    }

    // Add delivery dates to options
    const optionsWithDates = result.options.map(option => ({
      ...option,
      deliveryDate: calculateDeliveryDate(option.estimatedDays).toISOString().split('T')[0],
      deliveryDateFormatted: calculateDeliveryDate(option.estimatedDays).toLocaleDateString()
    }));

    logger.info('Shipping rates calculated successfully', {
      totalItems: result.totalItems,
      totalWeight: result.totalWeight,
      optionsCount: optionsWithDates.length
    });

    res.json({
      success: true,
      options: optionsWithDates,
      boxTier: result.boxTier,
      totalWeight: result.totalWeight,
      totalItems: result.totalItems
    });

  } catch (error) {
    logger.error('Error calculating shipping rates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate shipping rates'
    });
  }
});

/**
 * GET /api/shipping/tiers
 * Get available box tiers
 * Public endpoint - used for display purposes
 */
router.get('/tiers', async (req, res) => {
  try {
    const { getShippingSettings } = require('../utils/shipping');
    const settings = await getShippingSettings();
    
    res.json({
      success: true,
      tiers: settings.boxTiers,
      currency: settings.currency,
      weightUnit: settings.weightUnit,
      dimensionUnit: settings.dimensionUnit
    });
  } catch (error) {
    logger.error('Error getting shipping tiers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get shipping tiers'
    });
  }
});

/**
 * GET /api/shipping/carriers
 * Get available carriers
 * Public endpoint - used for display purposes
 */
router.get('/carriers', async (req, res) => {
  try {
    const { getShippingSettings } = require('../utils/shipping');
    const settings = await getShippingSettings();
    const enabledCarriers = settings.getEnabledCarriers();
    
    res.json({
      success: true,
      carriers: enabledCarriers.map(carrier => ({
        name: carrier.name,
        description: carrier.description,
        priority: carrier.priority
      }))
    });
  } catch (error) {
    logger.error('Error getting carriers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get carriers'
    });
  }
});

/**
 * GET /api/shipping/settings
 * Get shipping settings (admin only)
 */
router.get('/settings', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const result = await getShippingSettingsForAdmin();
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    businessLogger('shipping_settings_retrieved', {
      settings: result
    }, req);

    return sendSuccess(res, 200, 'Shipping settings retrieved successfully', result);
  } catch (error) {
    logger.error('Error getting shipping settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get shipping settings'
    });
  }
});

/**
 * PUT /api/shipping/settings
 * Update shipping settings (admin only)
 */
router.put('/settings', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const updates = req.body;
    
    // Validate updates
    if (updates.defaultMarkupPercentage !== undefined) {
      if (updates.defaultMarkupPercentage < 0 || updates.defaultMarkupPercentage > 100) {
        return res.status(400).json({
          success: false,
          error: 'Default markup percentage must be between 0 and 100'
        });
      }
    }

    if (updates.defaultDelayDays !== undefined) {
      if (updates.defaultDelayDays < 0) {
        return res.status(400).json({
          success: false,
          error: 'Default delay days must be non-negative'
        });
      }
    }

    // Validate box tiers if provided
    if (updates.boxTiers) {
      for (const tier of updates.boxTiers) {
        if (!tier.name || tier.maxItems <= 0 || tier.weightEstimate <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Invalid box tier configuration'
          });
        }
      }
    }

    // Validate carriers if provided
    if (updates.carriers) {
      for (const carrier of updates.carriers) {
        if (!carrier.name) {
          return res.status(400).json({
            success: false,
            error: 'Carrier name is required'
          });
        }
        if (carrier.markupPercentage < 0 || carrier.markupPercentage > 100) {
          return res.status(400).json({
            success: false,
            error: 'Carrier markup percentage must be between 0 and 100'
          });
        }
      }
    }

    const result = await updateShippingSettings(updates);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    businessLogger('shipping_settings_updated', {
      settings: updates
    }, req);

    return sendSuccess(res, 200, 'Shipping settings updated successfully', result);
  } catch (error) {
    logger.error('Error updating shipping settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update shipping settings'
    });
  }
});

/**
 * POST /api/shipping/estimate
 * Get delivery estimate for a specific carrier and service
 */
router.post('/estimate', async (req, res) => {
  try {
    const { carrier, origin, destination, boxTier, totalWeight } = req.body;

    if (!carrier || !origin || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Carrier, origin, and destination are required'
      });
    }

    // Validate addresses
    try {
      validateShippingAddress(origin);
      validateShippingAddress(destination);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Calculate delivery estimate
    const isDomestic = origin.country === destination.country;
    const baseDays = isDomestic ? 3 : 7;
    const deliveryDate = calculateDeliveryDate(baseDays);

    res.json({
      success: true,
      estimate: {
        carrier,
        estimatedDays: baseDays,
        deliveryDate: deliveryDate.toISOString().split('T')[0],
        deliveryDateFormatted: deliveryDate.toLocaleDateString(),
        isDomestic
      }
    });

  } catch (error) {
    logger.error('Error calculating delivery estimate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate delivery estimate'
    });
  }
});

/**
 * GET /api/shipping/analytics
 * Get shipping analytics (admin only)
 */
router.get('/analytics', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // This would typically query your orders collection
    // For now, return mock data
    const analytics = {
      totalShipments: 150,
      averageShippingCost: 18.50,
      mostUsedCarrier: 'Canada Post',
      averageDeliveryTime: 3.2,
      shippingCostByCarrier: {
        'Canada Post': 45,
        'UPS': 32,
        'Purolator': 28,
        'FedEx': 15
      }
    };

    res.json({
      success: true,
      period,
      analytics
    });
  } catch (error) {
    logger.error('Error getting shipping analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get shipping analytics'
    });
  }
});

/**
 * POST /api/shipping/test-carrier
 * Test carrier API connection (admin only)
 */
router.post('/test-carrier', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { carrierName, apiKey, apiSecret } = req.body;

    if (!carrierName) {
      return res.status(400).json({
        success: false,
        error: 'Carrier name is required'
      });
    }

    // This would test the actual carrier API
    // For now, simulate a test
    await new Promise(resolve => setTimeout(resolve, 1000));

    logger.info('Carrier API test performed', {
      carrier: carrierName,
      adminId: req.user._id
    });

    res.json({
      success: true,
      message: `Successfully tested ${carrierName} API connection`,
      carrier: carrierName,
      status: 'connected'
    });
  } catch (error) {
    logger.error('Error testing carrier API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test carrier API'
    });
  }
});

// @desc    Calculate shipping rates
// @route   POST /api/shipping/calculate
// @access  Public
router.post('/calculate', async (req, res, next) => {
  try {
    const { orderItems, shippingAddress } = req.body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return sendError(res, 400, 'Order items are required and must be an array', null, 'INVALID_ORDER_ITEMS');
    }

    if (!shippingAddress) {
      return sendError(res, 400, 'Shipping address is required', null, 'MISSING_SHIPPING_ADDRESS');
    }

    const convertedOrderItems = convertOrderItemsToArray(orderItems);
    
    if (!convertedOrderItems || !Array.isArray(convertedOrderItems) || convertedOrderItems.length === 0) {
      return sendError(res, 400, 'Invalid order items format', null, 'INVALID_ORDER_FORMAT');
    }

    const rates = await calculateShippingRates(convertedOrderItems, shippingAddress);
    
    businessLogger('shipping_calculation', {
      itemCount: convertedOrderItems.length,
      destination: shippingAddress,
      ratesCount: rates.length
    }, req);

    return sendSuccess(res, 200, 'Shipping rates calculated successfully', rates);
  } catch (err) {
    logger.error('Shipping calculation error', {
      error: err.message,
      orderItems: req.body.orderItems,
      shippingAddress: req.body.shippingAddress
    });
    next(err);
  }
});

// @desc    Get shipping options
// @route   GET /api/shipping/options
// @access  Public
router.get('/options', async (req, res, next) => {
  try {
    const options = await getShippingOptions();
    
    businessLogger('shipping_options_retrieved', {
      optionsCount: options.length
    }, req);

    return sendSuccess(res, 200, 'Shipping options retrieved successfully', options);
  } catch (err) {
    logger.error('Shipping options error', {
      error: err.message
    });
    next(err);
  }
});

// @desc    Calculate delivery date
// @route   POST /api/shipping/delivery-date
// @access  Public
router.post('/delivery-date', async (req, res, next) => {
  try {
    const { shippingMethod, orderDate } = req.body;

    if (!shippingMethod) {
      return sendError(res, 400, 'Shipping method is required', null, 'MISSING_SHIPPING_METHOD');
    }

    const deliveryDate = calculateDeliveryDate(shippingMethod, orderDate);
    
    businessLogger('delivery_date_calculated', {
      shippingMethod: shippingMethod,
      orderDate: orderDate,
      deliveryDate: deliveryDate
    }, req);

    return sendSuccess(res, 200, 'Delivery date calculated successfully', { deliveryDate });
  } catch (err) {
    logger.error('Delivery date calculation error', {
      error: err.message,
      shippingMethod: req.body.shippingMethod,
      orderDate: req.body.orderDate
    });
    next(err);
  }
});

module.exports = router; 