import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';

// ProductImageUpload.jsx - Handles image upload and preview for product forms
// Props:
//   onImageChange: handler for image file input
//   initialImageUrl: initial image URL
const ProductImageUpload = ({ onImageChange, initialImageUrl }) => {
  const [preview, setPreview] = useState(initialImageUrl);

  useEffect(() => {
    // Update preview if the initial URL changes (e.g., when editing a different product)
    console.log('[ProductImageUpload] useEffect - initialImageUrl changed:', initialImageUrl);
    setPreview(initialImageUrl);
  }, [initialImageUrl]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    console.log('[ProductImageUpload] onDrop called');
    console.log('[ProductImageUpload] acceptedFiles:', acceptedFiles);
    console.log('[ProductImageUpload] rejectedFiles:', rejectedFiles);
    
    if (rejectedFiles && rejectedFiles.length > 0) {
      console.error('[ProductImageUpload] File rejected:', rejectedFiles[0]);
      toast.error('Invalid file type. Please upload an image (jpeg, png, gif).');
      return;
    }

    if (acceptedFiles && acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      console.log('[ProductImageUpload] File selected:', {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        isFile: selectedFile instanceof File
      });
      
      // Create a temporary local URL for the preview
      const previewUrl = URL.createObjectURL(selectedFile);
      console.log('[ProductImageUpload] Created preview URL:', previewUrl);
      setPreview(previewUrl);
      
      // Pass the actual file object up to the parent form
      console.log('[ProductImageUpload] Calling onImageChange with File object');
      onImageChange(selectedFile);
    }
  }, [onImageChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
    },
    multiple: false,
  });

  const handleRemoveImage = (e) => {
    e.stopPropagation(); // Prevent triggering the dropzone
    console.log('[ProductImageUpload] Removing image');
    
    // Revoke the object URL to avoid memory leaks
    if (preview && preview.startsWith('blob:')) {
      console.log('[ProductImageUpload] Revoking blob URL:', preview);
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onImageChange(null); // Notify parent that image is removed
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
      <div
        {...getRootProps()}
        className="flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-blue-100 to-yellow-100 border-4 border-blue-300 rounded-2xl shadow-xl p-6 my-4 transition-all duration-200 hover:border-pink-400 hover:scale-105 cursor-pointer relative"
      >
        <input {...getInputProps()} />
        <span className="font-bold text-lg text-blue-500 mb-2" style={{ fontFamily: 'Fredoka One, cursive' }}>
          Drag & drop an image here, or click to select one
        </span>
        {/* Show preview or placeholder */}
        {preview ? (
          <img
            src={preview}
            alt="Product Preview"
            className="w-32 h-32 object-cover rounded-xl border-2 border-pink-300 shadow-md"
          />
        ) : (
          <div className="w-32 h-32 flex items-center justify-center bg-white bg-opacity-60 rounded-xl border-2 border-dashed border-blue-200">
            <span className="text-pink-400 font-bold text-2xl">+</span>
          </div>
        )}
        {/* Memphis squiggle SVG */}
        <svg className="absolute bottom-2 right-2 w-8 h-8 opacity-30" viewBox="0 0 32 32">
          <path d="M2 16 Q8 8 16 16 T30 16" stroke="#f472b6" strokeWidth="2" fill="none"/>
        </svg>
      </div>
    </div>
  );
};

export default ProductImageUpload; 