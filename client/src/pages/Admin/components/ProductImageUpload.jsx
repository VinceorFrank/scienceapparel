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
        className={`relative w-full p-4 border-2 border-dashed rounded-lg text-center cursor-pointer
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="relative w-full h-48">
            <img 
              src={preview} 
              alt="Product Preview" 
              className="w-full h-full object-contain rounded-lg"
              onLoad={() => console.log('[ProductImageUpload] Preview image loaded successfully')}
              onError={(e) => console.error('[ProductImageUpload] Preview image failed to load:', e)}
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 leading-none text-xs font-bold shadow-lg"
              aria-label="Remove image"
            >
              &times;
            </button>
          </div>
        ) : (
          isDragActive ? (
            <p>Drop the image here ...</p>
          ) : (
            <p>Drag 'n' drop an image here, or click to select one</p>
          )
        )}
      </div>
    </div>
  );
};

export default ProductImageUpload; 