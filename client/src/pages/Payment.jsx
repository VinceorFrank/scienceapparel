import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import PaymentForm from '../components/PaymentForm';
import { useLang } from '../utils/lang';
import { getTestOrderId } from '../utils/testUtils';

// Initialize Stripe (you'll need to add your publishable key to environment variables)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here');

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      
      // For test orders, create mock data
      if (orderId === getTestOrderId()) {
        console.log('Using test order data');
        const mockOrder = {
          _id: getTestOrderId(),
          orderItems: [
            {
              name: 'Test Product',
              qty: 1,
              price: 29.99,
              image: '/placeholder.png'
            }
          ],
          totalPrice: 34.49,
          taxPrice: 4.50,
          shippingPrice: 12.99,
          itemsPrice: 29.99,
          isPaid: false,
          createdAt: new Date().toISOString(),
          shippingAddress: {
            address: '4070, rue Chambord',
            city: 'Montréal',
            postalCode: 'H2J3M7',
            country: 'Canada'
          }
        };
        setOrder(mockOrder);
        return;
      }
      
      // For real orders, fetch from API
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setOrder(data);
      } else {
        throw new Error(data.message || 'Failed to fetch order');
      }
    } catch (err) {
      console.error('Fetch order error:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    toast.success('Payment successful! Your order has been confirmed.');
    // Redirect to order confirmation page
    navigate(`/order/${orderId}`, { 
      state: { paymentSuccess: true, paymentData } 
    });
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    // Error is already handled in PaymentForm component
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pastel-pink via-pastel-blue to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pastel-pink via-pastel-blue to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('error')}
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/account')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('backToAccount') || 'Back to Account'}
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pastel-pink via-pastel-blue to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('orderNotFound') || 'Order Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">
            {t('orderNotFoundMessage') || 'The order you are looking for does not exist.'}
          </p>
          <button
            onClick={() => navigate('/account')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('backToAccount') || 'Back to Account'}
          </button>
        </div>
      </div>
    );
  }

  if (order.isPaid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pastel-pink via-pastel-blue to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('orderAlreadyPaid') || 'Order Already Paid'}
          </h2>
          <p className="text-gray-600 mb-4">
            {t('orderAlreadyPaidMessage') || 'This order has already been paid for.'}
          </p>
          <button
            onClick={() => navigate(`/order/${orderId}`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('viewOrder') || 'View Order'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-pink via-pastel-blue to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('securePayment') || 'Secure Payment'}
          </h1>
          <p className="text-gray-600">
            {t('completeYourOrder') || 'Complete your order with secure payment'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('orderSummary') || 'Order Summary'}
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('orderId') || 'Order ID'}:</span>
                <span className="font-mono text-sm">{order._id}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('orderDate') || 'Order Date'}:</span>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  {t('orderItems') || 'Order Items'}
                </h3>
                <div className="space-y-2">
                  {order.orderItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.image ? `/uploads/images/${item.image}` : '/placeholder.png'}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded border"
                          onError={(e) => { e.target.src = '/placeholder.png'; }}
                        />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-gray-500">Qty: {item.qty}</div>
                        </div>
                      </div>
                      <span className="font-medium">${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('subtotal') || 'Subtotal'}:</span>
                  <span>${(order.totalPrice - order.taxPrice - order.shippingPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('tax') || 'Tax'}:</span>
                  <span>${order.taxPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('shipping') || 'Shipping'}:</span>
                  <span>${order.shippingPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>{t('total') || 'Total'}:</span>
                  <span>${order.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-pastel-yellow to-pastel-green p-4 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">
                  {t('shippingAddress') || 'Shipping Address'}
                </h3>
                <div className="text-sm text-gray-600">
                  <p>{order.shippingAddress.address}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <Elements stripe={stripePromise}>
              <PaymentForm
                order={order}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
              />
            </Elements>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-blue-600">🔒</span>
              <span className="font-medium text-blue-900">
                {t('securePaymentNotice') || 'Secure Payment'}
              </span>
            </div>
            <p className="text-sm text-blue-700">
              {t('securePaymentDescription') || 
                'Your payment information is encrypted and secure. We use industry-standard SSL encryption to protect your data.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment; 