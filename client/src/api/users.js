import api from './config';

// Fetch all users for admin (with pagination, search, etc.)
export const getAdminUsers = async (params = {}) => {
  try {
    const res = await api.get('/users', { params });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch users');
  }
};

// Get user profile
export const getUserProfile = async () => {
  try {
    const res = await api.get('/users/profile');
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch user profile');
  }
};

// Update user profile
export const updateUserProfile = async (userData) => {
  try {
    const res = await api.put('/users/profile', userData);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to update user profile');
  }
};

// Update a user's role
export const updateUserRole = async (userId, role) => {
  try {
    const res = await api.patch(`/users/${userId}/role`, { role });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to update user role');
  }
};

// Delete a user
export const deleteUser = async (userId) => {
  try {
    const res = await api.delete(`/users/${userId}`);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to delete user');
  }
};

// Login user
export const loginUser = async (credentials) => {
  try {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Login failed');
  }
};

// Register user
export const registerUser = async (userData) => {
  try {
    const res = await api.post('/auth/register', userData);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Registration failed');
  }
}; 