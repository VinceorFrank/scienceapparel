import React from 'react';

// ProductImageUpload.jsx - Handles image upload and preview for product forms
// Props:
//   image: image file name or path
//   uploading: boolean for upload state
//   imageError: error message for image upload
//   onImageUpload: handler for image file input
const ProductImageUpload = ({ image, uploading, imageError, onImageUpload }) => {
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
      {image && (
        <div className="mt-2">
          <img
            src={`http://localhost:5000/uploads/${image}`}
            alt="Preview"
            className="h-20 rounded"
          />
        </div>
      )}
      {imageError && <div className="text-red-600 mt-2">{imageError}</div>}
    </div>
  );
};

export default ProductImageUpload; 