import React, { useState, useEffect } from 'react';
import ProductImageUpload from './ProductImageUpload';
import { HOMEPAGE_SLOTS, VISIBILITIES } from '../../../utils/config';

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

  // When editing, ensure image is string and imageFile is null, and placement is properly set
  useEffect(() => {
    if (editingProduct) {
      console.log('ProductForm: editingProduct.image', editingProduct.image);
      console.log('ProductForm: editingProduct.placement', editingProduct.placement);
      setForm((prevForm) => ({
        ...prevForm,
        image: editingProduct.image || '',
        imageFile: null,
        placement: editingProduct.placement || [],
      }));
    }
    // eslint-disable-next-line
  }, [editingProduct]);

  // Ensure defaults exist in form state
  const visibilityValue = form.visibility ?? 'visible';
  
  // Initialize placement if not present
  useEffect(() => {
    if (!form.placement) {
      setForm(prev => ({ ...prev, placement: [] }));
    }
  }, [form.placement, setForm]);

  // Predefined placement options for each page
  const PLACEMENT_OPTIONS = {
    home: [
      'featuredTop',
      'featuredBottom', 
      'categoryClothing',
      'categoryAccessories',
      'newArrivals',
      'trending',
      'specialOffer'
    ],
    products: [
      'featured',
      'newArrivals',
      'trending',
      'bestSellers',
      'onSale'
    ],
    'clothing-accessories': [
      'featured',
      'newArrivals',
      'trending',
      'bestSellers',
      'onSale'
    ],
    accessories: [
      'featured',
      'newArrivals', 
      'trending',
      'bestSellers',
      'onSale'
    ]
  };

  const addPlacement = () => {
    setForm(prev => ({
      ...prev,
      placement: [...prev.placement, { page: '', slot: '' }]
    }));
  };

  const updatePlacement = (index, key, value) => {
    setForm(prev => {
      const newPlacement = [...prev.placement];
      newPlacement[index][key] = value;
      return { ...prev, placement: newPlacement };
    });
  };

  const removePlacement = (index) => {
    setForm(prev => {
      const newPlacement = prev.placement.filter((_, i) => i !== index);
      return { ...prev, placement: newPlacement };
    });
  };

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
      
              {/* Page Placements */}
        <div>
          <label className="block mb-2 font-medium">Page Placements</label>
          <button
            type="button"
            onClick={addPlacement}
            className="text-blue-600 hover:text-blue-800 text-sm mb-2"
          >
            + Add Placement
          </button>
          
          {form.placement && form.placement.length > 0 ? (
            form.placement.map((placement, index) => (
              <div key={index} className="flex gap-2 mb-2 items-center">
                <select
                  name={`placement-${index}-page`}
                  value={placement.page || ''}
                  onChange={(e) => updatePlacement(index, 'page', e.target.value)}
                  className="border p-2 rounded flex-1"
                >
                  <option value="">Select Page</option>
                  <option value="home">Home</option>
                  <option value="products">Products</option>
                  <option value="clothing-accessories">Clothing & Accessories</option>
                  <option value="accessories">Accessories</option>
                </select>
                
                <select
                  name={`placement-${index}-slot`}
                  value={placement.slot || ''}
                  onChange={(e) => updatePlacement(index, 'slot', e.target.value)}
                  className="border p-2 rounded flex-1"
                  disabled={!placement.page}
                >
                  <option value="">Select Slot</option>
                  {placement.page && PLACEMENT_OPTIONS[placement.page] && 
                    PLACEMENT_OPTIONS[placement.page].map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))
                  }
                </select>
                
                <button
                  type="button"
                  onClick={() => removePlacement(index)}
                  className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm italic">No placements added. Click "+ Add Placement" to assign this product to specific pages.</p>
          )}
        </div>



      {/* Visibility Selector */}
      <div>
        <label className="block mb-1 font-medium">Visibility</label>
        <select
          name="visibility"
          value={visibilityValue}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        >
          {VISIBILITIES.map(vis => (
            <option key={vis} value={vis}>
              {vis}
            </option>
          ))}
        </select>
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