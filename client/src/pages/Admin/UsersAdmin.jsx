import React, { useEffect, useState } from "react";
import axios from "axios";
const API_BASE = "http://localhost:5000/api";

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "product_manager", label: "Product Manager" },
  { value: "order_manager", label: "Order Manager" },
  { value: "support_agent", label: "Support Agent" },
  { value: "customer", label: "Customer" },
];

const UsersAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      setError("Failed to load users.");
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${API_BASE}/users/${userId}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      setError("Failed to update user role.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6">👥 Users Management</h1>
      {loading && <div className="text-blue-600 mb-4">Loading...</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <table className="w-full border mt-2">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr><td colSpan={3} className="p-4 text-center text-gray-500">No users found.</td></tr>
          ) : (
            users.map((user) => (
              <tr key={user._id} className="border-b">
                <td className="p-2">{user.name}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">
                  <select
                    value={user.role || "customer"}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    className="border p-1 rounded"
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UsersAdmin;
