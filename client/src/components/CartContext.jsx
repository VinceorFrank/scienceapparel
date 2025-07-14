import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Helper to update cart count from storage or backend
  const updateCartCount = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      // Fetch from backend
      try {
        const res = await fetch('/api/cart', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const count = data?.data?.cart?.itemCount || 0;
        console.log('[CartContext] Backend cart count:', count);
        setCartCount(count);
      } catch {
        console.log('[CartContext] Backend cart error, setting count to 0');
        setCartCount(0);
      }
    } else {
      // Guest cart
      const guestItems = getGuestCart();
      const count = guestItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
      console.log('[CartContext] Guest cart items:', guestItems);
      console.log('[CartContext] Guest cart count:', count);
      setCartCount(count);
    }
  };

  useEffect(() => {
    updateCartCount();
    // Listen for cart updates
    const handler = () => updateCartCount();
    window.addEventListener('cartUpdated', handler);
    window.addEventListener('storage', handler);
    
    // Force update on focus (in case of cache issues)
    const focusHandler = () => {
      console.log('[CartContext] Window focused, updating cart count');
      updateCartCount();
    };
    window.addEventListener('focus', focusHandler);
    
    return () => {
      window.removeEventListener('cartUpdated', handler);
      window.removeEventListener('storage', handler);
      window.removeEventListener('focus', focusHandler);
    };
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, updateCartCount }}>
      {children}
    </CartContext.Provider>
  );
}; 