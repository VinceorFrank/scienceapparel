import React from 'react';
import useOrderManagement from '../../hooks/useOrderManagement';
import { exportOrders } from '../../utils/exportUtils';
import { useLang } from '../../utils/lang.jsx';

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

  // Handle export
  const handleExport = () => {
    exportOrders(orders);
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
    </div>
  );
};

export default OrdersAdmin;
