import api from './config';

// Get user's cart
export const getCart = async () => {
  const res = await api.get('/cart');
  return res.data;
};

// Add item to cart
export const addCartItem = async (productId, quantity = 1) => {
  const res = await api.post('/cart/items', { productId, quantity });
  return res.data;
};

// Update item quantity in cart
export const updateCartItem = async (productId, quantity) => {
  const res = await api.put(`/cart/items/${productId}`, { quantity });
  return res.data;
};

// Remove item from cart
export const removeCartItem = async (productId) => {
  const res = await api.delete(`/cart/items/${productId}`);
  return res.data;
};

// Clear entire cart
export const clearCart = async () => {
  const res = await api.delete('/cart');
  return res.data;
};

// Validate cart
export const validateCart = async () => {
  const res = await api.get('/cart/validate');
  return res.data;
};

// Get cart summary
export const getCartSummary = async () => {
  const res = await api.get('/cart/summary');
  return res.data;
};

// Merge guest cart with user cart
export const mergeGuestCart = async (guestCartItems) => {
  const res = await api.post('/cart/merge', { guestCartItems });
  return res.data;
}; 