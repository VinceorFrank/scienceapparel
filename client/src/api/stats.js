import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export const fetchProductStats = async () => {
  const token = localStorage.getItem("token");

  const res = await axios.get(`${API_BASE}/products/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};
