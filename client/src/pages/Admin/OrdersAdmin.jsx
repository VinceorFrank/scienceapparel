import React from 'react';
import useOrderManagement from '../../hooks/useOrderManagement';
import { exportOrders } from '../../utils/exportUtils';
import { useLang } from '../../utils/lang.jsx';
import Modal from './components/Modal.jsx';
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selectedOrder ? `Order #${selectedOrder._id.slice(-6).toUpperCase()}` : ''}>
        {selectedOrder && (
          <div className="max-h-[95vh] overflow-y-auto p-6 bg-gradient-to-br from-yellow-50 to-blue-50">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-blue-400 mb-2 font-fredoka">
                    Order #{selectedOrder._id.slice(-6).toUpperCase()}
                  </h1>
                  <p className="text-gray-600">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="bg-blue-200 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-300 transition-colors font-semibold"
                >
                  ← Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Status */}
                <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-blue-400">Order Status</h2>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      selectedOrder.isPaid 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    } flex items-center gap-2`}>
                      <span>{selectedOrder.isPaid ? '✅' : '⏳'}</span>
                      {selectedOrder.isPaid ? 'Payment Received' : 'Awaiting Payment'}
                    </span>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-4">
                    {[
                      {
                        step: 'Order Placed',
                        date: selectedOrder.createdAt,
                        completed: true,
                        icon: '📝'
                      },
                      {
                        step: 'Payment Received',
                        date: selectedOrder.isPaid ? selectedOrder.paidAt : null,
                        completed: selectedOrder.isPaid,
                        icon: '💳'
                      },
                      {
                        step: 'Processing',
                        date: selectedOrder.isPaid ? selectedOrder.paidAt : null,
                        completed: selectedOrder.isPaid,
                        icon: '📦'
                      },
                      {
                        step: 'Shipped',
                        date: selectedOrder.shipping?.shippedAt || null,
                        completed: !!selectedOrder.shipping?.shippedAt || selectedOrder.isShipped,
                        icon: '🚚'
                      },
                      {
                        step: 'Delivered',
                        date: selectedOrder.isDelivered ? selectedOrder.deliveredAt : null,
                        completed: selectedOrder.isDelivered,
                        icon: '✅'
                      }
                    ].map((step, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          step.completed 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          {step.completed ? '✓' : index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{step.icon}</span>
                              <span className={`font-medium ${
                                step.completed ? 'text-gray-900' : 'text-gray-500'
                              }`}>
                                {step.step}
                              </span>
                            </div>
                            {step.date && (
                              <span className="text-sm text-gray-500">
                                {new Date(step.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
                  <h2 className="text-xl font-semibold text-blue-400 mb-6">Ordered Items</h2>
                  <div className="space-y-4">
                    {selectedOrder.orderItems.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <img
                          src={item.image ? `http://localhost:5000/uploads/images/${item.image}` : '/placeholder.png'}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.target.src = '/placeholder.png';
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-500">Quantity: {item.qty}</p>
                          <p className="text-xs text-gray-400">Category: {item.product?.category?.name || item.category?.name || item.product?.category || item.category || 'Unknown'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">${(item.price * item.qty).toFixed(2)}</p>
                          <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
                  <h2 className="text-xl font-semibold text-blue-400 mb-4">Shipping Address</h2>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900">{selectedOrder.shippingAddress?.address}</p>
                    <p className="text-gray-600">
                      {selectedOrder.shippingAddress?.postalCode} {selectedOrder.shippingAddress?.city}
                    </p>
                    <p className="text-gray-600">{selectedOrder.shippingAddress?.country}</p>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
                  <h2 className="text-xl font-semibold text-blue-400 mb-4">Customer Information</h2>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900">{selectedOrder.user?.name}</p>
                    <p className="text-gray-600">{selectedOrder.user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
                  <h2 className="text-xl font-semibold text-blue-400 mb-4">Order Summary</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${selectedOrder.orderItems.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${selectedOrder.taxPrice?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>${selectedOrder.shippingPrice?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${selectedOrder.totalPrice?.toFixed(2) || '0.00'}</span>
                    </div>
                    {selectedOrder.isPaid && (
                      <div className="flex justify-between text-green-600">
                        <span>Paid:</span>
                        <span>{selectedOrder.paidAt ? new Date(selectedOrder.paidAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
                  <h2 className="text-xl font-semibold text-blue-400 mb-4">Payment Information</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <span>{selectedOrder.paymentMethod || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`font-medium ${selectedOrder.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedOrder.isPaid ? 'Paid' : 'Not Paid'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, { isShipped: !selectedOrder.isShipped })}
                    className={`w-full px-6 py-3 font-bold rounded-2xl shadow-md transition-all duration-300 transform hover:-translate-y-1 ${
                      selectedOrder.isShipped
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                    style={{ fontFamily: 'Fredoka One, cursive' }}
                  >
                    {selectedOrder.isShipped ? '🔄 Mark as Pending' : '📦 Mark as Shipped'}
                  </button>
                  
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, { isPaid: !selectedOrder.isPaid })}
                    className={`w-full px-6 py-3 font-bold rounded-2xl shadow-md transition-all duration-300 transform hover:-translate-y-1 ${
                      selectedOrder.isPaid
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                    style={{ fontFamily: 'Fredoka One, cursive' }}
                  >
                    {selectedOrder.isPaid ? '❌ Mark as Unpaid' : '✅ Mark as Paid'}
                  </button>

                  <button
                    onClick={() => alert('Invoice download coming soon!')}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-100 via-blue-300 to-white text-blue-700 font-bold rounded-2xl shadow-md hover:from-blue-200 hover:to-blue-400 hover:text-blue-800 transition-all duration-300 transform hover:-translate-y-1"
                    style={{ fontFamily: 'Fredoka One, cursive' }}
                  >
                    📄 Download Invoice
                  </button>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
                  <h2 className="text-xl font-semibold text-blue-400 mb-4">Category Breakdown</h2>
                  <div className="space-y-4">
                    {getCategoryBreakdown(selectedOrder).map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium">{item.category}</span>
                        <span className="text-blue-600 font-bold">{item.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrdersAdmin;
