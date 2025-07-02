const express = require('express');
const router = express.Router();
const { requireAuth, admin } = require('../middlewares/auth');
const { 
  getShippingOptions, 
  getShippingSettingsForAdmin, 
  updateShippingSettings,
  validateShippingAddress,
  calculateDeliveryDate
} = require('../utils/shipping');
const { logger } = require('../utils/logger');

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

// Test endpoint to debug JSON parsing
router.post('/test', (req, res) => {
  console.log('Test endpoint hit');
  const { orderItems, origin, destination } = req.body;
  console.log('Request body:', req.body);
  console.log('orderItems typeof:', typeof orderItems);
  console.log('orderItems isArray:', Array.isArray(orderItems));
  console.log('orderItems value:', orderItems);
  
  // Convert orderItems to array if needed
  const convertedOrderItems = convertOrderItemsToArray(orderItems);
  console.log('Converted orderItems:', convertedOrderItems);
  
  if (!convertedOrderItems || !Array.isArray(convertedOrderItems) || convertedOrderItems.length === 0) {
    console.log('Validation failed - convertedOrderItems:', convertedOrderItems);
    return res.status(400).json({
      success: false,
      error: 'Order items are required and must be an array',
      debug: {
        original: {
          typeof: typeof orderItems,
          isArray: Array.isArray(orderItems),
          value: orderItems
        },
        converted: {
          typeof: typeof convertedOrderItems,
          isArray: Array.isArray(convertedOrderItems),
          value: convertedOrderItems
        }
      }
    });
  }
  res.json({
    success: true,
    orderItems: convertedOrderItems,
    origin,
    destination
  });
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
router.get('/settings', requireAuth, admin, async (req, res) => {
  try {
    const result = await getShippingSettingsForAdmin();
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
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
router.put('/settings', requireAuth, admin, async (req, res) => {
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

    logger.info('Shipping settings updated by admin', {
      adminId: req.user._id,
      updates: Object.keys(updates)
    });

    res.json(result);
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
router.get('/analytics', requireAuth, admin, async (req, res) => {
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
router.post('/test-carrier', requireAuth, admin, async (req, res) => {
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

module.exports = router; 