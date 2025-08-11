import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertPageAsset, deletePageAsset } from '../../api/pageAssets';
import PastelCard from '../../components/PastelCard';
import { useLang } from '../../utils/lang';
import { useBlockToggle } from '../../hooks/useBlockToggle';
import { useHeroSettings } from '../../hooks/useHeroSettings';
import { useMiniButtonSettings } from '../../hooks/useMiniButtonSettings';
import LayoutRenderer from '../../components/LayoutRenderer';
import { hasButtonSettings } from '../../config/blockConfig';

// Define slots based on page type
const getSlotsForPage = (pageSlug) => {
  if (pageSlug === 'home') {
    return ['hero', 'infoA', 'infoB', 'background', 'mini'];
  } else if (pageSlug === 'about') {
    return ['extra', 'hero', 'infoA', 'infoB', 'background'];
  } else if (pageSlug === 'global') {
    return ['sitewide-background'];
  }
  return [];
};
const pages = ['home', 'about', 'global', 'account', 'cart', 'shipping', 'admin'];

// Slot dimensions configuration
const slotDimensions = {
  // Home page slots
  hero: {
    recommended: '1920×600px',
    aspectRatio: '16:5',
    description: 'heroDescription'
  },
  infoA: {
    recommended: '800×600px',
    aspectRatio: '4:3',
    description: 'infoADescription'
  },
  infoB: {
    recommended: '800×600px',
    aspectRatio: '4:3',
    description: 'infoBDescription'
  },
  background: {
    recommended: '1920×1080px',
    aspectRatio: '16:9',
    description: 'backgroundDescription'
  },
  mini: {
    recommended: '800×200px',
    min: '600×150px',
    max: '1200×300px',
    aspectRatio: '4:1',
    description: 'miniDescription'
  },
  
  // Extra slot for about page
  extra: {
    recommended: '1920×400px',
    aspectRatio: '24:5',
    description: 'extraDescription'
  },
  // Add to slotDimensions
  'sitewide-background': {
    recommended: '1920×1080px',
    aspectRatio: '16:9',
    description: 'Global background image for all pages (appears behind everything)'
  }
};

