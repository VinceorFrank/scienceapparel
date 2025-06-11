import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// Example token (replace this with real token later)
const ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NDA1YzU4MzdiOWMwYTA2NzNiOWY3MCIsImlhdCI6MTc0OTY2MDU4MywiZXhwIjoxNzQ5NzQ2OTgzfQ.XCk1oO9Kq8A_t8IE5hjXzKdpMQtxzeAoP6ku8aTerSs";

export const fetchProductStats = async () => {
  const res = await axios.get(`${API_BASE}/products/stats`, {
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    },
  });
  return res.data;
};
