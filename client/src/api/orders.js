import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Fetch all orders for admin (with pagination, search, etc.)
export const getAdminOrders = async (params = {}) => {
  const token = localStorage.getItem('token');
  try {
    const res = await axios.get(`${API_BASE}/orders/admin`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch orders');
  }
};

// Update an order's status (e.g., mark as shipped)
export const updateOrderStatus = async (orderId, status) => {
  const token = localStorage.getItem('token');
  try {
    const res = await axios.put(`${API_BASE}/orders/${orderId}/status`, status, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to update order status');
  }
}; 