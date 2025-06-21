import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getAdminProducts, addProduct, updateProduct, deleteProduct } from '../api/products';
import { getCategories } from '../api/categories';
import { uploadImage } from '../api/upload';

export const useProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image: '',
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        search,
        category,
      };
      const response = await getAdminProducts(params);
      setProducts(response.data || []);
      setTotalProducts(response.total || 0);
    } catch (error) {
      toast.error('Failed to fetch products.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch categories.');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      image: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setProductForm({
      ...product,
      category: product.category?._id,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSave = async (productData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct._id, productData);
        toast.success('Product updated successfully!');
      } else {
        await addProduct(productData);
        toast.success('Product created successfully!');
      }
      fetchProducts();
      handleCloseModal();
    } catch (error) {
      toast.error(`Error: ${error.response?.data?.message || 'Failed to save product.'}`);
    }
  };

  const handleDeleteConfirm = (product) => {
    setProductToDelete(product);
    setIsDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false);
    setProductToDelete(null);
  };

  const handleDelete = async () => {
    if (productToDelete) {
      try {
        await deleteProduct(productToDelete._id);
        toast.success('Product deleted successfully!');
        fetchProducts();
        handleCloseDeleteConfirm();
      } catch (error) {
        toast.error('Failed to delete product.');
      }
    }
  };

  return {
    products,
    categories,
    loading,
    page,
    pageSize,
    totalProducts,
    search,
    category,
    isModalOpen,
    editingProduct,
    isDeleteConfirmOpen,
    productToDelete,
    setPage,
    setPageSize,
    setSearch,
    setCategory,
    handleCreate,
    handleEdit,
    handleCloseModal,
    handleSave,
    handleDeleteConfirm,
    handleCloseDeleteConfirm,
    handleDelete,
    productForm,
    setProductForm,
  };
}; 