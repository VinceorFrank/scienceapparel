import React from 'react';
import api from '../../../api/config';

// Define the server's base URL for images, without the /api part.
const SERVER_BASE_URL = 'http://localhost:5000';

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
    console.log('[ProductTable] getImageUrl called with:', imagePath);
    console.log('[ProductTable] imagePath type:', typeof imagePath);
    
    if (!imagePath) {
      console.log('[ProductTable] No imagePath provided, using placeholder');
      return '/placeholder.png'; // Use a local placeholder
    }
    
    // If it's already a full URL, use it as is
    if (imagePath.startsWith('http')) {
      console.log('[ProductTable] Full URL detected, using as is:', imagePath);
      return imagePath;
    }
    
    // Prepend the correct server base URL if the path is relative
    if (imagePath.startsWith('/uploads')) {
      const fullUrl = `${SERVER_BASE_URL}${imagePath}`;
      console.log('[ProductTable] Relative uploads path, constructed URL:', fullUrl);
      return fullUrl;
    }
    
    // If it's just a filename, construct the full path
    if (!imagePath.includes('/')) {
      const fullUrl = `${SERVER_BASE_URL}/uploads/images/${imagePath}`;
      console.log('[ProductTable] Filename only, constructed URL:', fullUrl);
      return fullUrl;
    }
    
    // Fallback
    console.log('[ProductTable] Fallback case, using as is:', imagePath);
    return imagePath;
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
                      onLoad={(e) => {
                        console.log('[ProductTable] Image loaded successfully for product:', product.name, 'URL:', e.target.src);
                      }}
                      onError={(e) => {
                        console.error('[ProductTable] Image load error for product:', product.name, 'URL:', e.target.src);
                        console.error('[ProductTable] Error details:', e);
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
                  {/* ✅ Directly use the populated category name */}
                  {product.category?.name || '-'}
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
                    onClick={() => {
                      console.log('[ProductTable] Delete button clicked for product:', product);
                      console.log('[ProductTable] Product ID:', product._id);
                      console.log('[ProductTable] Product name:', product.name);
                      onDelete(product);
                    }}
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