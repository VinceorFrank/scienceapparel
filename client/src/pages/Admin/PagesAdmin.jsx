import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertPageAsset, deletePageAsset } from '../../api/pageAssets';
import PastelCard from '../../components/PastelCard';
import { useLang } from '../../utils/lang';
import { useHeroToggle } from '../../hooks/useHeroToggle';

const slots = ['hero', 'infoA', 'infoB', 'background', 'mini'];
const pages = ['home', 'about', 'cart', 'order-detail'];

// Slot dimensions configuration
const slotDimensions = {
  hero: {
    recommended: '1920×600px',
    aspectRatio: '16:5',
    description: 'Main banner image at the top of the page'
  },
  infoA: {
    recommended: '800×600px',
    aspectRatio: '4:3',
    description: 'First informational section image'
  },
  infoB: {
    recommended: '800×600px',
    aspectRatio: '4:3',
    description: 'Second informational section image'
  },
  background: {
    recommended: '1920×1080px',
    aspectRatio: '16:9',
    description: 'Main background image for the page'
  },
  mini: {
    recommended: '800×200px',
    min: '600×150px',
    max: '1200×300px',
    aspectRatio: '4:1',
    description: 'Mini-high slot for narrow banners'
  }
};

const PagesAdmin = () => {
  const { t } = useLang();
  const qc = useQueryClient();
  const [pageSlug, setPageSlug] = useState('home');
  const [showPreview, setShowPreview] = useState(true);
  const [heroEnabled, toggleHero] = useHeroToggle(pageSlug);

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['pageAssets', pageSlug],
    queryFn: async () => {
      const response = await fetch(`/api/pages/${pageSlug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch page assets');
      }
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    },
    keepPreviousData: true,
  });

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
    fd.append('pageSlug', pageSlug);
    fd.append('slot', slot);
    upsert.mutate(fd);
  };

  if (isLoading) return <div className="p-6"><p>Loading…</p></div>;
  if (error) return <div className="p-6"><p>Error: {error.message}</p></div>;

  const assets = Array.isArray(data) ? data : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('pages_admin.title', 'Page Assets')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => window.open(`/${pageSlug}`, '_blank')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            View Live Page
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['pageAssets', pageSlug] })}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Refresh Assets
          </button>
          <button
            onClick={() => toggleHero(!heroEnabled)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              heroEnabled 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {heroEnabled ? 'Hide Hero' : 'Show Hero'}
          </button>
        </div>
      </div>

      {/* 📋 IMAGE SIZE REFERENCE - RIGHT BELOW HEADER */}
      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-4 border-yellow-400 rounded-xl p-6 mb-8 shadow-xl">
        <h3 className="text-3xl font-bold text-yellow-800 mb-6 text-center">📋 IMAGE SIZE REFERENCE GUIDE</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border-2 border-yellow-300 shadow-lg">
            <h4 className="font-bold text-xl text-yellow-700 mb-4 flex items-center">
              🌅 <span className="ml-2">Page Backgrounds</span>
            </h4>
            <ul className="text-lg text-yellow-600 space-y-3">
              <li className="flex items-start">
                <span className="font-bold mr-2">•</span>
                <span><strong>Most pages:</strong> 1920 × 1080 px (16:9 ratio)</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">•</span>
                <span><strong>About/Cart/Order Detail:</strong> 1920 × 1200 px (16:10 ratio)</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">•</span>
                <span>Save as WebP/JPG/PNG, compress under 500 KB</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">•</span>
                <span>Apply 10-30% pastel overlay for text readability</span>
              </li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg border-2 border-yellow-300 shadow-lg">
            <h4 className="font-bold text-xl text-yellow-700 mb-4 flex items-center">
              📸 <span className="ml-2">Content Images</span>
            </h4>
            <ul className="text-lg text-yellow-600 space-y-3">
              <li className="flex items-start">
                <span className="font-bold mr-2">•</span>
                <span><strong>Hero images:</strong> 1920 × 600 px (16:5 ratio)</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">•</span>
                <span><strong>Info sections:</strong> 800 × 600 px (4:3 ratio)</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">•</span>
                <span><strong>Mini-high slot:</strong> 800 × 200 px (4:1 ratio)</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">•</span>
                <span>Use high-quality images with good contrast</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">•</span>
                <span>Keep file sizes under 300 KB for fast loading</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 📖 ASSET TYPE EXPLANATIONS */}
      <div className="bg-gradient-to-r from-blue-100 to-purple-100 border-4 border-blue-400 rounded-xl p-6 mb-8 shadow-xl">
        <h3 className="text-3xl font-bold text-blue-800 mb-6 text-center">📖 WHAT ARE THESE ASSET TYPES?</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border-2 border-blue-300 shadow-lg">
            <h4 className="font-bold text-xl text-blue-700 mb-4 flex items-center">
              🎯 <span className="ml-2">Hero</span>
            </h4>
            <p className="text-blue-600 mb-3">
              <strong>Purpose:</strong> The main banner image at the top of the page
            </p>
            <ul className="text-blue-600 space-y-2 text-sm">
              <li>• <strong>Homepage:</strong> Eye-catching welcome banner</li>
              <li>• <strong>About page:</strong> Company/team showcase</li>
              <li>• <strong>Product pages:</strong> Featured product display</li>
              <li>• <strong>Cart/Orders:</strong> Brand reinforcement</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg border-2 border-blue-300 shadow-lg">
            <h4 className="font-bold text-xl text-blue-700 mb-4 flex items-center">
              ℹ️ <span className="ml-2">InfoA</span>
            </h4>
            <p className="text-blue-600 mb-3">
              <strong>Purpose:</strong> First informational section image
            </p>
            <ul className="text-blue-600 space-y-2 text-sm">
              <li>• <strong>Homepage:</strong> Featured category/product</li>
              <li>• <strong>About page:</strong> Company values/mission</li>
              <li>• <strong>Product pages:</strong> Product benefits/features</li>
              <li>• <strong>Support pages:</strong> Help topics/services</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg border-2 border-blue-300 shadow-lg">
            <h4 className="font-bold text-xl text-blue-700 mb-4 flex items-center">
              📋 <span className="ml-2">InfoB</span>
            </h4>
            <p className="text-blue-600 mb-3">
              <strong>Purpose:</strong> Second informational section image
            </p>
            <ul className="text-blue-600 space-y-2 text-sm">
              <li>• <strong>Homepage:</strong> Additional features/services</li>
              <li>• <strong>About page:</strong> Team/office photos</li>
              <li>• <strong>Product pages:</strong> Usage examples/demos</li>
              <li>• <strong>Support pages:</strong> Additional help resources</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg border-2 border-blue-300 shadow-lg">
            <h4 className="font-bold text-xl text-blue-700 mb-4 flex items-center">
              🖼️ <span className="ml-2">Mini</span>
            </h4>
            <p className="text-blue-600 mb-3">
              <strong>Purpose:</strong> Narrow banner for in-page callouts
            </p>
            <ul className="text-blue-600 space-y-2 text-sm">
              <li>• <strong>Recommended:</strong> 800 × 200 px (4:1 ratio)</li>
              <li>• Use for slim promotional strips</li>
              <li>• Perfect for announcements</li>
              <li>• Great for featured content</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 bg-white p-4 rounded-lg border-2 border-blue-300">
          <h4 className="font-bold text-lg text-blue-700 mb-2">🎨 Background</h4>
          <p className="text-blue-600">
            <strong>Purpose:</strong> The main background image that appears behind all content on the page. 
            This creates the visual atmosphere and branding for each page. Use subtle, non-distracting images 
            that complement your content and maintain good text readability.
          </p>
        </div>
      </div>

      {/* Page Preview */}
      {showPreview && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Page Preview: {pageSlug}</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Hero Section Preview */}
            <div className="relative h-48 rounded-lg overflow-hidden">
              {(() => {
                const heroAsset = assets.find(a => a.slot === 'hero');
                return (
                  <>
                    {heroAsset?.imageUrl ? (
                      <div 
                        className="w-full h-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${heroAsset.imageUrl})`,
                        }}
                      >
                        <div 
                          className="absolute inset-0"
                          style={{ backgroundColor: `rgba(255,255,255,${heroAsset.overlay ?? 0.2})` }}
                        />
                        <div className="relative z-10 p-4 text-center">
                          <h4 className="font-semibold mb-2 text-gray-800">Hero Section</h4>
                          <p className="text-lg font-bold text-gray-900">Sample Title</p>
                          <p className="text-sm text-gray-700">Sample subtitle text</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-100 p-4 flex flex-col justify-center items-center">
                        <h4 className="font-semibold mb-2">Hero Section</h4>
                        <p className="text-lg font-bold">Sample Title</p>
                        <p className="text-sm text-gray-600">Sample subtitle text</p>
                        <p className="text-xs text-gray-500 mt-2">No hero image set</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Background Preview */}
            <div className="relative h-48 rounded-lg overflow-hidden">
              {(() => {
                const bgAsset = assets.find(a => a.slot === 'background');
                return (
                  <>
                    {bgAsset?.imageUrl ? (
                      <div 
                        className="w-full h-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${bgAsset.imageUrl})`,
                        }}
                      >
                        <div 
                          className="absolute inset-0"
                          style={{ backgroundColor: `rgba(255,255,255,${bgAsset.overlay ?? 0.2})` }}
                        />
                        <div className="relative z-10 p-4">
                          <h4 className="font-semibold mb-2 text-gray-800">Page Background</h4>
                          <p className="text-sm text-gray-900">Sample Content</p>
                          <p className="text-xs text-gray-700">This is how content will appear over the background</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-100 p-4 flex flex-col justify-center">
                        <h4 className="font-semibold mb-2">Page Background</h4>
                        <p className="text-sm">Sample Content</p>
                        <p className="text-xs text-gray-600">This is how content will appear over the background</p>
                        <p className="text-xs text-gray-500 mt-2">No background image set</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Info Sections Preview */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            {/* InfoA Preview */}
            <div className="relative h-32 rounded-lg overflow-hidden">
              {(() => {
                const infoAAsset = assets.find(a => a.slot === 'infoA');
                return (
                  <>
                    {infoAAsset?.imageUrl ? (
                      <div 
                        className="w-full h-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${infoAAsset.imageUrl})`,
                        }}
                      >
                        <div 
                          className="absolute inset-0"
                          style={{ backgroundColor: `rgba(255,255,255,${infoAAsset.overlay ?? 0.2})` }}
                        />
                        <div className="relative z-10 p-3">
                          <h4 className="font-semibold text-sm text-gray-800">InfoA Section</h4>
                          <p className="text-xs text-gray-700">Sample content</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-100 p-3 flex flex-col justify-center">
                        <h4 className="font-semibold text-sm">InfoA Section</h4>
                        <p className="text-xs text-gray-500">No image set</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* InfoB Preview */}
            <div className="relative h-32 rounded-lg overflow-hidden">
              {(() => {
                const infoBAsset = assets.find(a => a.slot === 'infoB');
                return (
                  <>
                    {infoBAsset?.imageUrl ? (
                      <div 
                        className="w-full h-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${infoBAsset.imageUrl})`,
                        }}
                      >
                        <div 
                          className="absolute inset-0"
                          style={{ backgroundColor: `rgba(255,255,255,${infoBAsset.overlay ?? 0.2})` }}
                        />
                        <div className="relative z-10 p-3">
                          <h4 className="font-semibold text-sm text-gray-800">InfoB Section</h4>
                          <p className="text-xs text-gray-700">Sample content</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-100 p-3 flex flex-col justify-center">
                        <h4 className="font-semibold text-sm">InfoB Section</h4>
                        <p className="text-xs text-gray-500">No image set</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Mini Section Preview */}
          <div className="mt-6">
            <div className="relative h-24 rounded-lg overflow-hidden">
              {(() => {
                const miniAsset = assets.find(a => a.slot === 'mini');
                console.log('[DEBUG] rendering mini preview asset:', miniAsset);
                return (
                  <>
                    {miniAsset?.imageUrl ? (
                      <div 
                        className="w-full h-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${miniAsset.imageUrl})`,
                        }}
                      >
                        <div 
                          className="absolute inset-0"
                          style={{ backgroundColor: `rgba(255,255,255,${miniAsset.overlay ?? 0.2})` }}
                        />
                        <div className="relative z-10 p-3">
                          <h4 className="font-semibold text-sm text-gray-800">Mini Section</h4>
                          <p className="text-xs text-gray-700">Promotional banner</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-100 p-3 flex flex-col justify-center">
                        <h4 className="font-semibold text-sm">Mini Section</h4>
                        <p className="text-xs text-gray-500">No image set</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Page selector */}
      <select
        value={pageSlug}
        onChange={e => setPageSlug(e.target.value)}
        className="border p-2 rounded mb-6"
      >
        {pages.map(p => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {/* Asset cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-6">
        {slots.map(slot => {
          const asset = assets.find(a => a.slot === slot);
          const dimensions = slotDimensions[slot];
          return (
            <PastelCard key={slot} className="relative p-6">
              <h2 className="text-lg font-semibold mb-4 capitalize">{slot}</h2>
              
              {/* Dimension info for each card */}
              <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-3 mb-4">
                <h4 className="font-bold text-blue-800 mb-2 text-sm">📏 Recommended Size:</h4>
                <p className="text-blue-700 text-sm">{dimensions.recommended} ({dimensions.aspectRatio} ratio)</p>
                {dimensions.min && (
                  <p className="text-blue-600 text-xs mt-1">Min: {dimensions.min} • Max: {dimensions.max}</p>
                )}
              </div>

              {asset ? (
                <>
                  <img
                    src={asset.imageUrl}
                    alt={asset.alt}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                  
                  {/* Overlay Control */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Overlay Opacity: {asset.overlay ?? 0.2}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={asset.overlay ?? 0.2}
                      onChange={(e) => {
                        const fd = new FormData();
                        fd.append('pageSlug', pageSlug);
                        fd.append('slot', slot);
                        fd.append('overlay', e.target.value);
                        upsert.mutate(fd);
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => remove.mutate(asset._id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    {t('delete', 'Delete')}
                  </button>
                </>
              ) : (
                <p className="text-sm italic text-gray-500 mb-3">{t('no_asset', 'No image yet')}</p>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={e => handleFile(slot, e)}
                className="mt-3 w-full text-sm"
              />
            </PastelCard>
          );
        })}
      </div>
    </div>
  );
};

export default PagesAdmin; 