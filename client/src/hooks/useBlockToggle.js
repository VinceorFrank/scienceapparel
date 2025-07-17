import { useState, useEffect } from 'react';

export const useBlockToggle = (pageSlug = 'home') => {
  const [heroEnabled, setHeroEnabled] = useState(true);
  const [miniEnabled, setMiniEnabled] = useState(true);
  const [infoAEnabled, setInfoAEnabled] = useState(true);
  const [infoBEnabled, setInfoBEnabled] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const storedHero = localStorage.getItem(`hero_enabled_${pageSlug}`);
    const storedMini = localStorage.getItem(`mini_enabled_${pageSlug}`);
    const storedInfoA = localStorage.getItem(`infoA_enabled_${pageSlug}`);
    const storedInfoB = localStorage.getItem(`infoB_enabled_${pageSlug}`);
    
    if (storedHero !== null) setHeroEnabled(JSON.parse(storedHero));
    if (storedMini !== null) setMiniEnabled(JSON.parse(storedMini));
    if (storedInfoA !== null) setInfoAEnabled(JSON.parse(storedInfoA));
    if (storedInfoB !== null) setInfoBEnabled(JSON.parse(storedInfoB));
  }, [pageSlug]);

  // Save to localStorage whenever settings change
  const toggleHero = (enabled) => {
    setHeroEnabled(enabled);
    localStorage.setItem(`hero_enabled_${pageSlug}`, JSON.stringify(enabled));
  };

  const toggleMini = (enabled) => {
    setMiniEnabled(enabled);
    localStorage.setItem(`mini_enabled_${pageSlug}`, JSON.stringify(enabled));
  };

  const toggleInfoA = (enabled) => {
    setInfoAEnabled(enabled);
    localStorage.setItem(`infoA_enabled_${pageSlug}`, JSON.stringify(enabled));
  };

  const toggleInfoB = (enabled) => {
    setInfoBEnabled(enabled);
    localStorage.setItem(`infoB_enabled_${pageSlug}`, JSON.stringify(enabled));
  };

  return {
    heroEnabled,
    miniEnabled,
    infoAEnabled,
    infoBEnabled,
    toggleHero,
    toggleMini,
    toggleInfoA,
    toggleInfoB
  };
}; 