import React from 'react';
import useProductManagement from '../../hooks/useProductManagement';
import ProductTable from './components/ProductTable';
import ProductForm from './components/ProductForm';
import Modal from './components/Modal';

const ProductsAdmin = () => {
  const {
    products,
    categories,
    loading,
    error,
    page,
    totalPages,
    search,
    setSearch,
    category,
    setCategory,
    setPage,
    isModalOpen,
    isEditMode,
    productForm,
    imagePreview,
    uploading,
    isDeleteConfirmOpen,
    productToDelete,
    handleOpenModal,
    handleCloseModal,
    handleFormChange,
    handleImageUpload,
    handleSubmit,
    handleOpenDeleteConfirm,
    handleCloseDeleteConfirm,
    handleDelete,
  } = useProductManagement();

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Products Management</h1>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded-md"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + Add Product
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <ProductTable
            products={products}
            categories={categories}
            page={page}
            totalPages={totalPages}
            onEdit={handleOpenModal}
            onDelete={handleOpenDeleteConfirm}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <Modal onClose={handleCloseModal}>
          <ProductForm
            form={productForm}
            isEditMode={isEditMode}
            imagePreview={imagePreview}
            uploading={uploading}
            categories={categories}
            onChange={handleFormChange}
            onImageChange={handleImageUpload}
            onSubmit={handleSubmit}
          />
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteConfirmOpen && (
        <Modal onClose={handleCloseDeleteConfirm}>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p>Are you sure you want to delete the product "{productToDelete?.name}"?</p>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={handleCloseDeleteConfirm} className="px-4 py-2 rounded-md bg-gray-200">
                Cancel
              </button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-md bg-red-600 text-white">
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProductsAdmin;
