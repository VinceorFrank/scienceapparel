import React, { useState, useEffect } from 'react';
import { uploadImage } from '../../../api/upload';

// ProductImageUpload.jsx - Handles image upload and preview for product forms
// Props:
//   image: image file name or path
//   uploading: boolean for upload state
//   imageError: error message for image upload
//   onImageUpload: handler for image file input
const ProductImageUpload = ({ image: initialImage, onImageUpload }) => {
  const [preview, setPreview] = useState('/placeholder.png');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // This effect runs when the initial image path from the product data changes
    if (typeof initialImage === 'string' && initialImage) {
      setPreview(`http://localhost:5000/uploads/images/${initialImage}`);
    } else {
      // It could be null or undefined when creating a new product
      setPreview('/placeholder.png');
    }
  }, [initialImage]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Basic Validation
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    setError(null);

    // 2. Create a local URL for instant preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // 3. Start the upload process
    setUploading(true);
    try {
      const response = await uploadImage(file);
      // 4. On success, notify the parent component of the new server path
      onImageUpload(response.path);
    } catch (err) {
      setError(err.message || 'Image upload failed.');
      // Revert preview if upload fails
      setPreview(initialImage ? `http://localhost:5000/uploads/images/${initialImage}` : '/placeholder.png');
    } finally {
      setUploading(false);
      // 5. Clean up the local object URL to prevent memory leaks
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  };

  return (
    <div>
      <div className="w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center mb-2 overflow-hidden bg-gray-50">
        <img src={preview} alt="Product Preview" className="h-full w-auto object-contain" />
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {uploading && <p className="text-sm text-blue-500 mt-2">Uploading...</p>}
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default ProductImageUpload; 