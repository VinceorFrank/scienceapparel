import { api } from './config';

// Create payment intent
export const createPaymentIntent = async (orderId, paymentMethod = 'stripe') => {
  try {
    const response = await api.post('/payment/create-intent', {
      orderId,
      paymentMethod
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create payment intent');
  }
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