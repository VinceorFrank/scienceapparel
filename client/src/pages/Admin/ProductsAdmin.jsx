import React, { useState } from 'react';
import { useProductManagement } from '../../hooks/useProductManagement.jsx';
import ProductTable from './components/ProductTable';
import ProductForm from './components/ProductForm';
import Modal from './components/Modal';
import ImportModal from '../../components/ImportModal';
import { exportProducts } from '../../utils/exportUtils';
import { useLang } from '../../utils/lang.jsx';

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
    isDeleteConfirmOpen,
    productToDelete,
    handleDelete,
    handleCloseDeleteConfirm,
  } = useProductManagement();

  const { t } = useLang();

  // New state for bulk operations
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minStock: '',
    maxStock: '',
    featured: '',
    archived: '',
    brand: '',
    stockLevel: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Handle export
  const handleExport = () => {
    exportProducts(products);
  };

  // Handle import
  const handleImport = async (csvData) => {
    try {
      const response = await fetch('/api/admin/csv-import/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ csvData })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Import failed');
      }

      // Refresh products list
      window.location.reload();
      
      return result;
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  };

  // Handle bulk selection
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(products.map(p => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId, checked) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedProducts.length === 0) return;

    const actions = {
      archive: () => console.log('Archive products:', selectedProducts),
      unarchive: () => console.log('Unarchive products:', selectedProducts),
      feature: () => console.log('Feature products:', selectedProducts),
      unfeature: () => console.log('Unfeature products:', selectedProducts),
      delete: () => {
        if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
          console.log('Delete products:', selectedProducts);
        }
      }
    };

    if (actions[bulkAction]) {
      await actions[bulkAction]();
      setSelectedProducts([]);
      setBulkAction('');
    }
  };

  // Handle product duplication
  const handleDuplicate = (product) => {
    const duplicatedProduct = {
      ...product,
      name: `${product.name} (Copy)`,
      _id: undefined
    };
    setProductForm(duplicatedProduct);
    handleCreate();
  };

  // Apply advanced filters
  const applyAdvancedFilters = () => {
    // This would be implemented in the useProductManagement hook
    console.log('Applying filters:', advancedFilters);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('productsManagement')}</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            {showAdvancedSearch ? t('hideAdvancedSearch') || 'Hide Advanced Search' : t('showAdvancedSearch') || 'Show Advanced Search'}
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <span>📊</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <span>��</span>
            <span>Import CSV</span>
          </button>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>{t('addProduct')}</span>
          </button>
        </div>
      </div>

      {/* Basic Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('searchProducts')}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">{t('allCategories')}</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Advanced Search */}
        {showAdvancedSearch && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">{t('advancedFilters') || 'Advanced Filters'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('priceRange') || 'Price Range'}</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder={t('min') || 'Min'}
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                    value={advancedFilters.minPrice}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, minPrice: e.target.value})}
                  />
                  <input
                    type="number"
                    placeholder={t('max') || 'Max'}
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                    value={advancedFilters.maxPrice}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, maxPrice: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('stockRange') || 'Stock Range'}</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder={t('min') || 'Min'}
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                    value={advancedFilters.minStock}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, minStock: e.target.value})}
                  />
                  <input
                    type="number"
                    placeholder={t('max') || 'Max'}
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                    value={advancedFilters.maxStock}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, maxStock: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('stockLevel') || 'Stock Level'}</label>
                <select
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                  value={advancedFilters.stockLevel}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, stockLevel: e.target.value})}
                >
                  <option value="">{t('all') || 'All'}</option>
                                  <option value="inStock">{t('inStock')}</option>
                <option value="lowStock">{t('lowStock')}</option>
                <option value="outOfStock">{t('outOfStock')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('brand') || 'Brand'}</label>
                <select
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                  value={advancedFilters.brand}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, brand: e.target.value})}
                >
                  <option value="">{t('all') || 'All'}</option>
                  {/* TODO: Map over brands array if available */}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('status') || 'Status'}</label>
                <select
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                  value={advancedFilters.status}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, status: e.target.value})}
                >
                  <option value="">{t('all') || 'All'}</option>
                                  <option value="active">{t('active')}</option>
                <option value="inactive">{t('inactive')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('dateAdded') || 'Date Added'}</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                    value={advancedFilters.dateFrom}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, dateFrom: e.target.value})}
                  />
                  <input
                    type="date"
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                    value={advancedFilters.dateTo}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, dateTo: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg" onClick={() => {/* TODO: Load saved filter */}}>
                  {t('loadFilter') || 'Load Saved Filter'}
                </button>
                <button className="px-4 py-2 bg-blue-200 text-blue-800 rounded-lg" onClick={() => {/* TODO: Save current filter */}}>
                  {t('saveFilter') || 'Save Filter'}
                </button>
              </div>
              <button
                onClick={applyAdvancedFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('applyFilters') || 'Apply Filters'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-yellow-800 font-medium">
                {selectedProducts.length} {t('products') || 'product(s)'} {t('selected') || 'selected'}
              </span>
              <select
                className="border border-yellow-300 p-2 rounded focus:ring-2 focus:ring-yellow-500"
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
              >
                <option value="">{t('selectAction') || 'Select Action'}</option>
                <option value="archive">{t('archive')}</option>
                <option value="unarchive">{t('unarchive')}</option>
                <option value="feature">{t('feature')}</option>
                <option value="unfeature">{t('unfeature')}</option>
                <option value="delete">{t('delete')}</option>
              </select>
              <button
                onClick={handleBulkAction}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                {t('apply') || 'Apply'}
              </button>
            </div>
            <button
              onClick={() => setSelectedProducts([])}
              className="text-yellow-600 hover:text-yellow-800"
            >
              {t('clearSelection') || 'Clear Selection'}
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white p-4 rounded-lg shadow">
        <ProductTable
          products={products}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeleteConfirm}
          onDuplicate={handleDuplicate}
          page={page}
          pageSize={pageSize}
          totalProducts={totalProducts}
          setPage={setPage}
          setPageSize={setPageSize}
          selectedProducts={selectedProducts}
          onSelectAll={handleSelectAll}
          onSelectProduct={handleSelectProduct}
        />
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <span className="text-gray-700">{t('itemsPerPage') || 'Items per page:'}</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-gray-600">
            {t('showing') || 'Showing'} {((page - 1) * pageSize) + 1} {t('to') || 'to'} {Math.min(page * pageSize, totalProducts)} {t('of') || 'of'} {totalProducts} {t('products') || 'products'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {t('previous') || 'Previous'}
          </button>
          <span className="px-4 py-2 text-gray-700">
            {t('page') || 'Page'} {page} {t('of') || 'of'} {Math.ceil(totalProducts / pageSize)}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page * pageSize >= totalProducts}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {t('next') || 'Next'}
          </button>
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? t('editProduct') || 'Edit Product' : t('createProduct') || 'Create Product'}
      >
        <ProductForm
          form={productForm}
          setForm={setProductForm}
          editingProduct={editingProduct}
          categories={categories}
          onSave={handleSave}
          onCancel={handleCloseModal}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <>
          {console.log('[ProductsAdmin] Delete confirmation modal is open')}
                      <Modal open={true} onClose={handleCloseDeleteConfirm} title={t('confirmDelete')}>
            <div className="p-4">
              <p className="mb-4 text-lg">{t('areYouSureDelete')} <b>{productToDelete?.name}</b>?</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCloseDeleteConfirm}
                  className="px-4 py-2 rounded-md bg-gray-200"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-md bg-red-600 text-white"
                >
                  {t('delete') || 'Delete'}
                </button>
              </div>
            </div>
          </Modal>
        </>
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        title="Import Products"
        dataType="products"
        sampleHeaders={['Name', 'Description', 'Price', 'Stock', 'SKU', 'Brand', 'Category', 'Status']}
      />
    </div>
  );
};

export default ProductsAdmin;
