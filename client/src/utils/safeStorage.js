// Safe localStorage wrapper with error handling
export const safeLocalStorage = {
  get: (key, fallback = null) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.warn(`localStorage get error for key "${key}":`, error);
      return fallback;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`localStorage set error for key "${key}":`, error);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`localStorage remove error for key "${key}":`, error);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('localStorage clear error:', error);
      return false;
    }
  }
};

// Block-specific storage helpers
export const blockStorage = {
  getEnabled: (pageSlug, blockKey) => {
    return safeLocalStorage.get(`${blockKey}_enabled_${pageSlug}`, true);
  },

  setEnabled: (pageSlug, blockKey, enabled) => {
    return safeLocalStorage.set(`${blockKey}_enabled_${pageSlug}`, enabled);
  },

  getOrder: (pageSlug) => {
    return safeLocalStorage.get(`block_order_${pageSlug}`, null);
  },

  setOrder: (pageSlug, order) => {
    return safeLocalStorage.set(`block_order_${pageSlug}`, order);
  },

  clearPage: (pageSlug) => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes(`_${pageSlug}`)) {
        safeLocalStorage.remove(key);
      }
    });
  },

  // Global background toggle storage
  getUseGlobalBackground: (pageSlug) => {
    return safeLocalStorage.get(`use_global_background_${pageSlug}`, false);
  },

  setUseGlobalBackground: (pageSlug, enabled) => {
    return safeLocalStorage.set(`use_global_background_${pageSlug}`, enabled);
  }
}; 