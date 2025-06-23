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
      tags: [],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setProductForm({
      ...product,
      category: product.category?._id,
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
        uploadData.append('image', productData.imageFile);
        
        // Debug: log FormData contents
        console.log('[useProductManagement] FormData contents:');
        for (let pair of uploadData.entries()) {
          console.log('[useProductManagement] FormData entry:', pair[0], pair[1]);
        }
        
        console.log('[useProductManagement] Calling uploadImage...');
        const response = await uploadImage(uploadData);
        console.log('[useProductManagement] uploadImage response:', response);
        
        if (!response || !response.filePath) {
          throw new Error(`Upload failed: ${JSON.stringify(response)}`);
        }
        
        imageUrl = response.filePath;
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
        image: imageUrl,
        featured: productData.featured || false,
        tags: [], // Always an array
      };
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
      if (!cleanedData.image || typeof cleanedData.image !== 'string') throw new Error('Missing/invalid image');
      
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
      
    } catch (error) {
      console.error('[useProductManagement] handleSave ERROR:', error);
      console.error('[useProductManagement] Error response:', error.response);
      console.error('[useProductManagement] Error message:', error.message);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save product.';
      const errorDetails = error.response?.data?.error;
      
      if (errorDetails) {
        // If there are validation errors, format and display them
        const formattedErrors = Object.entries(errorDetails.errors || {})
          .map(([field, error]) => `${field}: ${error.message}`)
          .join('\n');
        toast.error(<div><p>{errorMessage}</p><pre className="text-sm mt-2 whitespace-pre-wrap">{formattedErrors}</pre></div>, { autoClose: 10000 });
      } else {
        toast.error(`Error: ${errorMessage}`);
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