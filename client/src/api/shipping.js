import api from './config';

/**
 * Shipping API service functions
 */

/**
 * Calculate shipping rates for order items
 * @param {Array} orderItems - Array of order items
 * @param {Object} origin - Origin address
 * @param {Object} destination - Destination address
 * @returns {Promise} Shipping options
 */
export const calculateShippingRates = async (orderItems, origin, destination) => {
  try {
    // Use the real rates endpoint
    const response = await api.post('/shipping/rates', {
      orderItems,
      origin,
      destination
    });
    return response.data;
  } catch (error) {
    console.error('Error calculating shipping rates:', error);
    throw new Error(error.response?.data?.error || 'Failed to calculate shipping rates');
  }
};

/**
 * Get available box tiers
 * @returns {Promise} Box tiers information
 */
export const getBoxTiers = async () => {
  try {
    const response = await api.get('/shipping/tiers');
    return response.data;
  } catch (error) {
    console.error('Error getting box tiers:', error);
    throw new Error(error.response?.data?.error || 'Failed to get box tiers');
  }
};

/**
 * Get available carriers
 * @returns {Promise} Carriers information
 */
export const getCarriers = async () => {
  try {
    const response = await api.get('/shipping/carriers');
    return response.data;
  } catch (error) {
    console.error('Error getting carriers:', error);
    throw new Error(error.response?.data?.error || 'Failed to get carriers');
  }
};

/**
 * Get shipping settings (admin only)
 * @returns {Promise} Shipping settings
 */
export const getShippingSettings = async () => {
  try {
    const response = await api.get('/shipping/settings');
    return response.data;
  } catch (error) {
    console.error('Error getting shipping settings:', error);
    throw new Error(error.response?.data?.error || 'Failed to get shipping settings');
  }
};

/**
 * Update shipping settings (admin only)
 * @param {Object} updates - Settings updates
 * @returns {Promise} Update result
 */
export const updateShippingSettings = async (updates) => {
  try {
    const response = await api.put('/shipping/settings', updates);
    return response.data;
  } catch (error) {
    console.error('Error updating shipping settings:', error);
    throw new Error(error.response?.data?.error || 'Failed to update shipping settings');
  }
};

/**
 * Get delivery estimate
 * @param {Object} params - Estimate parameters
 * @returns {Promise} Delivery estimate
 */
export const getDeliveryEstimate = async (params) => {
  try {
    const response = await api.post('/shipping/estimate', params);
    return response.data;
  } catch (error) {
    console.error('Error getting delivery estimate:', error);
    throw new Error(error.response?.data?.error || 'Failed to get delivery estimate');
  }
};

/**
 * Get shipping analytics (admin only)
 * @param {string} period - Analytics period
 * @returns {Promise} Shipping analytics
 */
export const getShippingAnalytics = async (period = '30d') => {
  try {
    const response = await api.get(`/shipping/analytics?period=${period}`);
    return response.data;
  } catch (error) {
    console.error('Error getting shipping analytics:', error);
    throw new Error(error.response?.data?.error || 'Failed to get shipping analytics');
  }
};

/**
 * Test carrier API connection (admin only)
 * @param {Object} params - Test parameters
 * @returns {Promise} Test result
 */
export const testCarrierAPI = async (params) => {
  try {
    const response = await api.post('/shipping/test-carrier', params);
    return response.data;
  } catch (error) {
    console.error('Error testing carrier API:', error);
    throw new Error(error.response?.data?.error || 'Failed to test carrier API');
  }
};

/**
 * Get default origin address (your warehouse/store location)
 * @returns {Object} Default origin address
 */
export const getDefaultOrigin = () => {
  return {
    address: '911 Roland Therrien',
    city: 'Longueuil',
    postalCode: 'J4J1C2',
    country: 'Canada'
  };
};

/**
 * Format shipping address for display
 * @param {Object} address - Address object
 * @returns {string} Formatted address
 */
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.address}, ${address.city}, ${address.postalCode}, ${address.country}`;
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, currency = 'CAD') => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Calculate delivery date from estimated days
 * @param {number} estimatedDays - Estimated delivery days
 * @returns {Date} Estimated delivery date
 */
export const calculateDeliveryDate = (estimatedDays) => {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);
  
  // Skip weekends
  const dayOfWeek = deliveryDate.getDay();
  if (dayOfWeek === 0) deliveryDate.setDate(deliveryDate.getDate() + 1); // Sunday
  if (dayOfWeek === 6) deliveryDate.setDate(deliveryDate.getDate() + 2); // Saturday
  
  return deliveryDate;
};

/**
 * Format delivery date for display
 * @param {number} estimatedDays - Estimated delivery days
 * @returns {string} Formatted delivery date
 */
export const formatDeliveryDate = (estimatedDays) => {
  const deliveryDate = calculateDeliveryDate(estimatedDays);
  return deliveryDate.toLocaleDateString('en-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Get shipping rates
export const getShippingRates = async (orderItems, origin, destination) => {
  const res = await api.post('/shipping/rates', { orderItems, origin, destination });
  return res.data;
};

// Get available box tiers
export const getShippingTiers = async () => {
  const res = await api.get('/shipping/tiers');
  return res.data;
};

// Get available carriers
export const getShippingCarriers = async () => {
  const res = await api.get('/shipping/carriers');
  return res.data;
};

export default {
  calculateShippingRates,
  getBoxTiers,
  getCarriers,
  getShippingSettings,
  updateShippingSettings,
  getDeliveryEstimate,
  getShippingAnalytics,
  testCarrierAPI,
  getDefaultOrigin,
  formatAddress,
  formatCurrency,
  calculateDeliveryDate,
  formatDeliveryDate,
  getShippingRates,
  getShippingTiers,
  getShippingCarriers
}; 