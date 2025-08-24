import { useState, useEffect, useCallback, useMemo } from 'react';
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
    // Add global background toggle
    states.useGlobalBackground = blockStorage.getUseGlobalBackground(pageSlug);
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
    // Add global background toggle
    newStates.useGlobalBackground = blockStorage.getUseGlobalBackground(pageSlug);
    setBlockStates(newStates);

    const storedOrder = blockStorage.getOrder(pageSlug);
    if (storedOrder) {
      const validatedOrder = validateBlockOrder(storedOrder, validBlocks);
      setBlockOrder(validatedOrder);
    }
  }, [pageSlug, validBlocks]);

  // Create toggle functions with useCallback - fixed to avoid hooks in loops
  const toggleFunctions = useMemo(() => {
    const functions = {};
    validBlocks.forEach(block => {
      functions[`toggle${block.charAt(0).toUpperCase() + block.slice(1)}`] = (enabled) => {
        setBlockStates(prev => ({
          ...prev,
          [`${block}Enabled`]: enabled
        }));
        blockStorage.setEnabled(pageSlug, block, enabled);
      };
    });
    return functions;
  }, [pageSlug, validBlocks]);

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
    // Add global background toggle
    toggles.useGlobalBackground = blockStates.useGlobalBackground;
    return toggles;
  }, [validBlocks, blockStates]);

  // Toggle global background function
  const toggleUseGlobalBackground = useCallback((enabled) => {
    setBlockStates(prev => ({
      ...prev,
      useGlobalBackground: enabled
    }));
    blockStorage.setUseGlobalBackground(pageSlug, enabled);
  }, [pageSlug]);

  return {
    // Block states
    ...blockStates,
    blockOrder,
    
    // Toggle functions
    ...toggleFunctions,
    toggleUseGlobalBackground,
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