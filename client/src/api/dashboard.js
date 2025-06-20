import api from './config';

// Get all dashboard metrics
export const fetchDashboardMetrics = async () => {
  try {
    const response = await api.get('/admin/dashboard/metrics');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw error; // Re-throw the error so react-query can handle it
  }
};

// Get sales metrics
export const fetchSalesMetrics = async () => {
  const res = await api.get('/admin/dashboard/sales');
  return res.data;
};

// Get recent orders
export const fetchRecentOrders = async () => {
  const res = await api.get('/admin/dashboard/recent-orders');
  return res.data;
};

// Get stock alerts
export const fetchStockAlerts = async () => {
  const res = await api.get('/admin/dashboard/stock-alerts');
  return res.data;
};

// Get customer activity
export const fetchCustomerActivity = async () => {
  const res = await api.get('/admin/dashboard/customer-activity');
  return res.data;
}; 