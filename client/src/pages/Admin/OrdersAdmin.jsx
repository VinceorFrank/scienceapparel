import React from 'react';
import useOrderManagement from '../../hooks/useOrderManagement';

const OrdersAdmin = () => {
  const {
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
  } = useOrderManagement();

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Orders Management</h1>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by ID or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded-md"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="shipped">Shipped</option>
            <option value="pending">Pending Shipment</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Order ID</th>
              <th className="p-2 text-left">Customer</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Total</th>
              <th className="p-2 text-left">Payment Status</th>
              <th className="p-2 text-left">Shipping Status</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center p-4">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="7" className="text-center p-4">No orders found.</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id} className="border-b">
                  <td className="p-2 font-mono text-sm">{order._id}</td>
                  <td className="p-2">{order.user?.name || 'N/A'} ({order.user?.email || 'N/A'})</td>
                  <td className="p-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-2">${order.totalPrice.toFixed(2)}</td>
                  <td className="p-2">{order.isPaid ? 'Paid' : 'Not Paid'}</td>
                  <td className="p-2">{order.isShipped ? 'Shipped' : 'Pending'}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleUpdateStatus(order._id, { isShipped: !order.isShipped })}
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Toggle Shipped
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next</button>
      </div>
    </div>
  );
};

export default OrdersAdmin;
