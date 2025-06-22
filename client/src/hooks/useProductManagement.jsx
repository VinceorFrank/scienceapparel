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
      // Define the fields that are allowed to be sent to the backend
      const allowedFields = ['name', 'description', 'price', 'stock', 'category', 'image', 'featured', 'tags'];
      
      const cleanedData = {};
      
      // Copy only allowed fields from productData to cleanedData
      for (const field of allowedFields) {
        if (productData[field] !== undefined && productData[field] !== null) {
          cleanedData[field] = productData[field];
        }
      }

      // Ensure price and stock are numbers
      if (cleanedData.price) {
        cleanedData.price = parseFloat(cleanedData.price);
      }
      if (cleanedData.stock) {
        cleanedData.stock = parseInt(cleanedData.stock, 10);
      }

      // If category is an object, only send its ID
      if (cleanedData.category && typeof cleanedData.category === 'object') {
        cleanedData.category = cleanedData.category._id;
      }

      if (editingProduct) {
        await updateProduct(editingProduct._id, cleanedData);
        toast.success('Product updated successfully!');
      } else {
        await addProduct(cleanedData);
        toast.success('Product created successfully!');
      }
      fetchProducts();
      handleCloseModal();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save product.';
      const errorDetails = error.response?.data?.error;

      if (errorDetails) {
        // If there are validation errors, format and display them
        const formattedErrors = Object.entries(errorDetails.errors)
          .map(([field, error]) => `${field}: ${error.message}`)
          .join('\n');
        toast.error(<div><p>{errorMessage}</p><pre className="text-sm mt-2 whitespace-pre-wrap">{formattedErrors}</pre></div>, { autoClose: 10000 });
      } else {
        toast.error(`Error: ${errorMessage}`);
      }
      console.error("Save product error:", error.response || error);
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