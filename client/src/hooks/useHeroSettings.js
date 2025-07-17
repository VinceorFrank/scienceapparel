import { useState, useEffect } from 'react';

export const useHeroSettings = (pageSlug = 'home') => {
  const [buttonPosition, setButtonPosition] = useState('bottom'); // 'top', 'middle', 'bottom'
  const [buttonDestination, setButtonDestination] = useState('products'); // 'products', 'clothing-accessories', 'accessories'

  // Load from localStorage on mount
  useEffect(() => {
    const storedPosition = localStorage.getItem(`hero_button_position_${pageSlug}`);
    const storedDestination = localStorage.getItem(`hero_button_destination_${pageSlug}`);
    
    if (storedPosition) {
      setButtonPosition(JSON.parse(storedPosition));
    }
    if (storedDestination) {
      setButtonDestination(JSON.parse(storedDestination));
    }
  }, [pageSlug]);

  // Save to localStorage whenever settings change
  const updateButtonPosition = (position) => {
    setButtonPosition(position);
    localStorage.setItem(`hero_button_position_${pageSlug}`, JSON.stringify(position));
  };

  const updateButtonDestination = (destination) => {
    setButtonDestination(destination);
    localStorage.setItem(`hero_button_destination_${pageSlug}`, JSON.stringify(destination));
  };

  return {
    buttonPosition,
    buttonDestination,
    updateButtonPosition,
    updateButtonDestination
  };
}; 