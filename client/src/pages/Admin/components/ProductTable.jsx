import React from 'react';
import api from '../../../api/config';

// ProductTable.jsx - Displays a table of products with pagination and actions
// Props:
//   products: array of product objects to display
//   categories: array of category objects for lookup
//   page: current page number
//   totalPages: total number of pages
//   onEdit: function to call when editing a product
//   onDelete: function to call when deleting a product
//   onPageChange: function to change the page
const ProductTable = ({ products, categories, page, totalPages, onEdit, onDelete, onPageChange }) => {
  // Helper to get the correct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder.png'; // Use placeholder if no image
    if (imagePath.startsWith('http')) return imagePath;
    // Handle both old format ('images/file.jpg') and new format ('file.jpg')
    const cleanPath = imagePath.startsWith('images/') ? imagePath.split('/')[1] : imagePath;
    return `http://localhost:5000/uploads/images/${cleanPath}`;
  };

  return (
    <>
      <table className="w-full border mt-2">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Image</th>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Category</th>
            <th className="p-2 text-left">Price</th>
            <th className="p-2 text-left">Stock</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr><td colSpan={6} className="p-4 text-center text-gray-500">No products found.</td></tr>
          ) : (
            products.map((product) => (
              <tr key={product._id} className="border-b">
                <td className="p-2">
                  {product.image ? (
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name ? `Product image for ${product.name}` : 'Product image'}
                      className="h-12 w-12 object-cover rounded"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error('Image load error:', e);
                        e.target.src = '/placeholder.png';
                        e.target.onerror = null;
                      }}
                    />
                  ) : (
                    <span className="text-gray-400">No image</span>
                  )}
                </td>
                <td className="p-2">{product.name}</td>
                <td className="p-2">
                  {/* Debug: show actual category value */}
                  <span style={{fontSize: '10px', color: '#888'}}>({String(product.category)})</span>
                  {categories.find((cat) => cat._id === String(product.category))?.name || "-"}
                </td>
                <td className="p-2">${product.price}</td>
                <td className="p-2">{product.stock}</td>
                <td className="p-2">
                  <button
                    className="text-blue-600 hover:underline mr-2"
                    onClick={() => onEdit(product)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => onDelete(product)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className={`px-3 py-1 rounded ${
              page === 1 ? 'bg-gray-200' : 'bg-blue-600 text-white'
            }`}
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className={`px-3 py-1 rounded ${
              page === totalPages ? 'bg-gray-200' : 'bg-blue-600 text-white'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default ProductTable; 