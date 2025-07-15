import { useState, useEffect } from "react";

/**
 * Persist a piece of React state in localStorage.
 */
export default function usePersistentState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* ignore quota / private-mode errors */ }
  }, [key, value]);

  return [value, setValue];
} 