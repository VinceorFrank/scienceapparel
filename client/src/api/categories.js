import api from './config';

export const getCategories = async () => {
  const res = await api.get('/categories');
  return res.data;
};

export const addCategory = async (category) => {
  const res = await api.post('/categories', category);
  return res.data;
};

export const updateCategory = async (id, category) => {
  const res = await api.put(`/categories/${id}`, category);
  return res.data;
};

export const deleteCategory = async (id) => {
  const res = await api.delete(`/categories/${id}`);
  return res.data;
}; 