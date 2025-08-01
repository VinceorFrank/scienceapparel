// client/src/pages/OrderDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { getOrderById } from "../api/orders";
import { reorderOrderItems } from "../utils/cart";
import { toast } from "react-toastify";
import { getTestOrderId } from "../utils/testUtils";
import { useLang } from "../utils/lang";

const OrderDetail = () => {
  const { t } = useLang();
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const navigate = useNavigate();

  // Check if we're coming from a successful payment
  useEffect(() => {
    if (location.state?.paymentSuccess) {
      setPaymentSuccess(true);
      toast.success(t('paymentSuccessfulMessage'));
    }
  }, [location.state]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        
        // Check if this is a test order
        if (id === getTestOrderId()) {
          console.log('Using test order data for order detail');
          const mockOrder = {
            _id: getTestOrderId(),
            orderItems: [
              {
                name: 'Test Product',
                qty: 1,
                price: 29.99,
                image: '/placeholder.png',
                product: {
                  name: 'Test Product',
                  image: '/placeholder.png'
                }
              }
            ],
            totalPrice: 34.49,
            taxPrice: 4.50,
            shippingPrice: 12.99,
            itemsPrice: 29.99,
            isPaid: true,
            paidAt: new Date().toISOString(),
            orderStatus: 'confirmed',
            createdAt: new Date().toISOString(),
            shippingAddress: {
              address: '4070, rue Chambord',
              city: 'Montréal',
              postalCode: 'H2J3M7',
              country: 'Canada'
            },
            user: {
              name: 'Test User',
              email: 'test@example.com'
            }
          };
          setOrder(mockOrder);
          return;
        }
        
        // For real orders, fetch from API
        const response = await getOrderById(id);
        setOrder(response.data);
      } catch (err) {
        console.error('Fetch order error:', err);
        setError(t("unableToLoadOrderDetails"));
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate]);

  const getOrderStatus = (order) => {
    if (!order.isPaid) return { text: t("awaitingPayment"), color: "bg-yellow-100 text-yellow-800", icon: "⏳" };
    if (order.isPaid && !order.isDelivered) return { text: t("paymentReceived"), color: "bg-green-100 text-green-800", icon: "✅" };
    if (order.isDelivered) return { text: t("delivered"), color: "bg-blue-100 text-blue-800", icon: "📦" };
    return { text: t("processing"), color: "bg-blue-100 text-blue-800", icon: "🚚" };
  };

  const getOrderTimeline = (order) => {
    const timeline = [
      {
        step: t("orderPlaced"),
        date: order.createdAt,
        completed: true,
        icon: "📝"
      },
      {
        step: t("paymentReceived"),
        date: order.isPaid ? order.paidAt : null,
        completed: order.isPaid,
        icon: "💳"
      },
      {
        step: t("processing"),
        date: order.isPaid ? order.paidAt : null,
        completed: order.isPaid,
        icon: "📦"
      },
      {
        step: t("shipped"),
        date: order.shipping?.shippedAt || null,
        completed: !!order.shipping?.shippedAt,
        icon: "🚚"
      },
      {
        step: t("delivered"),
        date: order.isDelivered ? order.deliveredAt : null,
        completed: order.isDelivered,
        icon: "✅"
      }
    ];
    return timeline;
  };

  const getProductImage = (item) => {
    if (item.product?.image) {
      if (item.product.image.startsWith('/uploads')) {
        return `http://localhost:5000${item.product.image}`;
      }
      return item.product.image;
    }
    if (item.image) {
      if (item.image.startsWith('/uploads')) {
        return `http://localhost:5000${item.image}`;
      }
      return item.image;
    }
    return '/placeholder.png';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReorder = async () => {
    try {
      await reorderOrderItems(order.orderItems);
      toast.success(t('itemsAddedToCartSuccess'));
      // Navigate to cart page after successful reorder
      navigate('/cart');
    } catch (error) {
      toast.error(t('failedToAddItemsToCart'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">❌</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('error')}</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            to="/orders"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('backToOrders')}
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">📦</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('orderNotFound')}</h2>
          <p className="text-gray-600 mb-4">{t('orderNotFoundMessage')}</p>
          <Link
            to="/orders"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('backToOrders')}
          </Link>
        </div>
      </div>
    );
  }

  const status = getOrderStatus(order);
  const timeline = getOrderTimeline(order);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-blue-50">
      <div className="container mx-auto p-6">
        {/* Payment Success Banner */}
        {paymentSuccess && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🎉</span>
              <div>
                <h3 className="font-semibold text-lg">{t('paymentSuccessful')}</h3>
                <p className="text-sm">{t('paymentSuccessfulDescription')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Test Mode Banner */}
        {order && order._id === getTestOrderId() && (
          <div className="mb-6 bg-blue-100 border border-blue-400 text-blue-700 px-6 py-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🧪</span>
              <div>
                <h3 className="font-semibold text-lg">{t('testOrder')}</h3>
                <p className="text-sm">{t('testOrderDescription')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-400 mb-2 font-fredoka">
                {t('order')} #{order._id.slice(-6).toUpperCase()}
              </h1>
              <p className="text-gray-600">
                {t('placedOn')} {formatDate(order.createdAt)}
              </p>
            </div>
            <Link
              to="/orders"
              className="bg-blue-200 text-blue-700 px-6 py-3 rounded-lg hover:bg-blue-300 transition-colors font-semibold"
            >
              ← {t('backToOrders')}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-blue-400">{t('orderStatus')}</h2>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${status.color} flex items-center gap-2`}>
                  <span>{status.icon}</span> {status.text}
                </span>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                {timeline.map((step, index) => (
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
                            {formatDate(step.date)}
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
              <h2 className="text-xl font-semibold text-blue-400 mb-6">{t('orderedItems')}</h2>
              <div className="space-y-4">
                {order.orderItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <img
                      src={getProductImage(item)}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.src = '/placeholder.png';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">{t('quantity')}: {item.qty}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${(item.price * item.qty).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">${item.price.toFixed(2)} {t('each')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
              <h2 className="text-xl font-semibold text-blue-400 mb-4">{t('shippingAddress')}</h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-medium text-gray-900">{order.shippingAddress.address}</p>
                <p className="text-gray-600">
                  {order.shippingAddress.postalCode} {order.shippingAddress.city}
                </p>
                <p className="text-gray-600">{order.shippingAddress.country}</p>
              </div>
            </div>

            {/* Tracking Info */}
            {order.shipping && (order.shipping.trackingNumber || order.shipping.trackingUrl) && (
              <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
                <h2 className="text-xl font-semibold text-blue-400 mb-4">{t('trackingInformation')}</h2>
                <div className="bg-blue-50 p-4 rounded-lg">
                  {order.shipping.trackingNumber && (
                    <p className="text-gray-900 font-medium">{t('trackingNumber')}: {order.shipping.trackingNumber}</p>
                  )}
                  {order.shipping.trackingUrl && (
                    <a
                      href={order.shipping.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {t('trackYourShipment')}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
              <h2 className="text-xl font-semibold text-blue-400 mb-4">{t('orderSummary')}</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>{t('subtotal')}:</span>
                  <span>${order.orderItems.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('tax')}:</span>
                  <span>${order.taxPrice?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('shipping')}:</span>
                  <span>${order.shippingPrice?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>{t('total')}:</span>
                  <span>${order.totalPrice?.toFixed(2) || '0.00'}</span>
                </div>
                {order.isPaid && (
                  <div className="flex justify-between text-green-600">
                    <span>{t('paid')}:</span>
                    <span>{formatDate(order.paidAt)}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Reorder Button */}
            <button
              onClick={handleReorder}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold rounded-2xl shadow-md hover:from-pink-500 hover:to-pink-600 transition-all duration-300 transform hover:-translate-y-1 mb-4"
              style={{ fontFamily: 'Fredoka One, cursive' }}
            >
              🔄 {t('reorderItems')}
            </button>
            
            {/* Print/Download Invoice (placeholder) */}
            <button
              onClick={() => alert('Invoice download coming soon!')}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-100 via-blue-300 to-white text-blue-700 font-bold rounded-2xl shadow-md hover:from-blue-200 hover:to-blue-400 hover:text-blue-800 transition-all duration-300 transform hover:-translate-y-1"
              style={{ fontFamily: 'Fredoka One, cursive' }}
            >
              {t('downloadInvoice')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
