import React, { useState, useEffect } from "react";
import { getProducts, addProduct, updateProduct, deleteProduct } from "../../api/products";
import axios from "axios";

const categories = ["All", "Apparel", "Accessories", "Stationery"];

// Add a simple error boundary wrapper for the main content
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <h2>Something went wrong. Please reload the page.</h2>;
    }
    return this.props.children;
  }
}

const ProductsAdmin = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: categories[1], price: '', stock: '', image: '' });
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, name: '', category: '', price: '', stock: '', image: '' });
  const [editImage, setEditImage] = useState('');
  const [editUploading, setEditUploading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const pageSize = 4;
  const [importResults, setImportResults] = useState(null);
  const [importing, setImporting] = useState(false);
  const [imageError, setImageError] = useState('');

  // Fetch products from backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        // You can pass filters/search/page as params if your backend supports it
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        setError("Failed to load products.");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Filter and search logic (client-side for now)
  const filtered = products.filter((p) => {
    const matchesCategory = category === "All" || (p.category || '').toLowerCase() === category.toLowerCase();
    const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    setImageError('');
    try {
      const res = await fetch('http://localhost:5000/api/upload?type=image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Image upload failed');
      }
      setImage(data.path);
      setForm((prev) => ({ ...prev, image: data.path }));
    } catch (err) {
      setImageError(err.message || 'Image upload failed');
      alert(err.message || 'Image upload failed');
    }
    setUploading(false);
  };

  // Handle add product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const newProduct = await addProduct(form);
      setProducts([newProduct, ...products]);
      setShowModal(false);
      setForm({ name: '', description: '', category: categories[1], price: '', stock: '', image: '' });
      setImage('');
      setPage(1);
    } catch (err) {
      setError("Failed to add product.");
    }
    setLoading(false);
  };

  // Edit modal logic
  const openEditModal = (product) => {
    setEditForm({ ...product });
    setEditImage(product.image || '');
    setEditModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const updated = await updateProduct(editForm.id, editForm);
      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      setEditModal(false);
    } catch (err) {
      setError("Failed to update product.");
    }
    setLoading(false);
  };

  const handleEditImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setEditUploading(true);
    try {
      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setEditImage(data.path);
      setEditForm((prev) => ({ ...prev, image: data.path }));
    } catch (err) {
      alert('Image upload failed');
    }
    setEditUploading(false);
  };

  // Delete dialog logic
  const openDeleteDialog = (product) => {
    setProductToDelete(product);
    setDeleteDialog(true);
  };

  const handleDeleteProduct = async () => {
    setLoading(true);
    setError("");
    try {
      await deleteProduct(productToDelete._id);
      setProducts((prev) => prev.filter((p) => p._id !== productToDelete._id));
      setDeleteDialog(false);
      setProductToDelete(null);
    } catch (err) {
      setError("Failed to delete product. Please try again or check your connection.");
    }
    setLoading(false);
  };

  // Handle export products
  const handleExport = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products/export', {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Failed to export products.");
    }
  };

  // Handle import products
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setImporting(true);
    setError("");

    try {
      const response = await axios.post('http://localhost:5000/api/products/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setImportResults(response.data.results);
      
      // Refresh products list
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError("Failed to import products.");
    }

    setImporting(false);
    e.target.value = null; // Reset file input
  };

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">📦 Products Management</h1>
          <div className="flex gap-2">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={handleExport}
            >
              Export CSV
            </button>
            <label className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer">
              Import CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => setShowModal(true)}
            >
              + Add Product
            </button>
          </div>
        </div>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border p-2 rounded"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        {loading && <div className="text-blue-600 mb-4">Loading...</div>}
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {importResults && (
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Import Results:</h3>
            <p>Successfully imported: {importResults.success} products</p>
            <p>Failed to import: {importResults.failed} products</p>
            {importResults.errors.length > 0 && (
              <div className="mt-2">
                <h4 className="font-semibold">Errors:</h4>
                <ul className="list-disc list-inside">
                  {importResults.errors.map((error, index) => (
                    <li key={index} className="text-red-600">
                      Row: {error.row} - {error.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {importing && (
          <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded">
            Importing products...
          </div>
        )}
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
            {paginated.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No products found.</td></tr>
            ) : (
              paginated.map((product) => (
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
                  <td className="p-2">{product.category}</td>
                  <td className="p-2">${product.price}</td>
                  <td className="p-2">{product.stock}</td>
                  <td className="p-2">
                    <button
                      className="text-blue-600 hover:underline mr-2"
                      onClick={() => openEditModal(product)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => openDeleteDialog(product)}
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Add Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add Product</h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    className="border p-2 rounded w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    className="border p-2 rounded w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    className="border p-2 rounded w-full"
                    required
                  >
                    {categories.filter((cat) => cat !== "All").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleFormChange}
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
                    onChange={handleFormChange}
                    className="border p-2 rounded w-full"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    name="image"
                    onChange={handleImageUpload}
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
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setForm({ name: '', description: '', category: categories[1], price: '', stock: '', image: '' }); setImage(''); }}
                    className="px-4 py-2 bg-gray-200 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    disabled={!form.name || !form.description || !form.price || !form.stock || !form.category}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {editModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit Product</h2>
              <form onSubmit={handleEditProduct} className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditFormChange}
                    className="border p-2 rounded w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Category</label>
                  <select
                    name="category"
                    value={editForm.category}
                    onChange={handleEditFormChange}
                    className="border p-2 rounded w-full"
                    required
                  >
                    {categories.filter((cat) => cat !== "All").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={editForm.price}
                    onChange={handleEditFormChange}
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
                    value={editForm.stock}
                    onChange={handleEditFormChange}
                    className="border p-2 rounded w-full"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageUpload}
                    className="border p-2 rounded w-full"
                  />
                  {editUploading && <div className="text-blue-600 mt-2">Uploading...</div>}
                  {editImage && (
                    <div className="mt-2">
                      <img src={editImage} alt="Preview" className="h-20 rounded" />
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditModal(false)}
                    className="px-4 py-2 bg-gray-200 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Product Dialog */}
        {deleteDialog && productToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4 text-red-600">Delete Product</h2>
              <p className="mb-6">Are you sure you want to delete <span className="font-semibold">{productToDelete.name}</span>?</p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteDialog(false)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ProductsAdmin;
