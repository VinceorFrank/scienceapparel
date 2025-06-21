import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export const getActivityLogs = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_BASE}/admin/dashboard/activity-logs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}; 