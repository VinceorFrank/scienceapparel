import React from 'react';
import ProductImageUpload from './ProductImageUpload';

// ProductForm.jsx - Handles add/edit product form logic and validation
// Props:
//   form: product form state
//   setForm: function to update product form state
//   categories: array of category objects for dropdown
//   image: image file name or path
//   uploading: boolean for upload state
//   imageError: error message for image upload
//   onSave: handler for form submission
//   onCancel: handler for cancel button
//   product: existing product object (for edit mode)
const ProductForm = ({ form, setForm, categories, image, uploading, imageError, onSave, onCancel, product }) => {
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleImageUpload = (imagePath) => {
    setForm((prevForm) => ({
      ...prevForm,
      image: imagePath,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">{product ? 'Edit Product' : 'Add New Product'}</h2>
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
        <ProductImageUpload
          image={image}
          uploading={uploading}
          imageError={imageError}
          onImageUpload={handleImageUpload}
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
          {product ? 'Save Changes' : 'Create Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm; 