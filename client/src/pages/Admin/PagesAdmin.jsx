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
  }
  return [];
};
const pages = ['home', 'about', 'account', 'cart', 'shipping', 'admin'];

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

  // Site-wide background control
  const [siteBackground, setSiteBackground] = useState('beige');
  const [customBackgroundColor, setCustomBackgroundColor] = useState('#fafaf0');

  // Background options
  const backgroundOptions = [
    { value: 'beige', label: 'Beige Gradient (Default)', gradient: 'linear-gradient(135deg, #fefefe 0%, #fafaf0 25%, #fdfcf7 50%, #fefdfa 75%, #fffef8 100%)' },
    { value: 'white', label: 'Pure White', gradient: 'white' },
    { value: 'light-gray', label: 'Light Gray', gradient: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 50%, #f5f5f5 100%)' },
    { value: 'blue', label: 'Light Blue', gradient: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 50%, #f0f8ff 100%)' },
    { value: 'green', label: 'Light Green', gradient: 'linear-gradient(135deg, #f0fff0 0%, #e6ffe6 50%, #f0fff0 100%)' },
    { value: 'custom', label: 'Custom Color', gradient: 'custom' }
  ];

  // Apply background to body
  useEffect(() => {
    const body = document.body;
    const selectedOption = backgroundOptions.find(option => option.value === siteBackground);
    
    if (selectedOption) {
      if (selectedOption.value === 'custom') {
        body.style.background = customBackgroundColor;
      } else {
        body.style.background = selectedOption.gradient;
      }
      body.style.backgroundAttachment = 'fixed';
    }
  }, [siteBackground, customBackgroundColor]);

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pageAssets', pageSlug] }),
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
            {/* 🎛️ BLOCK VISIBILITY CONTROLS */}
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

            {/* 🎛️ BLOCK ORDERING CONTROLS */}
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

            {/* 🎛️ BUTTON SETTINGS CONTROLS */}
            {hasButtonSettings(pageSlug, 'hero') && toggles.heroEnabled !== false && (
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
            {pageSlug === 'about' && (
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

            {/* 🌍 SITE-WIDE BACKGROUND CONTROL */}
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 border-4 border-indigo-400 rounded-xl p-6 mb-8 shadow-xl">
              <h3 className="text-3xl font-bold text-indigo-800 mb-6 text-center">🌍 SITE-WIDE BACKGROUND CONTROL</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg border-2 border-indigo-300 shadow-lg">
                  <h4 className="font-bold text-xl text-indigo-700 mb-4 flex items-center">
                    🎨 <span className="ml-2">Background Style</span>
                  </h4>
                  <div className="space-y-3">
                    {backgroundOptions.map((option) => (
                      <label key={option.value} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="siteBackground"
                          value={option.value}
                          checked={siteBackground === option.value}
                          onChange={(e) => setSiteBackground(e.target.value)}
                          className="mr-3 text-indigo-600"
                        />
                        <span className="text-indigo-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {siteBackground === 'custom' && (
                  <div className="bg-white p-6 rounded-lg border-2 border-indigo-300 shadow-lg">
                    <h4 className="font-bold text-xl text-indigo-700 mb-4 flex items-center">
                      🎨 <span className="ml-2">Custom Color</span>
                    </h4>
                    <input
                      type="color"
                      value={customBackgroundColor}
                      onChange={(e) => setCustomBackgroundColor(e.target.value)}
                      className="w-full h-12 border-2 border-indigo-300 rounded-lg cursor-pointer"
                    />
                    <p className="text-sm text-indigo-600 mt-2">
                      Current color: {customBackgroundColor}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 📸 ASSET UPLOAD SECTION */}
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
                            >
                              {t('delete')}
                            </button>
                            <a
                              href={asset.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                            >
                              {t('viewLivePage')}
                            </a>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default PagesAdmin; 