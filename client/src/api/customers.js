import api from './config';

export const fetchCustomerInsights = async () => {
  const res = await api.get('/customers/insights');
  return res.data;
};

export const fetchCLVDistribution = async () => {
  const res = await api.get('/customers/clv-distribution');
  return res.data.clvs;
};

export const fetchGeoDistribution = async () => {
  const res = await api.get('/customers/geo');
  return res.data.geo;
}; 