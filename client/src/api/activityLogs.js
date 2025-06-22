import api from './config';

export const getActivityLogs = async (params = {}) => {
  try {
    const res = await api.get('/admin/activity-logs', { params });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch activity logs');
  }
};

export const createActivityLog = async (logData) => {
  try {
    const res = await api.post('/admin/activity-logs', logData);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to create activity log');
  }
}; 