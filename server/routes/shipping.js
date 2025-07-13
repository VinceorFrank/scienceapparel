const express = require('express');
const router = express.Router();
const shippingService = require('../services/shippingService');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

// Calculate shipping rates for cart
router.post('/rates', requireAuth, async (req, res) => {
  try {
    const { cartItems, destinationAddress } = req.body;
    
    if (!cartItems || !destinationAddress) {
      return res.status(400).json({
        success: false,
        message: 'Cart items and destination address are required'
      });
    }

    const rates = await shippingService.calculateShippingRates(cartItems, destinationAddress);
    
    res.json({
      success: true,
      data: rates
    });
  } catch (error) {
    console.error('Shipping rates error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error calculating shipping rates'
    });
  }
});

// Get available carriers (public)
router.get('/carriers', async (req, res) => {
  try {
    const carriers = shippingService.getCarrierSettings();
    const availableCarriers = Object.keys(carriers)
      .filter(key => carriers[key].enabled)
      .map(key => ({
        key,
        name: carriers[key].name,
        deliveryDays: carriers[key].deliveryDays
      }));

    res.json({
      success: true,
      data: availableCarriers
    });
  } catch (error) {
    console.error('Get carriers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching carriers'
    });
  }
});

// Get box tiers (public)
router.get('/boxes', async (req, res) => {
  try {
    const boxTiers = shippingService.getBoxTierSettings();
    
    res.json({
      success: true,
      data: boxTiers
    });
  } catch (error) {
    console.error('Get box tiers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching box tiers'
    });
  }
});

// Admin routes for shipping management
router.get('/admin/carriers', requireAdmin, async (req, res) => {
  try {
    const carriers = shippingService.getCarrierSettings();
    
    res.json({
      success: true,
      data: carriers
    });
  } catch (error) {
    console.error('Admin get carriers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching carrier settings'
    });
  }
});

// Update carrier settings
router.put('/admin/carriers/:carrierKey', requireAdmin, async (req, res) => {
  try {
    const { carrierKey } = req.params;
    const settings = req.body;
    
    const updated = await shippingService.updateCarrierSettings(carrierKey, settings);
    
    if (updated) {
      res.json({
        success: true,
        message: `${carrierKey} settings updated successfully`
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Carrier not found'
      });
    }
  } catch (error) {
    console.error('Update carrier error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating carrier settings'
    });
  }
});

// Get box tier settings (admin)
router.get('/admin/boxes', requireAdmin, async (req, res) => {
  try {
    const boxTiers = shippingService.getBoxTierSettings();
    
    res.json({
      success: true,
      data: boxTiers
    });
  } catch (error) {
    console.error('Admin get box tiers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching box tier settings'
    });
  }
});

// Update box tier settings
router.put('/admin/boxes/:tierKey', requireAdmin, async (req, res) => {
  try {
    const { tierKey } = req.params;
    const settings = req.body;
    
    const updated = await shippingService.updateBoxTierSettings(tierKey, settings);
    
    if (updated) {
      res.json({
        success: true,
        message: `${tierKey} settings updated successfully`
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Box tier not found'
      });
    }
  } catch (error) {
    console.error('Update box tier error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating box tier settings'
    });
  }
});

// Test shipping rate calculation (admin)
router.post('/admin/test-rates', requireAdmin, async (req, res) => {
  try {
    const { cartItems, destinationAddress } = req.body;
    
    if (!cartItems || !destinationAddress) {
      return res.status(400).json({
        success: false,
        message: 'Cart items and destination address are required'
      });
    }

    const rates = await shippingService.calculateShippingRates(cartItems, destinationAddress);
    
    res.json({
      success: true,
      data: {
        rates,
        testInfo: {
          totalWeight: shippingService.calculateTotalWeight(cartItems),
          boxTier: shippingService.selectBoxTier(cartItems),
          isQuebecAddress: shippingService.isQuebecAddress(destinationAddress)
        }
      }
    });
  } catch (error) {
    console.error('Test shipping rates error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error testing shipping rates'
    });
  }
});

// Get shipping statistics (admin)
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const carriers = shippingService.getCarrierSettings();
    const boxTiers = shippingService.getBoxTierSettings();
    
    const stats = {
      totalCarriers: Object.keys(carriers).length,
      enabledCarriers: Object.keys(carriers).filter(key => carriers[key].enabled).length,
      totalBoxTiers: Object.keys(boxTiers).length,
      averageMarkup: Object.values(carriers).reduce((sum, carrier) => sum + carrier.markup, 0) / Object.keys(carriers).length
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Shipping stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shipping statistics'
    });
  }
});

module.exports = router; 