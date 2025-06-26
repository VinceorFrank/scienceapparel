import React, { useState } from 'react';
import useCategoryManagement from '../../hooks/useCategoryManagement';
import { exportCategories } from '../../utils/exportUtils';
import ImportModal from '../../components/ImportModal';
import Modal from './components/Modal';
import { useLang } from '../../utils/lang.jsx';

const CategoriesAdmin = () => {
  const {
    categories,
    loading,
    page,
    totalPages,
    search,
    setSearch,
    setPage,
    isModalOpen,
    isEditMode,
    categoryForm,
    isDeleteConfirmOpen,
    handleOpenModal,
    handleCloseModal,
    handleFormChange,
    handleSubmit,
    handleOpenDeleteConfirm,
    handleCloseDeleteConfirm,
    handleDelete,
    categoryToDelete
  } = useCategoryManagement();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { t } = useLang();

  // Handle export
  const handleExport = () => {
    exportCategories(categories);
  };

  // Handle import
  const handleImport = async (csvData) => {
    try {
      const response = await fetch('/api/admin/csv-import/categories', {
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

      // Refresh categories list
      window.location.reload();
      
      return result;
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">{t('categoriesManagement')}</h1>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder={t('searchCategories')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded-md"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <span>📊</span>
            <span>{t('exportCategories')}</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <span>📥</span>
            <span>{t('importCategories')}</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            + {t('addCategory')}
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">{t('name')}</th>
              <th className="p-2 text-left">{t('description')}</th>
              <th className="p-2 text-left">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="3" className="text-center p-4">{t('loading')}</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan="3" className="text-center p-4">{t('noCategoriesFound')}</td></tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat._id} className="border-b">
                  <td className="p-2">{cat.name}</td>
                  <td className="p-2">{cat.description}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleOpenModal(cat)}
                      className="text-blue-600 hover:underline mr-2"
                    >
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => handleOpenDeleteConfirm(cat)}
                      className="text-red-600 hover:underline"
                    >
                      {t('delete')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
        <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50">Previous</button>
        <span className="px-3 py-1">Page {page} of {totalPages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50">Next</button>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <Modal onClose={handleCloseModal}>
          <form onSubmit={handleSubmit} className="p-6">
            <h2 className="text-xl font-semibold mb-4">{isEditMode ? 'Edit' : 'Add'} Category</h2>
            <div className="mb-4">
              <label className="block mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={categoryForm.name}
                onChange={handleFormChange}
                className="p-2 border rounded-md w-full"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Description</label>
              <textarea
                name="description"
                value={categoryForm.description}
                onChange={handleFormChange}
                className="p-2 border rounded-md w-full"
              />
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 rounded-md bg-gray-200">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white">
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteConfirmOpen && (
        <Modal onClose={handleCloseDeleteConfirm}>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p>Are you sure you want to delete the category "{categoryToDelete?.name}"?</p>
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

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        title={t('importCategories')}
        dataType="categories"
        sampleHeaders={['Name', 'Description', 'Slug', 'Parent Category', 'Status']}
      />
    </div>
  );
};

export default CategoriesAdmin; 