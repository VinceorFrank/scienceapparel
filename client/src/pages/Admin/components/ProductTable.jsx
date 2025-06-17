import React from 'react';

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
                      src={`http://localhost:5000/uploads/${product.image}`}
                      alt={product.name ? `Product image for ${product.name}` : 'Product image'}
                      className="h-12 w-12 object-cover rounded"
                    />
                  ) : (
                    <span className="text-gray-400">No image</span>
                  )}
                </td>
                <td className="p-2">{product.name}</td>
                <td className="p-2">
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
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </>
  );
};

export default ProductTable; 