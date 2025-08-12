import api from './config';

// Fetch all orders for admin (with pagination, search, etc.)
export const getAdminOrders = async (params = {}) => {
  try {
    const res = await api.get('/orders/admin', { params });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch orders');
  }
};

// Fetch all orders for the current user
export async function getMyOrders(token) {
  try {
    const res = await api.get('/orders/myorders');
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch orders');
  }
}

// Get single order by ID
export const getOrderById = async (id) => {
  try {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch order');
  }
};

// Update an order's status (e.g., mark as shipped)
export const updateOrderStatus = async (orderId, status) => {
  try {
    const res = await api.put(`/orders/${orderId}/status`, status);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to update order status');
  }
};

// Create a new order
export const createOrder = async (orderData) => {
  try {
    const res = await api.post('/orders', orderData);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to create order');
  }
};

// Get specific order for current user
export const getMyOrderById = async (orderId) => {
  const res = await api.get(`/orders/me/${orderId}`);
  return res.data;
};

// Get tracking info for an order
export const getMyOrderTracking = async (orderId) => {
  const res = await api.get(`/orders/me/${orderId}/tracking`);
  return res.data;
};

// Cancel an order
export const cancelMyOrder = async (orderId, reason) => {
  const res = await api.post(`/orders/me/${orderId}/cancel`, { reason });
  return res.data;
};

// Submit a review for an order
export const reviewMyOrder = async (orderId, reviewData) => {
  const res = await api.post(`/orders/me/${orderId}/review`, reviewData);
  return res.data;
};

// Get order stats
export const getMyOrderStats = async () => {
  const res = await api.get('/orders/me/stats');
  return res.data;
};

// Get recent orders
export const getMyRecentOrders = async () => {
  const res = await api.get('/orders/me/recent');
  return res.data;
};

// ===== NEW ORDER TRACKING FUNCTIONS =====

// Get detailed tracking information for a specific order
export const getOrderTracking = async (orderId) => {
  try {
    const res = await api.get(`/users/orders/tracking/${orderId}`);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch order tracking');
  }
};

// Get user's complete order history with filtering and pagination
export const getOrderHistory = async (params = {}) => {
  try {
    const res = await api.get('/users/orders/history', { params });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch order history');
  }
};

// Get user's active orders (pending, processing, shipped)
export const getActiveOrders = async (params = {}) => {
  try {
    const res = await api.get('/users/orders/active', { params });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch active orders');
  }
};

// Get user dashboard data (comprehensive overview)
export const getUserDashboard = async (params = {}) => {
  try {
    const res = await api.get('/users/dashboard', { params });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch user dashboard');
  }
};

// Reorder items from a previous order
export const reorderFromOrder = async (orderId) => {
  try {
    const res = await api.post('/users/dashboard/reorder', { orderId });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to process reorder');
  }
}; 