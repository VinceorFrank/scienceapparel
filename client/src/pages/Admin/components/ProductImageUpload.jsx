import React from 'react';

// ProductImageUpload.jsx - Handles image upload and preview for product forms
// Props:
//   image: image file name or path
//   uploading: boolean for upload state
//   imageError: error message for image upload
//   onImageUpload: handler for image file input
const ProductImageUpload = ({ image, uploading, imageError, onImageUpload }) => {
  // Helper to get the correct image URL
  let imageUrl = '';
  if (image) {
    if (image.startsWith('http')) {
      imageUrl = image;
    } else if (image.startsWith('/')) {
      imageUrl = `http://localhost:5000/uploads${image}`;
    } else {
      imageUrl = `http://localhost:5000/uploads/${image}`;
    }
  }
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