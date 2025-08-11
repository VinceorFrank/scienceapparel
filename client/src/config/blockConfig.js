// Centralized block configuration system
export const BLOCK_CONFIG = {
  about: {
    blocks: ['extra', 'hero', 'infoA', 'infoB'],
    defaultOrder: ['extra', 'hero', 'infoA', 'infoB'],
    labels: {
      extra: '⭐ Extra',
      hero: '🎯 Hero',
      infoA: 'ℹ️ Info A',
      infoB: '📋 Info B'
    },
    descriptions: {
      extra: 'Extra section at the top of the page - can display text or image content',
      hero: 'Main banner section with title and mission statement',
      infoA: 'First informational section about why to choose us',
      infoB: 'Second informational section about team and culture'
    },
    settings: {
      hero: {
        hasButtonSettings: true,
        buttonPositions: ['top', 'middle', 'bottom'],
        buttonDestinations: ['products', 'clothing-accessories', 'accessories'],
        defaultButtonPosition: 'bottom',
        defaultButtonDestination: 'products'
      },
      extra: {
        hasButtonSettings: false,
        contentTypes: ['text', 'image'],
        defaultContentType: 'text'
      },
      infoA: {
        hasButtonSettings: false,
        contentTypes: ['text', 'image'],
        defaultContentType: 'text'
      },
      infoB: {
        hasButtonSettings: false,
        contentTypes: ['text', 'image'],
        defaultContentType: 'text'
      }
    }
  },
  home: {
    blocks: ['hero', 'infoA', 'infoB', 'mini'],
    defaultOrder: ['hero', 'infoA', 'infoB', 'mini'],
    labels: {
      hero: '🎯 Hero',
      infoA: 'ℹ️ Info A',
      infoB: '📋 Info B',
      mini: '🖼️ Mini'
    },
    descriptions: {
      hero: 'Main hero section with call-to-action',
      infoA: 'First feature section',
      infoB: 'Second feature section',
      mini: 'Mini banner section'
    },
    settings: {
      hero: {
        hasButtonSettings: true,
        buttonPositions: ['top', 'middle', 'bottom'],
        buttonDestinations: ['products', 'clothing-accessories', 'accessories'],
        defaultButtonPosition: 'bottom',
        defaultButtonDestination: 'products'
      },
      mini: {
        hasButtonSettings: true,
        buttonPositions: ['center'],
        buttonDestinations: ['products', 'clothing-accessories', 'accessories'],
        defaultButtonPosition: 'center',
        defaultButtonDestination: 'products'
      },
      infoA: {
        hasButtonSettings: false,
        contentTypes: ['text', 'image'],
        defaultContentType: 'text'
      },
      infoB: {
        hasButtonSettings: false,
        contentTypes: ['text', 'image'],
        defaultContentType: 'text'
      }
    }
  },
  products: {
    blocks: ['hero', 'filters', 'grid', 'pagination'],
    defaultOrder: ['hero', 'filters', 'grid', 'pagination'],
    labels: {
      hero: '🎯 Hero',
      filters: '🔍 Filters',
      grid: '📦 Product Grid',
      pagination: '📄 Pagination'
    },
    descriptions: {
      hero: 'Products page hero section',
      filters: 'Product filtering controls',
      grid: 'Product display grid',
      pagination: 'Page navigation controls'
    },
    settings: {
      hero: {
        hasButtonSettings: true,
        buttonPositions: ['top', 'middle', 'bottom'],
        buttonDestinations: ['products', 'clothing-accessories', 'accessories'],
        defaultButtonPosition: 'bottom',
        defaultButtonDestination: 'products'
      },
      filters: {
        hasButtonSettings: false,
        contentTypes: ['controls'],
        defaultContentType: 'controls'
      },
      grid: {
        hasButtonSettings: false,
        contentTypes: ['products'],
        defaultContentType: 'products'
      },
      pagination: {
        hasButtonSettings: false,
        contentTypes: ['navigation'],
        defaultContentType: 'navigation'
      }
    }
  },
  contact: {
    blocks: ['hero', 'form', 'info'],
    defaultOrder: ['hero', 'form', 'info'],
    labels: {
      hero: '🎯 Hero',
      form: '📝 Contact Form',
      info: 'ℹ️ Contact Info'
    },
    descriptions: {
      hero: 'Contact page hero section',
      form: 'Contact form section',
      info: 'Contact information section'
    },
    settings: {
      hero: {
        hasButtonSettings: true,
        buttonPositions: ['top', 'middle', 'bottom'],
        buttonDestinations: ['products', 'clothing-accessories', 'accessories'],
        defaultButtonPosition: 'bottom',
        defaultButtonDestination: 'products'
      },
      form: {
        hasButtonSettings: false,
        contentTypes: ['form'],
        defaultContentType: 'form'
      },
      info: {
        hasButtonSettings: false,
        contentTypes: ['text', 'image'],
        defaultContentType: 'text'
      }
    }
  }
};

