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

// Get customer's own orders
export const getMyOrders = async (params = {}) => {
  const res = await api.get('/orders/me', { params });
  return res.data;
};

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