import React from 'react';
import api from '../../../api/config';

// ProductImageUpload.jsx - Handles image upload and preview for product forms
// Props:
//   image: image file name or path
//   uploading: boolean for upload state
//   imageError: error message for image upload
//   onImageUpload: handler for image file input
const ProductImageUpload = ({ image, uploading, imageError, onImageUpload }) => {
  // Helper to get the correct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    // Remove any leading slashes and use direct backend URL without /api
    const cleanPath = imagePath.replace(/^\/+/, '');
    return `http://localhost:5000/uploads/${cleanPath}`;
  };

  const imageUrl = getImageUrl(image);

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        name="image"
        onChange={onImageUpload}
        className="border p-2 rounded w-full"
      />
      {uploading && <div className="text-blue-600 mt-2">Uploading...</div>}
      {imageUrl ? (
        <div className="mt-2">
          <img
            src={imageUrl}
            alt="Preview"
            className="h-20 rounded"
            onError={(e) => {
              console.error('Image load error:', e);
              e.target.src = '/placeholder.png';
              e.target.onerror = null;
            }}
          />
        </div>
      ) : (
        <div className="mt-2 text-gray-400">No image</div>
      )}
      {imageError && <div className="text-red-600 mt-2">{imageError}</div>}
    </div>
  );
};

export default ProductImageUpload; 