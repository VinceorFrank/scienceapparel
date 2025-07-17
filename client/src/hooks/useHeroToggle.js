import { useState, useEffect } from 'react';

export const useHeroToggle = (pageSlug = 'home') => {
  const [heroEnabled, setHeroEnabled] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`hero_enabled_${pageSlug}`);
    if (stored !== null) {
      setHeroEnabled(JSON.parse(stored));
    }
  }, [pageSlug]);

  // Save to localStorage whenever it changes
  const toggleHero = (enabled) => {
    setHeroEnabled(enabled);
    localStorage.setItem(`hero_enabled_${pageSlug}`, JSON.stringify(enabled));
  };

  return [heroEnabled, toggleHero];
}; 