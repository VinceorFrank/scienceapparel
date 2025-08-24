// client/src/components/CartContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/config';

const CartContext = createContext();
export const useCartContext = () => useContext(CartContext);

const getGuestCart = () => {
  try {
    return JSON.parse(localStorage.getItem('guestCart')) || [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);

  const computeGuestCount = () => {
    const items = getGuestCart();
    return items.reduce((sum, it) => sum + (it.quantity || 1), 0);
  };

  const updateCartCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const { data } = await api.get('/cart');
        const items = Array.isArray(data?.items) ? data.items : [];
        const count = items.reduce((sum, it) => sum + (it.quantity || 0), 0);
        setCartCount(count);
      } else {
        setCartCount(computeGuestCount());
      }
    } catch (err) {
      console.error('[CartContext] Failed to refresh cart count:', err.normalizedMessage || err.message);
      // If server fetch fails (e.g., network), fallback to guest cart so UI doesn't look broken
      setCartCount(computeGuestCount());
    }
  };

  useEffect(() => {
    // Initial load - wrap async call properly
    const initCart = async () => {
      await updateCartCount();
    };
    initCart();

    // Listen for cross-component/cart updates
    const handler = () => updateCartCount();
    window.addEventListener('cartUpdated', handler);
    window.addEventListener('storage', handler);

    // Refresh when user focuses the tab (helps after login/logout)
    const onFocus = () => updateCartCount();
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('cartUpdated', handler);
      window.removeEventListener('storage', handler);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, updateCartCount }}>
      {children}
    </CartContext.Provider>
  );
}; 