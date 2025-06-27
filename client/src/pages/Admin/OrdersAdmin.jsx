import React from 'react';
import useOrderManagement from '../../hooks/useOrderManagement';
import { exportOrders } from '../../utils/exportUtils';
import { useLang } from '../../utils/lang.jsx';
import Modal from './components/Modal.jsx';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);
import { useState } from 'react';

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
  const { t } = useLang();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Handle export
  const handleExport = () => {
    exportOrders(orders);
  };

  // Helper to get category breakdown for an order
  const getCategoryBreakdown = (order) => {
    if (!order || !order.orderItems) return [];
    const counts = {};
    order.orderItems.forEach(item => {
      let cat = item.product?.category?.name || item.category?.name || item.product?.category || item.category || 'Unknown';
      if (!cat) cat = 'Unknown';
      counts[cat] = (counts[cat] || 0) + item.qty;
    });
    return Object.entries(counts).map(([category, qty]) => ({ category, qty }));
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">{t('ordersManagement')}</h1>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder={t('searchByIdOrCustomer')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded-md"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="all">{t('allStatuses')}</option>
            <option value="paid">{t('paid')}</option>
            <option value="unpaid">{t('notPaid')}</option>
            <option value="shipped">{t('shipped')}</option>
            <option value="pending">{t('pendingShipment')}</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <span>📊</span>
            <span>Export Orders</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">{t('orderId')}</th>
              <th className="p-2 text-left">{t('customer')}</th>
              <th className="p-2 text-left">{t('date')}</th>
              <th className="p-2 text-left">{t('total')}</th>
              <th className="p-2 text-left">{t('paymentStatus')}</th>
              <th className="p-2 text-left">{t('shippingStatus')}</th>
              <th className="p-2 text-left">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center p-4">{t('loading')}</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="7" className="text-center p-4">{t('noOrdersFound')}</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id} className="border-b">
                  <td className="p-2 font-mono text-sm">{order._id}</td>
                  <td className="p-2">{order.user?.name || 'N/A'} ({order.user?.email || 'N/A'})</td>
                  <td className="p-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-2">${order.totalPrice.toFixed(2)}</td>
                  <td className="p-2">{order.isPaid ? t('paid') : t('notPaid')}</td>
                  <td className="p-2">{order.isShipped ? t('shipped') : t('pending')}</td>
                  <td className="p-2">
                    <button
                      onClick={() => { setSelectedOrder(order); setModalOpen(true); }}
                      className="bg-gray-700 text-white px-2 py-1 rounded mr-2"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(order._id, { isShipped: !order.isShipped })}
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      {t('toggleShipped')}
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
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>{t('previous')}</button>
        <span>{t('page')} {page} {t('of')} {totalPages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>{t('next')}</button>
      </div>

      {/* Order Details Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selectedOrder ? `Order #${selectedOrder._id.slice(-6)}` : ''}>
        {selectedOrder && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <h3 className="font-semibold mb-2">Customer</h3>
              <div>{selectedOrder.user?.name} ({selectedOrder.user?.email})</div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Order Items</h3>
              <ul className="divide-y divide-gray-200">
                {selectedOrder.orderItems.map((item, idx) => (
                  <li key={idx} className="py-2 flex items-center gap-2">
                    <img src={item.image ? `http://localhost:5000/uploads/images/${item.image}` : '/placeholder.png'} alt={item.name} className="w-10 h-10 object-cover rounded border" onError={e => { e.target.src = '/placeholder.png'; }} />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">Qty: {item.qty} | Price: ${item.price.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">Category: {item.product?.category?.name || item.category?.name || item.product?.category || item.category || 'Unknown'}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Shipping Address</h3>
              <div className="text-sm text-gray-700">
                {selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}, {selectedOrder.shippingAddress?.country}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Payment</h3>
              <div className="text-sm">Method: {selectedOrder.paymentMethod}</div>
              <div className="text-sm">Status: {selectedOrder.isPaid ? 'Paid' : 'Not Paid'}</div>
              <div className="text-sm">Total: ${selectedOrder.totalPrice.toFixed(2)}</div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Category Breakdown</h3>
              <div className="flex flex-col items-center">
                <Pie
                  data={{
                    labels: getCategoryBreakdown(selectedOrder).map(d => d.category),
                    datasets: [{
                      data: getCategoryBreakdown(selectedOrder).map(d => d.qty),
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(251, 191, 36, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(168, 85, 247, 0.8)',
                        'rgba(244, 114, 182, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(250, 204, 21, 0.8)',
                      ],
                    }],
                  }}
                  options={{
                    plugins: { legend: { position: 'bottom' } },
                    maintainAspectRatio: false,
                  }}
                  height={180}
                />
                <Bar
                  data={{
                    labels: getCategoryBreakdown(selectedOrder).map(d => d.category),
                    datasets: [{
                      label: 'Quantity',
                      data: getCategoryBreakdown(selectedOrder).map(d => d.qty),
                      backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    }],
                  }}
                  options={{
                    plugins: { legend: { display: false } },
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                  }}
                  height={180}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrdersAdmin;