// Helper functions
export const getBlockConfig = (pageSlug) => {
  return BLOCK_CONFIG[pageSlug] || {
    blocks: [],
    defaultOrder: [],
    labels: {},
    descriptions: {},
    settings: {}
  };
};

export const validateBlockOrder = (order, validBlocks) => {
  if (!Array.isArray(order) || !Array.isArray(validBlocks)) {
    return validBlocks;
  }
  return order.filter(block => validBlocks.includes(block));
};

export const getBlockLabel = (pageSlug, blockKey) => {
  const config = getBlockConfig(pageSlug);
  return config.labels[blockKey] || blockKey;
};

export const getBlockDescription = (pageSlug, blockKey) => {
  const config = getBlockConfig(pageSlug);
  return config.descriptions[blockKey] || '';
};

export const getBlockSettings = (pageSlug, blockKey) => {
  const config = getBlockConfig(pageSlug);
  return config.settings[blockKey] || {
    hasButtonSettings: false,
    contentTypes: ['text'],
    defaultContentType: 'text'
  };
};

export const hasButtonSettings = (pageSlug, blockKey) => {
  const settings = getBlockSettings(pageSlug, blockKey);
  return settings.hasButtonSettings || false;
};

// Background priority system
export const BACKGROUND_PRIORITY = {
  order: ['page-specific', 'global', 'fallback'],
  fallback: 'linear-gradient(135deg, #FB9EBB, #F3F3AB, #A4D4DC, #F4CEB8)',
  slots: {
    pageSpecific: 'background',
    global: 'sitewide-background'
  }
};

// Helper function to determine background priority
export const getBackgroundPriority = (pageAssets = [], globalAssets = [], useGlobalBackground = false) => {
  const pageBg = pageAssets.find(a => a.slot === BACKGROUND_PRIORITY.slots.pageSpecific);
  const globalBg = globalAssets.find(a => a.slot === BACKGROUND_PRIORITY.slots.global);
  
  let background, source;
  
  if (useGlobalBackground && globalBg) {
    // If global background is forced and exists, use it
    background = globalBg;
    source = 'global-forced';
  } else if (pageBg) {
    // Otherwise, page-specific takes priority
    background = pageBg;
    source = 'page-specific';
  } else if (globalBg) {
    // Fallback to global if no page-specific
    background = globalBg;
    source = 'global-fallback';
  } else {
    // No background found
    background = null;
    source = 'fallback';
  }
  
  console.log('[DEBUG] getBackgroundPriority:', {
    pageAssetsCount: pageAssets.length,
    globalAssetsCount: globalAssets.length,
    useGlobalBackground,
    pageBg,
    globalBg,
    pageBgSlot: BACKGROUND_PRIORITY.slots.pageSpecific,
    globalBgSlot: BACKGROUND_PRIORITY.slots.global,
    result: { background, source }
  });
  
  return { background, source };
}; 