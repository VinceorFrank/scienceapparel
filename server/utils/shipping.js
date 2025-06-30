const ShippingSettings = require('../models/ShippingSettings');
const { logger } = require('./logger');

/**
 * Shipping utility functions for calculating rates and delivery estimates
 */

/**
 * Get shipping settings from database
 */
const getShippingSettings = async () => {
  try {
    return await ShippingSettings.getSettings();
  } catch (error) {
    logger.error('Error getting shipping settings:', error);
    throw new Error('Failed to load shipping settings');
  }
};

/**
 * Calculate total weight and item count from order items
 */
const calculateOrderMetrics = (orderItems) => {
  let totalWeight = 0;
  let totalItems = 0;
  
  orderItems.forEach(item => {
    // Handle both 'qty' and 'quantity' field names
    const quantity = item.qty || item.quantity || 1;
    
    // Use item weight if available, otherwise estimate
    const itemWeight = item.weight || 0.2; // Default 200g per item
    totalWeight += itemWeight * quantity;
    totalItems += quantity;
  });
  
  return { totalWeight, totalItems };
};

/**
 * Get appropriate box tier based on item count
 */
const getBoxTier = async (itemCount) => {
  try {
    const settings = await getShippingSettings();
    return settings.getBoxTier(itemCount);
  } catch (error) {
    logger.error('Error getting box tier:', error);
    // Fallback to medium box
    return {
      name: 'Medium',
      dimensions: { length: 35, width: 25, height: 10 },
      weightEstimate: 2.5
    };
  }
};

/**
 * Calculate fallback shipping rates (when live API is unavailable)
 */
const calculateFallbackRates = async (origin, destination, boxTier, totalWeight) => {
  try {
    const settings = await getShippingSettings();
    const { fallbackRates } = settings;
    
    // Simple logic to determine if domestic or international
    const isDomestic = origin.country === destination.country;
    const isExpress = false; // Could be determined by user preference
    
    let baseRate = isDomestic ? fallbackRates.domestic : fallbackRates.international;
    if (isExpress) baseRate = fallbackRates.express;
    
    // Adjust rate based on box size and weight
    const weightMultiplier = Math.max(1, totalWeight / 2.5); // Base on 2.5kg
    const adjustedRate = baseRate * weightMultiplier;
    
    return {
      rate: parseFloat(adjustedRate.toFixed(2)),
      currency: settings.currency,
      estimatedDays: isDomestic ? 3 : 7,
      method: isExpress ? 'Express' : 'Standard'
    };
  } catch (error) {
    logger.error('Error calculating fallback rates:', error);
    return {
      rate: 15.99,
      currency: 'CAD',
      estimatedDays: 5,
      method: 'Standard'
    };
  }
};

/**
 * Simulate live carrier API call (placeholder for real API integration)
 */
const getLiveCarrierRate = async (carrier, origin, destination, boxTier, totalWeight) => {
  try {
    // This is a placeholder - replace with actual carrier API calls
    logger.info(`Getting live rate from ${carrier.name}`, {
      origin: origin.postalCode,
      destination: destination.postalCode,
      weight: totalWeight
    });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate different rates for different carriers
    const baseRates = {
      'Canada Post': 12.99,
      'UPS': 18.99,
      'Purolator': 15.99,
      'FedEx': 22.99
    };
    
    const baseRate = baseRates[carrier.name] || 15.99;
    const weightMultiplier = Math.max(1, totalWeight / 2.5);
    const rawRate = baseRate * weightMultiplier;
    
    // Apply carrier markup
    const markupMultiplier = 1 + (carrier.markupPercentage / 100);
    const finalRate = rawRate * markupMultiplier;
    
    // Calculate delivery days
    const isDomestic = origin.country === destination.country;
    let estimatedDays = isDomestic ? 3 : 7;
    estimatedDays += carrier.delayDays;
    
    return {
      carrier: carrier.name,
      rate: parseFloat(finalRate.toFixed(2)),
      currency: 'CAD',
      estimatedDays,
      method: 'Standard',
      service: `${carrier.name} Standard`,
      tracking: true
    };
  } catch (error) {
    logger.error(`Error getting live rate from ${carrier.name}:`, error);
    return null;
  }
};

/**
 * Get all available shipping options for an order
 */
