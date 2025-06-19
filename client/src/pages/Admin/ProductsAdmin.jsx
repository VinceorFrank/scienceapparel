import React, { useState, useEffect } from "react";
import { getProducts, addProduct, updateProduct, deleteProduct } from "../../api/products";
import { getCategories } from "../../api/categories";
import axios from "axios";
import ProductTable from './components/ProductTable';
import ProductForm from './components/ProductForm';
import Modal from './components/Modal';

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

// ProductsAdmin.jsx - Admin page for managing products
// Uses modular components: ProductTable, ProductForm, ProductImageUpload
// Handles product CRUD, image upload, import/export, and filtering
const ProductsAdmin = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: '', price: '', stock: '', image: '' });
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
  const [categories, setCategories] = useState([]);

  // Fetch products from backend on mount
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

  // Fetch categories from backend on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchCategories();
  }, []);

  // Filter and search logic (client-side)
  const safeProducts = Array.isArray(products) ? products : [];
  const filtered = safeProducts.filter((p) => {
    const matchesCategory = category === "All" || String(p.category) === category;
    const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Form input change handler
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Image upload handler
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

  // Add product handler
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const newProduct = await addProduct(form);
      setProducts([newProduct, ...products]);
      setShowModal(false);
      setForm({ name: '', description: '', category: '', price: '', stock: '', image: '' });
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

  // Edit form input change handler
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Edit product handler
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

  // Edit image upload handler
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

  // Delete product handler
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

  // Export products as CSV
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

  // Import products from CSV
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

  if (!categories) return <div>Loading categories...</div>;

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
            <option value="All">All</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
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
        {categories.length === 0 && !loading && (
          <div className="text-red-600 mb-4">No categories found. Please add a category first.</div>
        )}
        {/* Product Table and Pagination */}
        <ProductTable
          products={paginated}
          categories={categories}
          page={page}
          totalPages={totalPages}
          onEdit={openEditModal}
          onDelete={openDeleteDialog}
          onPageChange={setPage}
        />

        {/* Add Product Modal */}
        <Modal
          open={showModal}
          onClose={() => { setShowModal(false); setForm({ name: '', description: '', category: '', price: '', stock: '', image: '' }); setImage(''); }}
          title="Add Product"
        >
          <ProductForm
            form={form}
            categories={categories}
            image={image}
            uploading={uploading}
            imageError={imageError}
            onChange={handleFormChange}
            onImageUpload={handleImageUpload}
            onSubmit={handleAddProduct}
            onCancel={() => { setShowModal(false); setForm({ name: '', description: '', category: '', price: '', stock: '', image: '' }); setImage(''); }}
            mode="add"
          />
        </Modal>

        {/* Edit Product Modal */}
        <Modal
          open={editModal}
          onClose={() => setEditModal(false)}
          title="Edit Product"
        >
          <ProductForm
            form={editForm}
            categories={categories}
            image={editImage}
            uploading={editUploading}
            imageError={imageError}
            onChange={handleEditFormChange}
            onImageUpload={handleEditImageUpload}
            onSubmit={handleEditProduct}
            onCancel={() => setEditModal(false)}
            mode="edit"
          />
        </Modal>

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
