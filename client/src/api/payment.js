import api from './config';

// Create payment intent
export const createPaymentIntent = async (amount, currency = 'cad') => {
  const res = await api.post('/payment/intent', { amount, currency });
  return res.data;
};

// Create order (after payment)
export const createOrder = async (orderData) => {
  const res = await api.post('/orders', orderData);
  return res.data;
};

// Get payment methods (if supported)
export const getPaymentMethods = async () => {
  const res = await api.get('/payment/methods');
  return res.data;
};

// Confirm payment
export const confirmPayment = async (paymentIntentId) => {
  try {
    const response = await api.post('/payment/confirm', {
      paymentIntentId
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to confirm payment');
  }
};

// Get payment history
export const getPaymentHistory = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/payment/history?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch payment history');
  }
};

// Get payment statistics (admin only)
export const getPaymentStats = async () => {
  try {
    const response = await api.get('/payment/stats');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch payment statistics');
  }
};

// Process refund (admin only)
export const processRefund = async (paymentId, amount, reason) => {
  try {
    const response = await api.post('/payment/refund', {
      paymentId,
      amount,
      reason
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to process refund');
  }
}; 