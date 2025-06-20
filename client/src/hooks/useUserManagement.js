import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getAdminUsers, updateUserRole } from '../api/users';

const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all'); // 'all', 'admin', 'customer'
  const pageSize = 10;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize, search, role: role === 'all' ? '' : role };
      const response = await getAdminUsers(params);
      setUsers(response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      toast.error('Failed to fetch users.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, role, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      toast.success("User role updated successfully!");
      fetchUsers(); // Refresh the list
    } catch (err) {
      toast.error('Failed to update user role.');
    }
  };

  return {
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
  };
};

export default useUserManagement; 