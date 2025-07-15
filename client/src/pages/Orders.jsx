import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { reorderOrderItems } from '../utils/cart';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLang } from '../utils/lang';

const Orders = () => {
  const { t } = useLang();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/orders/myorders', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        setOrders(data.data || data.orders || data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Helper function to get status badge styling
  const getStatusBadge = (order) => {
    // Determine the actual status based on order data
    let status = order.orderStatus || order.status || 'pending';
    
    // If order is delivered, override status
    if (order.isDelivered) {
      status = 'delivered';
    }
    
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: t('pending'), icon: '⏳' },
      'processing': { color: 'bg-blue-100 text-blue-800', text: t('processing'), icon: '⚙️' },
      'shipped': { color: 'bg-green-100 text-green-800', text: t('shipped'), icon: '📦' },
      'delivered': { color: 'bg-green-100 text-green-800', text: t('delivered'), icon: '✅' },
      'cancelled': { color: 'bg-red-100 text-red-800', text: t('cancelled'), icon: '❌' },
      'refunded': { color: 'bg-purple-100 text-purple-800', text: t('refunded'), icon: '💰' }
    };
    
    const config = statusConfig[status?.toLowerCase()] || statusConfig['pending'];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color} flex items-center gap-1`}>
        <span>{config.icon}</span>
        {config.text}
      </span>
    );
  };

  // Helper function to get product image
  const getProductImage = (item) => {
    if (item.product?.image) {
      // If the image path starts with /uploads, prepend the backend URL
      if (item.product.image.startsWith('/uploads')) {
        return `http://localhost:5000${item.product.image}`;
      }
      return item.product.image;
    }
    if (item.image) {
      // If the image path starts with /uploads, prepend the backend URL
      if (item.image.startsWith('/uploads')) {
        return `http://localhost:5000${item.image}`;
      }
      return item.image;
    }
    return '/placeholder.png'; // Fallback image
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-yellow-50 to-blue-50 py-10 px-2">
        <div className="w-full max-w-3xl">
          <h1 className="text-4xl font-bold text-center text-blue-400 mb-6 font-fredoka">{t('myOrders')}</h1>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg text-blue-400">{t('loadingOrders')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-yellow-50 to-blue-50 py-10 px-2">
        <div className="w-full max-w-3xl">
          <h1 className="text-4xl font-bold text-center text-blue-400 mb-6 font-fredoka">{t('myOrders')}</h1>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-red-700 mb-2">{t('errorLoadingOrders')}</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
            >
              {t('tryAgain')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-yellow-50 to-blue-50 py-10 px-2">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center text-blue-400 mb-6 font-fredoka">{t('myOrders')}</h1>
        
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('noOrdersYet')}</h3>
            <p className="text-gray-500 mb-6">{t('startShoppingToSeeOrders')}</p>
            <Link
              to="/products"
              className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
            >
              {t('browseProducts')}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white bg-opacity-90 rounded-xl shadow-lg p-6 border border-blue-100 hover:shadow-xl transition-all duration-300"
              >
                {/* Order Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 pb-4 border-b border-gray-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-blue-500">
                        {t('order')} #{order._id.slice(-6).toUpperCase()}
                      </h3>
                      {getStatusBadge(order)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {t('placedOn')} {formatDate(order.createdAt)}
                    </p>
                    {order.isPaid && (
                      <p className="text-sm text-green-600 font-semibold">
                        ✅ {t('paidOn')} {formatDate(order.paidAt)}
                      </p>
                    )}
                  </div>
                  <div className="text-right mt-2 md:mt-0">
                    <div className="text-2xl font-bold text-green-600">
                      ${order.totalPrice?.toFixed(2) || '0.00'}
                    </div>
                    <p className="text-sm text-gray-500">
                      {order.orderItems?.length || 0} {t('item', { count: order.orderItems?.length || 0 })}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h4 className="font-semibold text-blue-400 mb-3">{t('items')}:</h4>
                  <div className="space-y-3">
                    {order.orderItems && order.orderItems.length > 0 ? (
                      order.orderItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <img
                              src={getProductImage(item)}
                              alt={item.name || 'Product'}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                e.target.src = '/placeholder.png';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-gray-800 truncate">
                              {item.name || 'Product Name'}
                            </h5>
                            <p className="text-sm text-gray-500">
                              Quantity: {item.qty || 1} × ${item.price?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-800">
                              ${((item.qty || 1) * (item.price || 0)).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-400">
                        No items found in this order.
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                {order.shippingAddress && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-400 mb-2">Shipping Address:</h4>
                    <p className="text-sm text-gray-700">
                      {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                    </p>
                  </div>
                )}

                {/* Order Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                  <Link
                    to={`/order/${order._id}`}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    View Details
                  </Link>
                  <Link
                    to="/order-tracking"
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    Track Order
                  </Link>
                  <button
                    onClick={async () => {
                      await reorderOrderItems(order.orderItems);
                      toast.success('Items added to cart!');
                      setTimeout(() => navigate('/cart'), 1000);
                    }}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    Reorder
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-200 hover:bg-blue-300 text-blue-700 font-semibold rounded-lg shadow transition-colors"
          >
            ← Back to Account
          </button>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default Orders; 