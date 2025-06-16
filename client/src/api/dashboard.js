import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// Get all dashboard metrics
export const fetchDashboardMetrics = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_BASE}/admin/dashboard/metrics`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

// Get sales metrics
export const fetchSalesMetrics = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_BASE}/admin/dashboard/sales`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

// Get recent orders
export const fetchRecentOrders = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_BASE}/admin/dashboard/recent-orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

// Get stock alerts
export const fetchStockAlerts = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_BASE}/admin/dashboard/stock-alerts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

// Get customer activity
export const fetchCustomerActivity = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_BASE}/admin/dashboard/customer-activity`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
}; 