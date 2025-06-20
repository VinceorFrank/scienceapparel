import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Fetch all users for admin (with pagination, search, etc.)
export const getAdminUsers = async (params = {}) => {
  const token = localStorage.getItem('token');
  try {
    const res = await axios.get(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch users');
  }
};

// Update a user's role
export const updateUserRole = async (userId, role) => {
  const token = localStorage.getItem('token');
  try {
    const res = await axios.patch(`${API_BASE}/users/${userId}/role`, { role }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to update user role');
  }
}; 