import api from './config';

// Get all dashboard metrics
export const fetchDashboardMetrics = async () => {
  try {
    const response = await api.get('/dashboard/overview');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw error;
  }
};

// Get sales metrics
export const fetchSalesMetrics = async () => {
  const res = await api.get('/dashboard/sales-chart');
  return res.data;
};

// Get recent orders
export const fetchRecentOrders = async () => {
  const res = await api.get('/dashboard/recent-orders');
  return res.data?.recentOrders || [];
};

// Get stock alerts (now part of overview)
export const fetchStockAlerts = async () => {
  const res = await api.get('/dashboard/overview');
  // Return the array of low stock products
  return res.data?.lowStockProducts || [];
};

// Get customer activity (now part of overview)
export const fetchCustomerActivity = async () => {
  const res = await api.get('/dashboard/overview');
  // Return just the users and orders metrics
  return {
    users: res.data?.overview?.users,
    orders: res.data?.overview?.orders
  };
}; 