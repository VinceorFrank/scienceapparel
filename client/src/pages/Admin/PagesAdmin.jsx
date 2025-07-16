import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertPageAsset, deletePageAsset } from '../../api/pageAssets';
import PastelCard from '../../components/PastelCard';
import { useLang } from '../../utils/lang';

const slots = ['hero', 'infoA', 'infoB', 'background'];
const pages = ['home', 'about', 'cart', 'order-detail'];

const PagesAdminNew = () => {
  const { t } = useLang();
  const qc = useQueryClient();
  const [pageSlug, setPageSlug] = useState('home');
  const [showPreview, setShowPreview] = useState(true);

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

      {/* Page Preview */}
      {showPreview && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Page Preview: {pageSlug}</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-100 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Hero Section</h4>
              <p className="text-lg font-bold">Sample Title</p>
              <p className="text-sm text-gray-600">Sample subtitle text</p>
              <p className="text-xs text-gray-500 mt-2">No hero image set</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Page Background</h4>
              <p className="text-sm">Sample Content</p>
              <p className="text-xs text-gray-600">This is how content will appear over the background</p>
              <p className="text-xs text-gray-500 mt-2">No background image set</p>
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
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
        {slots.map(slot => {
          const asset = assets.find(a => a.slot === slot);
          return (
            <PastelCard key={slot} className="relative p-6">
              <h2 className="text-lg font-semibold mb-4 capitalize">{slot}</h2>
              
              {/* Dimension info for each card */}
              <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-3 mb-4">
                <h4 className="font-bold text-blue-800 mb-2 text-sm">📏 Recommended Size:</h4>
                {slot === 'hero' && (
                  <p className="text-blue-700 text-sm">1920 × 600 px (16:5 ratio)</p>
                )}
                {slot === 'background' && (
                  <p className="text-blue-700 text-sm">1920 × 1080 px (16:9 ratio)</p>
                )}
                {(slot === 'infoA' || slot === 'infoB') && (
                  <p className="text-blue-700 text-sm">800 × 600 px (4:3 ratio)</p>
                )}
              </div>

              {asset ? (
                <>
                  <img
                    src={asset.imageUrl}
                    alt={asset.alt}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                  <p className="text-sm text-gray-600 mb-2">Overlay: {asset.overlay}</p>
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

export default PagesAdminNew; 