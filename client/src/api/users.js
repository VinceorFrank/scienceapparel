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
export const getProfile = async () => {
  try {
    const res = await api.get('/users/auth/profile');
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch profile');
  }
};

// Update user profile
export const updateProfile = async (profileData) => {
  try {
    const res = await api.put('/users/profile', profileData);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to update profile');
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
    const payload = { ...credentials, email: credentials.email.toLowerCase() };
    console.log('LOGIN API CALL:', '/users/auth/login', payload);
    const res = await api.post('/users/auth/login', payload);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Login failed');
  }
};

// Register user
export const registerUser = async (userData) => {
  try {
    const res = await api.post('/users/auth/register', userData);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Registration failed');
  }
};

// Change password
export const changePassword = async (passwordData) => {
  try {
    const res = await api.put('/users/password', passwordData);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to change password');
  }
};

// Get addresses
export const getAddresses = async () => {
  try {
    const res = await api.get('/users/addresses');
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch addresses');
  }
};

// Add address
export const addAddress = async (addressData) => {
  try {
    const res = await api.post('/users/addresses', addressData);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to add address');
  }
};

// Update address
export const updateAddress = async (addressId, addressData) => {
  try {
    const res = await api.put(`/users/addresses/${addressId}`, addressData);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to update address');
  }
};

// Delete address
export const deleteAddress = async (addressId) => {
  try {
    const res = await api.delete(`/users/addresses/${addressId}`);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to delete address');
  }
};

// Set default address
export const setDefaultAddress = async (addressId) => {
  try {
    const res = await api.put(`/users/addresses/${addressId}/default`);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to set default address');
  }
};

// Get preferences
export const getPreferences = async () => {
  try {
    const res = await api.get('/users/preferences');
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch preferences');
  }
};

// Update preferences
export const updatePreferences = async (preferences) => {
  try {
    const res = await api.put('/users/preferences', { preferences });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to update preferences');
  }
};

// Get user activity log
export const getActivityLog = async (params = {}) => {
  try {
    const res = await api.get('/users/activity', { params });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch activity log');
  }
};

// Admin functions
export const getUsersWithFilters = async (params = {}) => {
  try {
    const res = await api.get('/users/admin', { params });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch users');
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const res = await api.put(`/users/admin/${userId}`, userData);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to update user');
  }
}; 