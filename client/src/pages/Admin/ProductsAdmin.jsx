import React from 'react';
import { useProductManagement } from '../../hooks/useProductManagement';
import ProductTable from './components/ProductTable';
import ProductForm from './components/ProductForm';
import Modal from './components/Modal';

const ProductsAdmin = () => {
  const {
    products,
    loading,
    page,
    totalProducts,
    pageSize,
    setPageSize,
    setPage,
    setSearch,
    search,
    isModalOpen,
    editingProduct,
    handleCreate,
    handleEdit,
    handleDeleteConfirm,
    handleCloseModal,
    handleSave,
    setCategory,
    categories,
    category,
    productForm,
    setProductForm,
  } = useProductManagement();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Products Management</h1>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search products..."
            className="border p-2 rounded-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border p-2 rounded-md"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + Add Product
        </button>
      </div>

      <ProductTable
        products={products}
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDeleteConfirm}
        loading={loading}
      />

      <div className="mt-4 flex justify-between items-center">
        <div>
          <span className="mr-2">Items per page:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border p-2 rounded-md"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 border rounded-md"
          >
            Previous
          </button>
          <span>Page {page} of {Math.ceil(totalProducts / pageSize)}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page * pageSize >= totalProducts}
            className="px-3 py-1 border rounded-md"
          >
            Next
          </button>
        </div>
      </div>

      {isModalOpen && (
        <Modal onClose={handleCloseModal}>
          <ProductForm
            product={editingProduct}
            form={productForm}
            setForm={setProductForm}
            onSave={handleSave}
            onCancel={handleCloseModal}
            categories={categories}
          />
        </Modal>
      )}
    </div>
  );
};

export default ProductsAdmin;