const getShippingOptions = async (orderItems, origin, destination) => {
  try {
    const settings = await getShippingSettings();
    const { totalWeight, totalItems } = calculateOrderMetrics(orderItems);
    const boxTier = await getBoxTier(totalItems);
    
    const enabledCarriers = settings.getEnabledCarriers();
    const shippingOptions = [];
    
    // Get rates from enabled carriers
    for (const carrier of enabledCarriers) {
      try {
        const carrierRate = await getLiveCarrierRate(
          carrier, 
          origin, 
          destination, 
          boxTier, 
          totalWeight
        );
        
        if (carrierRate) {
          shippingOptions.push({
            ...carrierRate,
            boxTier: boxTier.name,
            totalWeight: parseFloat(totalWeight.toFixed(2)),
            totalItems
          });
        }
      } catch (error) {
        logger.error(`Error getting rate from ${carrier.name}:`, error);
        // Continue with other carriers
      }
    }
    
    // If no live rates available, use fallback
    if (shippingOptions.length === 0) {
      const fallbackRate = await calculateFallbackRates(origin, destination, boxTier, totalWeight);
      shippingOptions.push({
        carrier: 'Standard Shipping',
        ...fallbackRate,
        boxTier: boxTier.name,
        totalWeight: parseFloat(totalWeight.toFixed(2)),
        totalItems,
        tracking: false
      });
    }
    
    // Sort by rate (lowest first)
    shippingOptions.sort((a, b) => a.rate - b.rate);
    
    return {
      success: true,
      options: shippingOptions,
      boxTier,
      totalWeight: parseFloat(totalWeight.toFixed(2)),
      totalItems
    };
    
  } catch (error) {
    logger.error('Error getting shipping options:', error);
    return {
      success: false,
      error: 'Failed to calculate shipping options',
      options: []
    };
  }
};

/**
 * Calculate delivery estimate date
 */
const calculateDeliveryDate = (estimatedDays) => {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);
  
  // Skip weekends (optional)
  const dayOfWeek = deliveryDate.getDay();
  if (dayOfWeek === 0) deliveryDate.setDate(deliveryDate.getDate() + 1); // Sunday
  if (dayOfWeek === 6) deliveryDate.setDate(deliveryDate.getDate() + 2); // Saturday
  
  return deliveryDate;
};

/**
 * Validate shipping address
 */
const validateShippingAddress = (address) => {
  const required = ['address', 'city', 'postalCode', 'country'];
  const missing = required.filter(field => !address[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required shipping fields: ${missing.join(', ')}`);
  }
  
  return true;
};

/**
 * Get shipping settings for admin panel
 */
const getShippingSettingsForAdmin = async () => {
  try {
    const settings = await getShippingSettings();
    return {
      success: true,
      settings: {
        boxTiers: settings.boxTiers,
        carriers: settings.carriers.map(carrier => ({
          ...carrier.toObject(),
          apiKey: carrier.apiKey ? '***' : '', // Hide sensitive data
          apiSecret: carrier.apiSecret ? '***' : ''
        })),
        defaultMarkupPercentage: settings.defaultMarkupPercentage,
        defaultDelayDays: settings.defaultDelayDays,
        currency: settings.currency,
        weightUnit: settings.weightUnit,
        dimensionUnit: settings.dimensionUnit,
        fallbackRates: settings.fallbackRates
      }
    };
  } catch (error) {
    logger.error('Error getting shipping settings for admin:', error);
    return {
      success: false,
      error: 'Failed to load shipping settings'
    };
  }
};

/**
 * Update shipping settings (admin only)
 */
const updateShippingSettings = async (updates) => {
  try {
    const settings = await getShippingSettings();
    
    // Update box tiers
    if (updates.boxTiers) {
      settings.boxTiers = updates.boxTiers;
    }
    
    // Update carriers
    if (updates.carriers) {
      settings.carriers = updates.carriers;
    }
    
    // Update global settings
    if (updates.defaultMarkupPercentage !== undefined) {
      settings.defaultMarkupPercentage = updates.defaultMarkupPercentage;
    }
    if (updates.defaultDelayDays !== undefined) {
      settings.defaultDelayDays = updates.defaultDelayDays;
    }
    if (updates.currency) {
      settings.currency = updates.currency;
    }
    if (updates.weightUnit) {
      settings.weightUnit = updates.weightUnit;
    }
    if (updates.dimensionUnit) {
      settings.dimensionUnit = updates.dimensionUnit;
    }
    if (updates.fallbackRates) {
      settings.fallbackRates = updates.fallbackRates;
    }
    
    await settings.save();
    
    logger.info('Shipping settings updated successfully');
    return {
      success: true,
      message: 'Shipping settings updated successfully'
    };
  } catch (error) {
    logger.error('Error updating shipping settings:', error);
    return {
      success: false,
      error: 'Failed to update shipping settings'
    };
  }
};

module.exports = {
  getShippingOptions,
  getShippingSettings,
  getShippingSettingsForAdmin,
  updateShippingSettings,
  calculateDeliveryDate,
  validateShippingAddress,
  getBoxTier,
  calculateOrderMetrics
}; 