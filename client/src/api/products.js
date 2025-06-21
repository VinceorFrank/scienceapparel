import axios from "axios";
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
  const token = localStorage.getItem("token");
  const res = await axios.post(`${API_BASE}/products`, product, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Update a product
export const updateProduct = async (id, product) => {
  const token = localStorage.getItem("token");
  const res = await axios.put(`${API_BASE}/products/${id}`, product, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Delete a product
export const deleteProduct = async (id) => {
  const token = localStorage.getItem("token");
  const res = await axios.delete(`${API_BASE}/products/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export async function fetchProducts() {
  const res = await fetch(import.meta.env.VITE_API_URL + "/products");
  if (!res.ok) throw new Error("Erreur lors du chargement des produits");
  return res.json();
}

export const getProductById = async (id) => {
  try {
    const res = await axios.get(`${API_BASE}/products/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
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