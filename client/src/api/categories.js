import api from './config';

export const getCategories = async (params = {}) => {
  try {
    const res = await api.get('/categories', { params });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch categories');
  }
};

export const addCategory = async (category) => {
  try {
    const res = await api.post('/categories', category);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to add category');
  }
};

export const updateCategory = async (id, category) => {
  try {
    const res = await api.put(`/categories/${id}`, category);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to update category');
  }
};

export const deleteCategory = async (id) => {
  try {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to delete category');
  }
}; 