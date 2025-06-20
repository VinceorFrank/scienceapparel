import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getAdminOrders, updateOrderStatus } from '../api/orders';

const useOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all'); // e.g., 'all', 'paid', 'shipped'
  const pageSize = 10;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize, search, status };
      const response = await getAdminOrders(params);
      setOrders(response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      toast.error('Failed to fetch orders.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, pageSize]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated!');
      fetchOrders(); // Refresh the list
    } catch (err) {
      toast.error('Failed to update order status.');
    }
  };

  return {
    orders,
    loading,
    page,
    totalPages,
    search,
    setSearch,
    status,
    setStatus,
    setPage,
    handleUpdateStatus,
  };
};

export default useOrderManagement; 