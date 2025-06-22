import api from './config';

export const getStats = async () => {
  try {
    const res = await api.get('/stats');
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch stats');
  }
};
