import React, { useState, useEffect } from 'react';
import ProductImageUpload from './ProductImageUpload';

const SERVER_BASE_URL = 'http://localhost:5000';

// ProductForm.jsx - Handles add/edit product form logic and validation
// Props:
//   form: current form state
//   setForm: function to update form state
//   categories: array of category objects for dropdown
//   onSave: handler for form submission
//   onCancel: handler for cancel button
//   editingProduct: boolean for edit mode
const ProductForm = ({
  form,
  setForm,
  categories,
  onSave,
  onCancel,
  editingProduct,
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleImageUpload = (fileOrPath) => {
    if (fileOrPath instanceof File) {
      console.log('ProductForm: handleImageUpload received File', fileOrPath);
      setForm((prevForm) => ({
        ...prevForm,
        imageFile: fileOrPath, // Store the File object
        image: '', // Clear image string until upload
      }));
    } else if (typeof fileOrPath === 'string') {
      console.log('ProductForm: handleImageUpload received string', fileOrPath);
      setForm((prevForm) => ({
        ...prevForm,
        image: fileOrPath, // Set image string path
        imageFile: null,   // Clear File object
      }));
    } else {
      setForm((prevForm) => ({
        ...prevForm,
        image: '',
        imageFile: null,
      }));
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (typeof imagePath === 'object' && imagePath instanceof File) {
      // If it's a File object, show a preview using URL.createObjectURL
      return URL.createObjectURL(imagePath);
    }
    if (typeof imagePath === 'string') {
      if (imagePath.startsWith('/uploads')) {
        return `${SERVER_BASE_URL}${imagePath}`;
      }
      return imagePath;
    }
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert price and stock to numbers before saving
    const dataToSave = {
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
    };
    onSave(dataToSave);
  };

  // When editing, ensure image is string and imageFile is null
  useEffect(() => {
    if (editingProduct) {
      console.log('ProductForm: editingProduct.image', editingProduct.image);
      setForm((prevForm) => ({
        ...prevForm,
        image: editingProduct.image || '',
        imageFile: null,
      }));
    }
    // eslint-disable-next-line
  }, [editingProduct]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
      <div>
        <label className="block mb-1 font-medium">Name</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Category</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Price</label>
        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          min="0"
          step="0.01"
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Stock</label>
        <input
          type="number"
          name="stock"
          value={form.stock}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          min="0"
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Image</label>
        {/* Admins: For best results, upload a square image (e.g., 800x800px) with the product filling the frame and no extra whitespace. */}
        <div className="text-xs text-blue-500 mb-2">For best results, upload a <b>square image</b> (e.g., 800x800px) with the product filling the frame and no extra whitespace or padding.</div>
        <ProductImageUpload
          initialImageUrl={getImageUrl(form.image)}
          onImageChange={handleImageUpload}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {editingProduct ? 'Save Changes' : 'Create Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm; 