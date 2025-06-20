import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../api/products';
import { getCategories } from '../api/categories';
import { uploadImage } from '../api/upload';

const useProductManagement = () => {
  // State variables
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const pageSize = 10; // Or make this a parameter

  // Modal and form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', description: '', category: '', price: '', stock: '', image: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Dialog state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize, search, category: category === 'All' ? '' : category };
      const response = await getProducts(params);
      setProducts(response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      toast.error('Failed to fetch products.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, pageSize]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (err) {
      toast.error('Failed to fetch categories.');
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  // Handlers for modals and forms
  const handleOpenModal = (product = null) => {
    setIsEditMode(!!product);
    if (product) {
      setCurrentProduct(product);
      setProductForm(product);
      setImagePreview(`http://localhost:5000/uploads/images/${product.image}`);
    } else {
      setProductForm({ name: '', description: '', category: '', price: '', stock: '', image: '' });
      setImagePreview('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await uploadImage(file);
      setProductForm(prev => ({ ...prev, image: response.path }));
      setImagePreview(`http://localhost:5000/uploads/images/${response.path}`);
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error(err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await updateProduct(currentProduct._id, productForm);
        toast.success('Product updated successfully!');
      } else {
        await addProduct(productForm);
        toast.success('Product created successfully!');
      }
      fetchProducts();
      handleCloseModal();
    } catch (err) {
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} product.`);
      console.error(err);
    }
  };

  // Handlers for delete confirmation
  const handleOpenDeleteConfirm = (product) => {
    setProductToDelete(product);
    setIsDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false);
    setProductToDelete(null);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete._id);
      toast.success('Product deleted successfully!');
      fetchProducts();
      handleCloseDeleteConfirm();
    } catch (err) {
      toast.error('Failed to delete product.');
    }
  };

  return {
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
  };
};

export default useProductManagement; 