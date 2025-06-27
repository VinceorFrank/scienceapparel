import api from './config';

// Legacy function for backward compatibility
export const getStats = async () => {
  try {
    const res = await api.get('/stats');
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch stats');
  }
};

// Core analytics functions
export const fetchCLV = () => api.get('/stats/clv');
export const fetchUsersByCountry = () => api.get('/stats/users-by-country');
export const fetchRevenueOverTime = () => api.get('/stats/revenue-over-time');
export const fetchTopProducts = () => api.get('/stats/top-products');
export const fetchOrdersByStatus = () => api.get('/stats/orders-by-status');
export const fetchNewCustomersOverTime = () => api.get('/stats/new-customers-over-time');
export const fetchRevenueByCategory = () => api.get('/stats/revenue-by-category');
export const fetchAOV = () => api.get('/stats/aov');
export const fetchLowStockProducts = () => api.get('/stats/low-stock-products');
export const fetchRepeatVsOneTimeCustomers = () => api.get('/stats/repeat-vs-onetime-customers');

// Enhanced analytics functions
export const fetchConversionRate = (period = '30') => 
  api.get(`/stats/conversion-rate?period=${period}`);

export const fetchAbandonedCartMetrics = (period = '30') => 
  api.get(`/stats/abandoned-cart-metrics?period=${period}`);

export const fetchNewsletterAnalytics = () => 
  api.get('/stats/newsletter-analytics');

export const fetchAdminActivityAnalytics = () => 
  api.get('/stats/admin-activity-analytics');

// Custom pie chart builder
export const fetchCustomPieChart = (data) => api.post('/stats/custom-pie', data);

// Legacy aliases for backward compatibility
export const fetchRevenue = fetchRevenueOverTime;
export const fetchNewCustomers = fetchNewCustomersOverTime;
export const fetchLowStock = fetchLowStockProducts;
export const fetchRepeatCustomers = fetchRepeatVsOneTimeCustomers;
export const fetchCustomPie = fetchCustomPieChart;

export const fetchSupportTicketStats = () => api.get('/stats/support-ticket-stats');
export const fetchTopCustomers = () => api.get('/stats/top-customers');
export const fetchRevenueByProduct = () => api.get('/stats/revenue-by-product');
export const fetchOrderStatusOverTime = () => api.get('/stats/order-status-over-time');
