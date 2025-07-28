import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../utils/lang';
import ExtraSection from './blocks/ExtraSection';
import HeroBlock from './blocks/HeroBlock';
import InfoBlockA from './blocks/InfoBlockA';
import InfoBlockB from './blocks/InfoBlockB';
import { getBlockLabel, hasButtonSettings } from '../config/blockConfig';

// Block component registry
const BLOCK_COMPONENTS = {
  extra: ExtraSection,
  hero: HeroBlock,
  infoA: InfoBlockA,
  infoB: InfoBlockB,
  // Add more blocks here as needed
  // mini: MiniBlock,
  // filters: FiltersBlock,
  // grid: GridBlock,
  // pagination: PaginationBlock,
};

const LayoutRenderer = ({ 
  slug, 
  assets = [], 
  toggles = {}, 
  blockOrder = [],
  className = "min-h-screen pt-32 px-4 sm:px-8",
  previewMode = false,
  buttonSettings = {},
  onBlockClick = null
}) => {
  const { t } = useLang();

  // Helper function to get asset data for a specific slot
  const getAsset = (slot) => {
    return assets.find(a => a.slot === slot) || {};
  };

  // Helper function to get button destination URL
  const getButtonDestination = (destination) => {
    switch (destination) {
      case 'clothing-accessories':
        return '/clothing-accessories';
      case 'accessories':
        return '/accessories';
      default:
        return '/products';
    }
  };

  // Render a single block with preview mode support
  const renderBlock = (blockKey) => {
    const BlockComponent = BLOCK_COMPONENTS[blockKey];
    
    if (!BlockComponent) {
      console.warn(`No component found for block: ${blockKey}`);
      return null;
    }

    const isEnabled = toggles[`${blockKey}Enabled`] !== false; // Default to true if not specified
    const asset = getAsset(blockKey);
    const blockLabel = getBlockLabel(slug, blockKey);
    const hasButtons = hasButtonSettings(slug, blockKey);
    const buttonConfig = buttonSettings[blockKey] || {};

    // If preview mode and block is disabled, show placeholder
    if (previewMode && !isEnabled) {
      return (
        <div 
          key={blockKey}
          className="relative border-2 border-dashed border-gray-300 rounded-3xl p-8 mb-8 bg-gray-50 min-h-[200px] flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => onBlockClick && onBlockClick(blockKey)}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">🚫</div>
            <div className="text-lg font-semibold text-gray-600">{blockLabel}</div>
            <div className="text-sm text-gray-500">Click to enable</div>
          </div>
        </div>
      );
    }

    // If not enabled and not in preview mode, don't render
    if (!isEnabled && !previewMode) {
      return null;
    }

    // Prepare props based on block type
    const props = {
      enabled: isEnabled,
      ...asset, // Spread all asset properties
    };

    // Block-specific prop mapping
    let blockContent;
    switch (blockKey) {
      case 'extra':
        blockContent = (
          <BlockComponent
            {...props}
            type={asset.type || 'text'}
            textContent={asset.text}
            imageUrl={asset.imageUrl}
            overlay={asset.overlay}
          />
        );
        break;
      
      case 'hero':
        blockContent = (
          <BlockComponent
            {...props}
            title={asset.title}
            subtitle={asset.subtitle}
            backgroundImage={asset.imageUrl}
            overlay={asset.overlay}
            buttonPosition={buttonConfig.position || 'bottom'}
            buttonDestination={buttonConfig.destination || 'products'}
            onButtonClick={() => {
              const destination = getButtonDestination(buttonConfig.destination || 'products');
              window.location.href = destination;
            }}
          />
        );
        break;
      
      case 'infoA':
        blockContent = (
          <BlockComponent
            {...props}
            title={asset.title}
            content={asset.text}
            backgroundImage={asset.imageUrl}
            overlay={asset.overlay}
          />
        );
        break;
      
      case 'infoB':
        blockContent = (
          <BlockComponent
            {...props}
            title={asset.title}
            content={asset.text}
            backgroundImage={asset.imageUrl}
            overlay={asset.overlay}
          />
        );
        break;
      
      default:
        blockContent = <BlockComponent {...props} />;
    }

    // Wrap with preview overlay if in preview mode
    if (previewMode) {
      return (
        <div 
          key={blockKey}
          className="relative group"
          onClick={() => onBlockClick && onBlockClick(blockKey)}
        >
          {/* Block Label Overlay */}
          <div className="absolute top-2 left-2 z-20 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
            {blockLabel}
          </div>
          
          {/* Click Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 z-10 rounded-3xl cursor-pointer" />
          
          {/* Block Content */}
          <div className="relative z-0">
            {blockContent}
          </div>
        </div>
      );
    }

    return (
      <React.Fragment key={blockKey}>
        {blockContent}
      </React.Fragment>
    );
  };

  return (
    <div className={className}>
      {blockOrder.map((blockKey) => renderBlock(blockKey))}
    </div>
  );
};

export default LayoutRenderer; 