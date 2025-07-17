import { useState, useEffect } from 'react';

export const useMiniButtonSettings = (pageSlug = 'home') => {
  const [buttonDestination, setButtonDestination] = useState('products'); // 'products', 'clothing-accessories', 'accessories'

  // Load from localStorage on mount
  useEffect(() => {
    const storedDestination = localStorage.getItem(`mini_button_destination_${pageSlug}`);
    
    if (storedDestination) {
      setButtonDestination(JSON.parse(storedDestination));
    }
  }, [pageSlug]);

  // Save to localStorage whenever settings change
  const updateButtonDestination = (destination) => {
    setButtonDestination(destination);
    localStorage.setItem(`mini_button_destination_${pageSlug}`, JSON.stringify(destination));
  };

  return {
    buttonDestination,
    updateButtonDestination
  };
}; 