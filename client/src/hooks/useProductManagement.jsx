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
    tags: [],
  });
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
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
    } catch (err) {
      console.error('Product fetch failed:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        stack: err.stack
      });
      
      setError('Failed to load products. Please try again.');
      
      // Provide specific error messages based on status codes
      if (err.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (err.response?.status === 403) {
        toast.error('Access denied. You do not have permission to view products.');
      } else if (err.response?.status === 404) {
        toast.error('Products not found. Please check your connection.');
      } else if (err.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to load products. Please check your connection and try again.');
      }
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
      placement: [],
      visibility: 'visible',
      tags: [],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setProductForm({
      ...product,
      category: product.category?._id,
      placement: product.placement || [],
      visibility: product.visibility || 'visible',
      tags: product.tags || [],
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSave = async (productData) => {
    try {
      console.log('[useProductManagement] handleSave called with productData:', productData);
      console.log('[useProductManagement] imageFile type:', typeof productData.imageFile);
      console.log('[useProductManagement] imageFile instanceof File:', productData.imageFile instanceof File);
      
      let imageUrl = productData.image;
      console.log('[useProductManagement] Initial imageUrl:', imageUrl);

      // If imageFile is present, upload it
      if (productData.imageFile) {
        console.log('[useProductManagement] Starting image upload...');
        const uploadData = new FormData();
        uploadData.append('file', productData.imageFile);
        
        // Debug: log FormData contents
        console.log('[useProductManagement] FormData contents:');
        for (let pair of uploadData.entries()) {
          console.log('[useProductManagement] FormData entry:', pair[0], pair[1]);
        }
        
        console.log('[useProductManagement] Calling uploadImage...');
        const response = await uploadImage(uploadData);
        console.log('[useProductManagement] uploadImage response:', response);
        
        // The upload response has the structure: { success: true, data: { url: '...' } }
        if (!response || !response.data || !response.data.url) {
          throw new Error(`Upload failed: ${JSON.stringify(response)}`);
        }
        
        imageUrl = response.data.url;
        console.log('[useProductManagement] Updated imageUrl from upload:', imageUrl);
      } else {
        console.log('[useProductManagement] No imageFile provided, using existing imageUrl');
      }

      // Build a minimal payload with only allowed fields and tags as an array
      const cleanedData = {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        stock: productData.stock,
        category: productData.category,
        image: imageUrl || '', // Make image optional
        placement: Array.isArray(productData.placement) ? productData.placement : [],
        visibility: productData.visibility || 'visible',
        tags: [], // Always an array
      };
      
      console.log('[useProductManagement] productData.placement:', productData.placement);
      console.log('[useProductManagement] cleanedData.placement:', cleanedData.placement);
      // Remove fields that should not be sent in update
      delete cleanedData.reviews;
      delete cleanedData.numReviews;
      delete cleanedData.rating;
      delete cleanedData.createdAt;
      delete cleanedData.updatedAt;
      delete cleanedData.__v;
      // Log the final payload
      console.log('FINAL PAYLOAD TO BACKEND:', cleanedData);
      
      // Validate cleanedData fields
      if (!cleanedData || typeof cleanedData !== 'object') {
        throw new Error('Invalid cleanedData object');
      }
      if (!cleanedData.name || typeof cleanedData.name !== 'string') throw new Error('Missing/invalid name');
      if (cleanedData.price === undefined || isNaN(Number(cleanedData.price))) throw new Error('Missing/invalid price');
      if (cleanedData.stock === undefined || isNaN(Number(cleanedData.stock))) throw new Error('Missing/invalid stock');
      if (!cleanedData.category || typeof cleanedData.category !== 'string') throw new Error('Missing/invalid category');
      // Remove image validation - make it optional
      
      // Ensure price and stock are numbers
      cleanedData.price = parseFloat(cleanedData.price);
      cleanedData.stock = parseInt(cleanedData.stock, 10);
      
      // If category is an object, only send its ID
      if (cleanedData.category && typeof cleanedData.category === 'object') {
        cleanedData.category = cleanedData.category._id;
      }
      
      console.log('[useProductManagement] Final cleanedData to send:', cleanedData);
      
      if (editingProduct) {
        console.log('[useProductManagement] Editing existing product');
        console.log('[useProductManagement] editingProduct:', editingProduct);
        console.log('[useProductManagement] Updating ID:', editingProduct._id);
        
        if (!editingProduct._id) throw new Error('No product ID for update');
        
        console.log('[useProductManagement] Calling updateProduct...');
        const updateResponse = await updateProduct(editingProduct._id, cleanedData);
        console.log('[useProductManagement] updateProduct response:', updateResponse);
        
        toast.success('Product updated successfully!');
      } else {
        console.log('[useProductManagement] Creating new product');
        console.log('[useProductManagement] Calling addProduct...');
        const addResponse = await addProduct(cleanedData);
        console.log('[useProductManagement] addProduct response:', addResponse);
        
        toast.success('Product created successfully!');
      }
      
      console.log('[useProductManagement] Refreshing products list...');
      fetchProducts();
      handleCloseModal();
      
    } catch (err) {
      console.error('Product operation failed:', {
        operation: editingProduct ? 'update' : 'create',
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        productData: productData
      });

      // Handle validation errors
      if (err.message.includes('required') || err.message.includes('Valid')) {
        toast.error(err.message);
        return;
      }

      // Handle server errors
      if (err.response?.status === 400) {
        const errorMessage = err.response.data?.message || 'Invalid product data. Please check all fields.';
        toast.error(errorMessage);
      } else if (err.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (err.response?.status === 403) {
        toast.error('Access denied. You do not have permission to manage products.');
      } else if (err.response?.status === 409) {
        toast.error('Product already exists. Please use a different name.');
      } else if (err.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(`Failed to ${editingProduct ? 'update' : 'create'} product. Please try again.`);
      }
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
    try {
      if (!productToDelete) return;

      setLoading(true);
      setError(null);

      console.log('[useProductManagement] handleDelete called');
      console.log('[useProductManagement] Product to delete:', productToDelete);
      console.log('[useProductManagement] Product ID:', productToDelete._id);
      
      console.log('[useProductManagement] Calling deleteProduct API...');
      const response = await deleteProduct(productToDelete._id);
      console.log('[useProductManagement] deleteProduct API response:', response);
      
      // Show the specific message from the backend (archived vs deleted)
      const message = response?.message || 'Product deleted successfully!';
      toast.success(message);
      
      console.log('[useProductManagement] Refreshing products list...');
      fetchProducts();
      handleCloseDeleteConfirm();
    } catch (err) {
      console.error('Product deletion failed:', {
        productId: productToDelete?._id,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });

      // Handle specific error cases
      if (err.response?.status === 404) {
        toast.error('Product not found. It may have been already deleted.');
      } else if (err.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (err.response?.status === 403) {
        toast.error('Access denied. You do not have permission to delete products.');
      } else if (err.response?.status === 409) {
        toast.error('Cannot delete product. It may be associated with existing orders.');
      } else if (err.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to delete product. Please try again.');
      }
    } finally {
      setLoading(false);
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
    error,
  };
}; 