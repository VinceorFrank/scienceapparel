import { useState, useEffect, useCallback } from 'react';
import { getBlockConfig, validateBlockOrder } from '../config/blockConfig';
import { blockStorage } from '../utils/safeStorage';

export const useBlockToggle = (pageSlug = 'home') => {
  const config = getBlockConfig(pageSlug);
  const validBlocks = config.blocks;
  const defaultOrder = config.defaultOrder;

  // Initialize state with validated values
  const [blockStates, setBlockStates] = useState(() => {
    const states = {};
    validBlocks.forEach(block => {
      states[`${block}Enabled`] = blockStorage.getEnabled(pageSlug, block);
    });
    return states;
  });

  const [blockOrder, setBlockOrder] = useState(() => {
    const storedOrder = blockStorage.getOrder(pageSlug);
    if (storedOrder) {
      return validateBlockOrder(storedOrder, validBlocks);
    }
    return defaultOrder;
  });

  // Load from storage on mount
  useEffect(() => {
    const newStates = {};
    validBlocks.forEach(block => {
      newStates[`${block}Enabled`] = blockStorage.getEnabled(pageSlug, block);
    });
    setBlockStates(newStates);

    const storedOrder = blockStorage.getOrder(pageSlug);
    if (storedOrder) {
      const validatedOrder = validateBlockOrder(storedOrder, validBlocks);
      setBlockOrder(validatedOrder);
    }
  }, [pageSlug, validBlocks]);

  // Create toggle functions with useCallback
  const toggleFunctions = {};
  validBlocks.forEach(block => {
    toggleFunctions[`toggle${block.charAt(0).toUpperCase() + block.slice(1)}`] = useCallback((enabled) => {
      setBlockStates(prev => ({
        ...prev,
        [`${block}Enabled`]: enabled
      }));
      blockStorage.setEnabled(pageSlug, block, enabled);
    }, [pageSlug, block]);
  });

  // Update block order with validation
  const updateBlockOrder = useCallback((order) => {
    const validatedOrder = validateBlockOrder(order, validBlocks);
    setBlockOrder(validatedOrder);
    blockStorage.setOrder(pageSlug, validatedOrder);
  }, [pageSlug, validBlocks]);

  // Reset to default order
  const resetToDefault = useCallback(() => {
    updateBlockOrder(defaultOrder);
  }, [updateBlockOrder, defaultOrder]);

  // Reset all blocks to enabled
  const resetAllEnabled = useCallback(() => {
    const newStates = {};
    validBlocks.forEach(block => {
      newStates[`${block}Enabled`] = true;
      blockStorage.setEnabled(pageSlug, block, true);
    });
    setBlockStates(newStates);
  }, [pageSlug, validBlocks]);

  // Get all enabled states as a single object
  const getToggles = useCallback(() => {
    const toggles = {};
    validBlocks.forEach(block => {
      toggles[`${block}Enabled`] = blockStates[`${block}Enabled`];
    });
    return toggles;
  }, [validBlocks, blockStates]);

  return {
    // Block states
    ...blockStates,
    blockOrder,
    
    // Toggle functions
    ...toggleFunctions,
    updateBlockOrder,
    
    // Utility functions
    resetToDefault,
    resetAllEnabled,
    getToggles,
    
    // Configuration
    validBlocks,
    defaultOrder,
    config
  };
}; 