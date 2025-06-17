import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export const getCategories = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_BASE}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const addCategory = async (category) => {
  const token = localStorage.getItem("token");
  const res = await axios.post(`${API_BASE}/categories`, category, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateCategory = async (id, category) => {
  const token = localStorage.getItem("token");
  const res = await axios.put(`${API_BASE}/categories/${id}`, category, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteCategory = async (id) => {
  const token = localStorage.getItem("token");
  const res = await axios.delete(`${API_BASE}/categories/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}; 