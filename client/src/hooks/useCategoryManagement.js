import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../api/categories';

const useCategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 10;

  // Modal and form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  // Delete confirmation state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize, search };
      const response = await getCategories(params);
      setCategories(response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      toast.error('Failed to fetch categories.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, pageSize]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Modal and form handlers
  const handleOpenModal = (category = null) => {
    setIsEditMode(!!category);
    if (category) {
      setCurrentCategory(category);
      setCategoryForm(category);
    } else {
      setCategoryForm({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentCategory(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await updateCategory(currentCategory._id, categoryForm);
        toast.success('Category updated successfully!');
      } else {
        await addCategory(categoryForm);
        toast.success('Category created successfully!');
      }
      fetchCategories();
      handleCloseModal();
    } catch (err) {
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} category.`);
    }
  };

  // Delete confirmation handlers
  const handleOpenDeleteConfirm = (category) => {
    setCategoryToDelete(category);
    setIsDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false);
    setCategoryToDelete(null);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete._id);
      toast.success('Category deleted successfully!');
      fetchCategories();
      handleCloseDeleteConfirm();
    } catch (err) {
      toast.error('Failed to delete category.');
    }
  };

  return {
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
    categoryToDelete,
    handleOpenModal,
    handleCloseModal,
    handleFormChange,
    handleSubmit,
    handleOpenDeleteConfirm,
    handleCloseDeleteConfirm,
    handleDelete,
  };
};

export default useCategoryManagement; 