const PagesAdmin = () => {
  const { t } = useLang();
  const qc = useQueryClient();
  const [pageSlug, setPageSlug] = useState('home');
  const [previewMode, setPreviewMode] = useState(false);
  const { 
    blockOrder,
    updateBlockOrder,
    resetToDefault,
    resetAllEnabled,
    getToggles,
    validBlocks,
    config,
    ...toggleFunctions
  } = useBlockToggle(pageSlug);
  
  // Get toggles once to avoid multiple calls
  const toggles = getToggles() || {};
  const { buttonPosition, buttonDestination, updateButtonPosition, updateButtonDestination } = useHeroSettings(pageSlug);
  const { buttonDestination: miniButtonDestination, updateButtonDestination: updateMiniButtonDestination } = useMiniButtonSettings(pageSlug);

  // About page specific state
  const [aboutSections, setAboutSections] = useState({
    mainContent: { enabled: true, content: '' },
    mainImage: { enabled: true },
    secondaryContent: { enabled: true, content: '' },
    secondaryImage: { enabled: true }
  });

  // Note: Site-wide background control removed - backgrounds are now handled per-page in Layout.jsx
  // This provides better control and prevents conflicts between pages

  // Note: Background control moved to Layout.jsx for proper page-specific backgrounds
  // This prevents conflicts with the main layout system
  // useEffect(() => {
  //   // REMOVED: Body background override to prevent conflicts with Layout.jsx
  //   // Backgrounds are now handled properly in Layout.jsx with page-specific priority
  // }, [siteBackground, customBackgroundColor]);

  // Fetch both current page and global assets
  const { data: pageAssets = [], isLoading: isLoadingPage, error: errorPage } = useQuery({
    queryKey: ['pageAssets', pageSlug],
    queryFn: async () => {
      const response = await fetch(`/api/pages/${pageSlug}`);
      if (!response.ok) {
        throw new Error(t('failedToFetchAssets'));
      }
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    },
    keepPreviousData: true,
  });
  const { data: globalAssets = [], isLoading: isLoadingGlobal, error: errorGlobal } = useQuery({
    queryKey: ['pageAssets', 'global'],
    queryFn: async () => {
      const response = await fetch(`/api/pages/global`);
      if (!response.ok) {
        // If not found, just return empty array
        return [];
      }
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    },
    keepPreviousData: true,
  });
  const isLoading = isLoadingPage || isLoadingGlobal;
  const error = errorPage || errorGlobal;
  const assets = [...(Array.isArray(pageAssets) ? pageAssets : []), ...(Array.isArray(globalAssets) ? globalAssets : [])];

  const upsert = useMutation({
    mutationFn: upsertPageAsset,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pageAssets', pageSlug] }),
  });
  const remove = useMutation({
    mutationFn: deletePageAsset,
    onSuccess: (data, variables) => {
      // Invalidate both current page and global assets
      qc.invalidateQueries({ queryKey: ['pageAssets', pageSlug] });
      if (variables.pageSlug === 'global' || variables.slot === 'sitewide-background') {
        qc.invalidateQueries({ queryKey: ['pageAssets', 'global'] });
      }
    },
  });

  const handleFile = (slot, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fd = new FormData();
    fd.append('file', file);
    // Use pageSlug 'global' for sitewide-background, otherwise use current pageSlug
    fd.append('pageSlug', slot === 'sitewide-background' ? 'global' : pageSlug);
    fd.append('slot', slot);
    
    upsert.mutate(fd);
  };

  const handleBlockClick = (blockKey) => {
    const toggleFunction = toggleFunctions[`toggle${blockKey.charAt(0).toUpperCase() + blockKey.slice(1)}`];
    if (toggleFunction) {
      toggleFunction(true); // Enable the block
    }
  };

  // Prepare button settings for LayoutRenderer
  const buttonSettings = {
    hero: {
      position: buttonPosition,
      destination: buttonDestination
    },
    mini: {
      position: 'center',
      destination: miniButtonDestination
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Page Management</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  previewMode 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {previewMode ? 'Exit Preview' : 'Live Preview'}
              </button>
              <select
                value={pageSlug}
                onChange={(e) => setPageSlug(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {pages.map(page => (
                  <option key={page} value={page}>
                    {page.charAt(0).toUpperCase() + page.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {previewMode ? (
          /* Live Preview Mode */
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                🎨 Live Preview - {pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1)} Page
              </h2>
              <p className="text-gray-600 mb-6">
                Hover over blocks to see labels. Click on disabled blocks to enable them.
              </p>
              
              {/* Preview Container */}
              <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                <LayoutRenderer
                  slug={pageSlug}
                  assets={assets}
                  toggles={toggles}
                  blockOrder={blockOrder}
                  previewMode={true}
                  buttonSettings={buttonSettings}
                  onBlockClick={handleBlockClick}
                  className="min-h-screen pt-16 px-4 sm:px-8"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Admin Controls Mode */
          <div className="space-y-8">
            {/* 🌍 GLOBAL BACKGROUND MANAGEMENT */}
            {pageSlug === 'global' && (
              <div className="bg-gradient-to-r from-purple-100 to-indigo-100 border-4 border-purple-400 rounded-xl p-6 mb-8 shadow-xl">
                <h3 className="text-3xl font-bold text-purple-800 mb-6 text-center">🌍 GLOBAL BACKGROUND MANAGEMENT</h3>
                <div className="bg-white p-6 rounded-lg border-2 border-purple-300 shadow-lg">
                  <h4 className="font-bold text-xl text-purple-700 mb-4 flex items-center">
                    🌐 <span className="ml-2">Sitewide Background</span>
                  </h4>
                  <p className="text-purple-600 mb-6">
                    This background is used as a fallback when no page-specific background is set. 
                    It will appear on all pages that don't have their own background uploaded.
                  </p>
                  
                  {/* Global Background Preview */}
                  <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h5 className="font-semibold text-purple-700 mb-3">Current Global Background</h5>
                    {globalAssets.find(a => a.slot === 'sitewide-background')?.imageUrl ? (
                      <div>
                        <img
                          src={globalAssets.find(a => a.slot === 'sitewide-background').imageUrl}
                          alt="Global background preview"
                          className="w-full h-32 object-cover rounded border-2 border-purple-300 mb-3"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => remove.mutate({ pageSlug: 'global', slot: 'sitewide-background' })}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                            title="Delete global background"
                          >
                            Remove Global Background
                          </button>
                          <a
                            href={globalAssets.find(a => a.slot === 'sitewide-background').imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                            title="View full-size image"
                          >
                            View Full Size
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-purple-300 rounded-lg">
                        <p className="text-purple-600 mb-2">No global background set</p>
                        <p className="text-sm text-purple-500">Pages will use the default pastel gradient</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Section */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-purple-700">
                      Upload Global Background Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFile('sitewide-background', e)}
                      className="w-full text-sm text-purple-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                    <p className="text-xs text-gray-500">
                      Recommended size: 1920×1080px (16:9 aspect ratio)
                    </p>
                  </div>
                  
                  {/* Background Priority Info */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-700 mb-3">Background Priority System</h5>
                    <div className="text-sm text-blue-600 space-y-2">
                      <p><strong>Priority Order:</strong></p>
                      <ol className="list-decimal list-inside space-y-1 ml-4">
                        <li><strong>Page-specific background</strong> - Uploaded for each page (e.g., /about background)</li>
                        <li><strong>Global background</strong> - This sitewide background (if no page-specific exists)</li>
                        <li><strong>Fallback gradient</strong> - Default pastel gradient (if no images exist)</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 🎛️ BLOCK VISIBILITY CONTROLS */}
            {pageSlug !== 'global' && (
              <div className="bg-gradient-to-r from-green-100 to-blue-100 border-4 border-green-400 rounded-xl p-6 mb-8 shadow-xl">
                <h3 className="text-3xl font-bold text-green-800 mb-6 text-center">🎛️ BLOCK VISIBILITY CONTROLS</h3>
                <div className={`grid md:grid-cols-2 lg:grid-cols-${Math.min(validBlocks.length, 5)} gap-6`}>
                  {validBlocks.map((block) => {
                    const isEnabled = toggles[`${block}Enabled`] !== false; // Default to true if undefined
                    const toggleFunction = toggleFunctions[`toggle${block.charAt(0).toUpperCase() + block.slice(1)}`];
                    const label = config.labels[block] || block;
                    
                    return (
                      <div key={block} className="bg-white p-6 rounded-lg border-2 border-green-300 shadow-lg">
                        <h4 className="font-bold text-xl text-green-700 mb-4 flex items-center">
                          <span className="ml-2">{label}</span>
                        </h4>
                        <button
                          onClick={() => toggleFunction(!isEnabled)}
                          className={`w-full px-4 py-3 rounded-lg transition-colors ${
                            isEnabled 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          {isEnabled ? `Hide ${label.split(' ')[1] || label}` : `Show ${label.split(' ')[1] || label}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                {/* Current Status */}
                <div className="mt-6 bg-white p-4 rounded-lg border-2 border-green-300">
                  <h4 className="font-bold text-lg text-green-700 mb-2">📊 Current Block Status</h4>
                  <div className={`grid grid-cols-2 md:grid-cols-${Math.min(validBlocks.length, 5)} gap-4 text-sm`}>
                    {validBlocks.map((block) => {
                      const isEnabled = toggles[`${block}Enabled`] !== false; // Default to true if undefined
                      const label = config.labels[block] || block;
                      
                      return (
                        <div key={block} className={`px-3 py-2 rounded ${isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {label.split(' ')[1] || label}: {isEnabled ? t('visible') : t('hidden')}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 🌍 GLOBAL BACKGROUND TOGGLE */}
            {pageSlug !== 'global' && (
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-4 border-purple-400 rounded-xl p-6 mb-8 shadow-xl">
                <h3 className="text-3xl font-bold text-purple-800 mb-6 text-center">🌍 GLOBAL BACKGROUND SETTINGS</h3>
                <div className="bg-white p-6 rounded-lg border-2 border-purple-300 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xl text-purple-700 mb-2">Use Global Background</h4>
                      <p className="text-purple-600 text-sm">
                        When enabled, this page will use the global background instead of its own background.
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFunctions.toggleUseGlobalBackground(!toggles.useGlobalBackground)}
                      className={`px-6 py-3 rounded-lg font-bold transition-colors ${
                        toggles.useGlobalBackground 
                          ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                          : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                      }`}
                    >
                      {toggles.useGlobalBackground ? '🌍 Enabled' : '📄 Use Page Background'}
                    </button>
                  </div>
                  
                  {/* Status indicator */}
                  <div className="mt-4 p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-3 ${toggles.useGlobalBackground ? 'bg-purple-500' : 'bg-gray-400'}`}></span>
                      <span className="text-purple-700 font-medium">
                        {toggles.useGlobalBackground 
                          ? 'Using global background (overrides page background)' 
                          : 'Using page-specific background (if available)'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 🎛️ BLOCK ORDERING CONTROLS */}
            {pageSlug !== 'global' && (
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 border-4 border-blue-400 rounded-xl p-6 mb-8 shadow-xl">
              <h3 className="text-3xl font-bold text-blue-800 mb-6 text-center">🔄 {t('blockOrdering')}</h3>
              <div className="bg-white p-6 rounded-lg border-2 border-blue-300 shadow-lg">
                <h4 className="font-bold text-xl text-blue-700 mb-4 flex items-center">
                  📋 <span className="ml-2">{t('reorderPageSections')}</span>
                </h4>
                <div className="space-y-3">
                  {blockOrder.map((block, index) => (
                    <div key={block} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <span className="font-medium text-blue-800 capitalize">
                        {config.labels[block] || block}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (index === 0) return;
                            const newOrder = [...blockOrder];
                            [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
                            updateBlockOrder(newOrder);
                          }}
                          disabled={index === 0}
                          className="px-3 py-1 bg-blue-200 hover:bg-blue-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title={t('moveUp')}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => {
                            if (index === blockOrder.length - 1) return;
                            const newOrder = [...blockOrder];
                            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                            updateBlockOrder(newOrder);
                          }}
                          disabled={index === blockOrder.length - 1}
                          className="px-3 py-1 bg-blue-200 hover:bg-blue-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title={t('moveDown')}
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-blue-600 mt-4 italic">
                  💡 {t('changesApplyInstantly')}
                </p>
                
                {/* Reset Controls */}
                <div className="mt-6 pt-6 border-t border-blue-200">
                  <h5 className="font-semibold text-blue-700 mb-3">🔄 Reset Options</h5>
                  <div className="flex gap-3">
                    <button
                      onClick={resetToDefault}
                      className="px-4 py-2 bg-orange-200 hover:bg-orange-300 text-orange-800 rounded-lg transition-colors"
                      title="Reset block order to default"
                    >
                      Reset Order
                    </button>
                    <button
                      onClick={resetAllEnabled}
                      className="px-4 py-2 bg-green-200 hover:bg-green-300 text-green-800 rounded-lg transition-colors"
                      title="Enable all blocks"
                    >
                      Enable All
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* 🎛️ BUTTON SETTINGS CONTROLS */}
            {pageSlug !== 'global' && hasButtonSettings(pageSlug, 'hero') && toggles.heroEnabled !== false && (
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-4 border-purple-400 rounded-xl p-6 mb-8 shadow-xl">
                <h3 className="text-3xl font-bold text-purple-800 mb-6 text-center">🎛️ HERO BUTTON SETTINGS</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Button Position */}
                  <div className="bg-white p-6 rounded-lg border-2 border-purple-300 shadow-lg">
                    <h4 className="font-bold text-xl text-purple-700 mb-4 flex items-center">
                      📍 <span className="ml-2">{t('buttonPosition')}</span>
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="buttonPosition"
                          value="top"
                          checked={buttonPosition === 'top'}
                          onChange={(e) => updateButtonPosition(e.target.value)}
                          className="mr-3 text-purple-600"
                        />
                        <span className="text-purple-700">{t('top')} - Above the title</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="buttonPosition"
                          value="middle"
                          checked={buttonPosition === 'middle'}
                          onChange={(e) => updateButtonPosition(e.target.value)}
                          className="mr-3 text-purple-600"
                        />
                        <span className="text-purple-700">{t('middle')} - Between title and description</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="buttonPosition"
                          value="bottom"
                          checked={buttonPosition === 'bottom'}
                          onChange={(e) => updateButtonPosition(e.target.value)}
                          className="mr-3 text-purple-600"
                        />
                        <span className="text-purple-700">{t('bottom')} - Below description (current)</span>
                      </label>
                    </div>
                  </div>

                  {/* Button Destination */}
                  <div className="bg-white p-6 rounded-lg border-2 border-purple-300 shadow-lg">
                    <h4 className="font-bold text-xl text-purple-700 mb-4 flex items-center">
                      🔗 <span className="ml-2">{t('buttonDestination')}</span>
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="buttonDestination"
                          value="products"
                          checked={buttonDestination === 'products'}
                          onChange={(e) => updateButtonDestination(e.target.value)}
                          className="mr-3 text-purple-600"
                        />
                        <span className="text-purple-700">{t('products')} Page</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="buttonDestination"
                          value="clothing-accessories"
                          checked={buttonDestination === 'clothing-accessories'}
                          onChange={(e) => updateButtonDestination(e.target.value)}
                          className="mr-3 text-purple-600"
                        />
                        <span className="text-purple-700">{t('clothingAccessories')}</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="buttonDestination"
                          value="accessories"
                          checked={buttonDestination === 'accessories'}
                          onChange={(e) => updateButtonDestination(e.target.value)}
                          className="mr-3 text-purple-600"
                        />
                        <span className="text-purple-700">{t('accessories')} Page</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Preview Info */}
                <div className="mt-6 bg-white p-4 rounded-lg border-2 border-purple-300">
                  <h4 className="font-bold text-lg text-purple-700 mb-2">{t('livePreview')}</h4>
                  <p className="text-purple-600">
                    <strong>{t('currentSetting')}:</strong> {t('buttonPositionedAt')} <strong>{buttonPosition}</strong> {t('andLinkingTo')} <strong>{buttonDestination}</strong> {t('page')}.
                    {t('changesApplyInstantly')}
                  </p>
                </div>
              </div>
            )}

            {/* 🎛️ MINI BUTTON SETTINGS - HOME PAGE ONLY */}
            {pageSlug === 'home' && hasButtonSettings(pageSlug, 'mini') && toggles.miniEnabled !== false && (
              <div className="bg-gradient-to-r from-orange-100 to-yellow-100 border-4 border-orange-400 rounded-xl p-6 mb-8 shadow-xl">
                <h3 className="text-3xl font-bold text-orange-800 mb-6 text-center">{t('miniButtonSettings')}</h3>
                <div className="bg-white p-6 rounded-lg border-2 border-orange-300 shadow-lg">
                  <h4 className="font-bold text-xl text-orange-700 mb-4 flex items-center">
                    🔗 <span className="ml-2">{t('miniButtonDestination')}</span>
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="miniButtonDestination"
                        value="products"
                        checked={miniButtonDestination === 'products'}
                        onChange={(e) => updateMiniButtonDestination(e.target.value)}
                        className="mr-3 text-orange-600"
                      />
                      <span className="text-orange-700">{t('products')} Page</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="miniButtonDestination"
                        value="clothing-accessories"
                        checked={miniButtonDestination === 'clothing-accessories'}
                        onChange={(e) => updateMiniButtonDestination(e.target.value)}
                        className="mr-3 text-orange-600"
                      />
                      <span className="text-orange-700">{t('clothingAccessories')}</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="miniButtonDestination"
                        value="accessories"
                        checked={miniButtonDestination === 'accessories'}
                        onChange={(e) => updateMiniButtonDestination(e.target.value)}
                        className="mr-3 text-orange-600"
                      />
                      <span className="text-orange-700">{t('accessories')} Page</span>
                    </label>
                  </div>
                  
                  {/* Preview Info */}
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <h5 className="font-bold text-orange-700 mb-1">{t('livePreview')}</h5>
                    <p className="text-orange-600 text-sm">
                      <strong>{t('currentSetting')}:</strong> {t('miniButtonWillLinkTo')} <strong>{miniButtonDestination}</strong> {t('page')}.
                      {t('changesApplyInstantly')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 📝 ABOUT PAGE CONTENT MANAGEMENT */}
            {pageSlug === 'about' && pageSlug !== 'global' && (
              <div className="bg-gradient-to-r from-teal-100 to-blue-100 border-4 border-teal-400 rounded-xl p-6 mb-8 shadow-xl">
                <h3 className="text-3xl font-bold text-teal-800 mb-6 text-center">📝 ABOUT PAGE CONTENT MANAGEMENT</h3>
                
                {/* Main Content Section */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white p-6 rounded-lg border-2 border-teal-300 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-xl text-teal-700 flex items-center">
                        📝 <span className="ml-2">Main Content</span>
                      </h4>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aboutSections.mainContent.enabled}
                          onChange={(e) => setAboutSections(prev => ({
                            ...prev,
                            mainContent: { ...prev.mainContent, enabled: e.target.checked }
                          }))}
                          className="mr-2 text-teal-600"
                        />
                        <span className="text-teal-700 text-sm">Show Section</span>
                      </label>
                    </div>
                    {aboutSections.mainContent.enabled && (
                      <textarea
                        value={aboutSections.mainContent.content}
                        onChange={(e) => setAboutSections(prev => ({
                          ...prev,
                          mainContent: { ...prev.mainContent, content: e.target.value }
                        }))}
                        placeholder="Enter your main about page content here..."
                        className="w-full h-32 p-3 border-2 border-teal-300 rounded-lg resize-none focus:border-teal-500 focus:outline-none"
                      />
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-teal-300 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-xl text-teal-700 flex items-center">
                        🖼️ <span className="ml-2">Main Image</span>
                      </h4>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aboutSections.mainImage.enabled}
                          onChange={(e) => setAboutSections(prev => ({
                            ...prev,
                            mainImage: { ...prev.mainImage, enabled: e.target.checked }
                          }))}
                          className="mr-2 text-teal-600"
                        />
                        <span className="text-teal-700 text-sm">Show Section</span>
                      </label>
                    </div>
                    {aboutSections.mainImage.enabled && (
                      <div className="border-2 border-dashed border-teal-300 rounded-lg p-4 text-center">
                        <p className="text-teal-600">Image upload functionality coming soon...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Secondary Content Section */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-lg border-2 border-teal-300 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-xl text-teal-700 flex items-center">
                        📝 <span className="ml-2">Secondary Content</span>
                      </h4>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aboutSections.secondaryContent.enabled}
                          onChange={(e) => setAboutSections(prev => ({
                            ...prev,
                            secondaryContent: { ...prev.secondaryContent, enabled: e.target.checked }
                          }))}
                          className="mr-2 text-teal-600"
                        />
                        <span className="text-teal-700 text-sm">Show Section</span>
                      </label>
                    </div>
                    {aboutSections.secondaryContent.enabled && (
                      <textarea
                        value={aboutSections.secondaryContent.content}
                        onChange={(e) => setAboutSections(prev => ({
                          ...prev,
                          secondaryContent: { ...prev.secondaryContent, content: e.target.value }
                        }))}
                        placeholder="Enter your secondary about page content here..."
                        className="w-full h-32 p-3 border-2 border-teal-300 rounded-lg resize-none focus:border-teal-500 focus:outline-none"
                      />
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-lg border-2 border-teal-300 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-xl text-teal-700 flex items-center">
                        🖼️ <span className="ml-2">Secondary Image</span>
                      </h4>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aboutSections.secondaryImage.enabled}
                          onChange={(e) => setAboutSections(prev => ({
                            ...prev,
                            secondaryImage: { ...prev.secondaryImage, enabled: e.target.checked }
                          }))}
                          className="mr-2 text-teal-600"
                        />
                        <span className="text-teal-700 text-sm">Show Section</span>
                      </label>
                    </div>
                    {aboutSections.secondaryImage.enabled && (
                      <div className="border-2 border-dashed border-teal-300 rounded-lg p-4 text-center">
                        <p className="text-teal-600">Image upload functionality coming soon...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 📋 BACKGROUND SYSTEM INFO */}
            {pageSlug !== 'global' && (
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 border-4 border-indigo-400 rounded-xl p-6 mb-8 shadow-xl">
              <h3 className="text-3xl font-bold text-indigo-800 mb-6 text-center">📋 BACKGROUND SYSTEM INFO</h3>
              <div className="bg-white p-6 rounded-lg border-2 border-indigo-300 shadow-lg">
                <h4 className="font-bold text-xl text-indigo-700 mb-4 flex items-center">
                  🎨 <span className="ml-2">Background Priority System</span>
                </h4>
                <div className="space-y-3 text-indigo-700">
                  <p><strong>Priority Order:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li><strong>Page-specific background</strong> - Uploaded for each page (e.g., /about background)</li>
                    <li><strong>Global background</strong> - Site-wide background (if no page-specific exists)</li>
                    <li><strong>Fallback gradient</strong> - Default pastel gradient (if no images exist)</li>
                  </ol>
                  <p className="mt-4 text-sm text-indigo-600">
                    💡 <strong>Tip:</strong> Upload a background image for any page using the "Asset Upload" section below. 
                    Page-specific backgrounds will override global backgrounds automatically.
                  </p>
                  
                  {/* Current Background Preview */}
                  <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h5 className="font-semibold text-indigo-700 mb-3">Current Background Preview</h5>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-indigo-600 mb-2">
                          <strong>Page-specific:</strong> {pageAssets.find(a => a.slot === 'background')?.imageUrl ? '✅ Uploaded' : '❌ Not set'}
                        </p>
                        {pageAssets.find(a => a.slot === 'background')?.imageUrl && (
                          <img 
                            src={pageAssets.find(a => a.slot === 'background').imageUrl} 
                            alt="Page background preview"
                            className="w-full h-24 object-cover rounded border-2 border-indigo-300"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-indigo-600 mb-2">
                          <strong>Global:</strong> {globalAssets.find(a => a.slot === 'sitewide-background')?.imageUrl ? '✅ Uploaded' : '❌ Not set'}
                        </p>
                        {globalAssets.find(a => a.slot === 'sitewide-background')?.imageUrl ? (
                          <div>
                            <img 
                              src={globalAssets.find(a => a.slot === 'sitewide-background').imageUrl} 
                              alt="Global background preview"
                              className="w-full h-24 object-cover rounded border-2 border-indigo-300 mb-3"
                            />
                            <div className="space-y-3">
                              {/* Upload new global background */}
                              <div>
                                <label className="block text-sm font-medium text-indigo-700 mb-2">
                                  Change Global Background
                                </label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFile('sitewide-background', e)}
                                  className="w-full text-sm text-indigo-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                                <p className="text-xs text-indigo-500 mt-1">
                                  Recommended: 1920×1080px
                                </p>
                              </div>
                              
                              {/* Action buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => remove.mutate({ pageSlug: 'global', slot: 'sitewide-background' })}
                                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                                  title="Remove global background"
                                >
                                  Remove Global
                                </button>
                                <a
                                  href={globalAssets.find(a => a.slot === 'sitewide-background').imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                                  title="View full-size image"
                                >
                                  View Full Size
                                </a>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 text-center">
                            <p className="text-indigo-600 text-sm mb-3">No global background set</p>
                            <div className="space-y-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFile('sitewide-background', e)}
                                className="w-full text-sm text-indigo-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                              />
                              <p className="text-xs text-indigo-500">
                                Recommended: 1920×1080px
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* 📸 ASSET UPLOAD SECTION */}
            {pageSlug !== 'global' && (
              <div className="bg-gradient-to-r from-green-100 to-blue-100 border-4 border-green-400 rounded-xl p-6 mb-8 shadow-xl">
              <h3 className="text-3xl font-bold text-green-800 mb-6 text-center">📸 ASSET UPLOAD</h3>
              
              {/* Image Size Reference */}
              <div className="bg-white p-6 rounded-lg border-2 border-green-300 shadow-lg mb-6">
                <h4 className="font-bold text-xl text-green-700 mb-4 flex items-center">
                  📋 <span className="ml-2">{t('imageSizeReference')}</span>
                </h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold text-green-600 mb-2">{t('pageBackgrounds')}</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• {t('backgroundDescription')}: 1920×1080px</li>
                      <li>• {t('saveAsWebP')}</li>
                      <li>• {t('applyOverlay')}</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold text-green-600 mb-2">{t('contentImages')}</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• {t('heroImages')}: 1920×600px</li>
                      <li>• {t('infoSections')}: 800×600px</li>
                      <li>• {t('miniHighSlot')}: 800×200px</li>
                      <li>• {t('useHighQuality')}</li>
                      <li>• {t('keepFileSizes')}</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Asset Upload Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getSlotsForPage(pageSlug).map((slot) => {
                  const asset = assets.find(a => a.slot === slot);
                  const dimension = slotDimensions[slot];
                  
                  return (
                    <div key={slot} className="bg-white p-6 rounded-lg border-2 border-green-300 shadow-lg">
                      <h4 className="font-bold text-lg text-green-700 mb-4 flex items-center">
                        📸 <span className="ml-2">{slot.toUpperCase()}</span>
                      </h4>
                      
                      {asset?.imageUrl ? (
                        <div className="mb-4">
                          <img
                            src={asset.imageUrl}
                            alt={`${slot} asset`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-green-200"
                          />
                                                     <div className="mt-2 flex gap-2">
                             <button
                               onClick={() => remove.mutate({ pageSlug: slot === 'sitewide-background' ? 'global' : pageSlug, slot })}
                               className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                               title="Delete this background image"
                             >
                               {t('delete')}
                             </button>
                             <a
                               href={asset.imageUrl}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                               title="View full-size image"
                             >
                               {t('viewLivePage')}
                             </a>
                             {slot === 'background' && (
                               <button
                                 onClick={() => {
                                   // Reset to fallback by deleting the asset
                                   remove.mutate({ pageSlug, slot });
                                 }}
                                 className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors"
                                 title="Reset to fallback background"
                               >
                                 Reset to Fallback
                               </button>
                             )}
                           </div>
                        </div>
                      ) : (
                        <div className="mb-4 border-2 border-dashed border-green-300 rounded-lg p-4 text-center">
                          <p className="text-green-600 text-sm">{t('no_asset')}</p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-green-700">
                          {t('uploadImage')}
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFile(slot, e)}
                          className="w-full text-sm text-green-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                        {dimension && (
                          <p className="text-xs text-gray-500">
                            {t('recommendedSize')}: {dimension.recommended}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PagesAdmin; 