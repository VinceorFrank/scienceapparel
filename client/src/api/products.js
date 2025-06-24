import api from './config';

const API_BASE = "http://localhost:5000/api";

// Get all products (with optional filters, pagination)
export const getProducts = async (params = {}) => {
  try {
    const res = await api.get('/products', { params });
    return res.data;
  } catch (err) {
    console.error('Failed to fetch products:', err.response ? err.response.data : err.message);
    throw err;
  }
};

// Add a new product
export const addProduct = async (product) => {
  try {
    const res = await api.post('/products', product);
    return res.data;
  } catch (err) {
    console.error('Failed to add product:', err.response ? err.response.data : err.message);
    throw err;
  }
};

// Update a product
export const updateProduct = async (id, product) => {
  try {
    const res = await api.put(`/products/${id}`, product);
    return res.data;
  } catch (err) {
    console.error('Failed to update product:', err.response ? err.response.data : err.message);
    throw err;
  }
};

// Delete a product
export const deleteProduct = async (id) => {
  try {
    console.log('[products API] deleteProduct called with ID:', id);
    console.log('[products API] Making DELETE request to:', `/products/${id}`);
    
    const res = await api.delete(`/products/${id}`);
    console.log('[products API] DELETE response status:', res.status);
    console.log('[products API] DELETE response data:', res.data);
    
    return res.data;
  } catch (err) {
    console.error('[products API] deleteProduct ERROR:', err);
    console.error('[products API] Error response:', err.response);
    console.error('[products API] Error status:', err.response?.status);
    console.error('[products API] Error data:', err.response?.data);
    console.error('[products API] Error message:', err.message);
    throw err;
  }
};

export async function fetchProducts() {
  try {
    const res = await api.get('/products');
    return res.data;
  } catch (err) {
    console.error('Failed to fetch products:', err.response ? err.response.data : err.message);
    throw new Error("Erreur lors du chargement des produits");
  }
}

export const getProductById = async (id) => {
  try {
    const res = await api.get(`/products/${id}`);
    return res.data;
  } catch (err) {
    console.error('Failed to fetch product:', err.response ? err.response.data : err.message);
    throw err;
  }
};

export const getAdminProducts = async (params = {}) => {
  try {
    const res = await api.get('/products/admin', { params });
    return res.data;
  } catch (err) {
    console.error('Failed to fetch admin products:', err.response ? err.response.data : err.message);
    throw err;
  }
}; 