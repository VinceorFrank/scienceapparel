import React from 'react';
import useUserManagement from '../../hooks/useUserManagement';

const roleOptions = [
  { value: "all", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "customer", label: "Customer" },
  // Add other roles if they exist in your system
];

const UsersAdmin = () => {
  const {
    users,
    loading,
    page,
    totalPages,
    search,
    setSearch,
    role,
    setRole,
    setPage,
    handleUpdateRole,
  } = useUserManagement();

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Users Management</h1>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded-md"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="p-2 border rounded-md"
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Role</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="3" className="text-center p-4">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="3" className="text-center p-4">No users found.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="border-b">
                  <td className="p-2">{user.name}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">
                    <select
                      value={user.role || "customer"}
                      onChange={(e) => handleUpdateRole(user._id, e.target.value)}
                      className="p-1 border rounded-md"
                    >
                      {roleOptions.slice(1).map((opt) => ( // Exclude 'All Roles'
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

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
        <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50">Previous</button>
        <span className="px-3 py-1">Page {page} of {totalPages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50">Next</button>
      </div>
    </div>
  );
};

export default UsersAdmin;
