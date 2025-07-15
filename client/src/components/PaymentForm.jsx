import React, { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import { useLang } from '../utils/lang';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const PaymentForm = ({ order, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useLang();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);

  // Create payment intent when component mounts
  useEffect(() => {
    if (order && !paymentIntent) {
      createPaymentIntent();
    }
  }, [order]);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderId: order._id,
          paymentMethod: 'stripe'
        })
      });

      const data = await response.json();

      if (data.success) {
        setPaymentIntent(data.data.paymentIntent);
        console.log('Payment intent created:', data.data);
        console.log('Test mode:', data.data.testMode);
      } else {
        throw new Error(data.message || 'Failed to create payment intent');
      }
    } catch (err) {
      console.error('Create payment intent error:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !paymentIntent) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if we're in test mode (payment intent ID starts with 'pi_test_')
      const isTestMode = paymentIntent.id.startsWith('pi_test_');
      
      if (isTestMode) {
        console.log('Test mode: simulating payment confirmation');
        
        // Simulate payment confirmation for test mode
        const confirmResponse = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id
          })
        });

        const confirmData = await confirmResponse.json();

        if (confirmData.success) {
          toast.success('Test payment successful!');
          onPaymentSuccess && onPaymentSuccess(confirmData.data);
        } else {
          throw new Error(confirmData.message || 'Test payment confirmation failed');
        }
      } else {
        // Real Stripe payment flow
        const { error: stripeError, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
          paymentIntent.clientSecret,
          {
            payment_method: {
              card: elements.getElement(CardElement),
              billing_details: {
                name: order.user?.name || 'Customer',
                email: order.user?.email || 'customer@example.com',
              },
            },
          }
        );

        if (stripeError) {
          throw new Error(stripeError.message);
        }

        if (confirmedIntent.status === 'succeeded') {
          // Confirm payment with our backend
          const confirmResponse = await fetch('/api/payment/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              paymentIntentId: confirmedIntent.id
            })
          });

          const confirmData = await confirmResponse.json();

          if (confirmData.success) {
            toast.success('Payment successful!');
            onPaymentSuccess && onPaymentSuccess(confirmData.data);
          } else {
            throw new Error(confirmData.message || 'Payment confirmation failed');
          }
        } else {
          throw new Error('Payment was not successful');
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message);
      toast.error(err.message);
      onPaymentError && onPaymentError(err);
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return <div className="text-center text-gray-500">No order selected</div>;
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('paymentDetails') || 'Payment Details'}
        </h2>
        <p className="text-gray-600">
          {t('orderTotal') || 'Order Total'}: <span className="font-semibold">${order.totalPrice.toFixed(2)}</span>
        </p>
        {paymentIntent && paymentIntent.id.startsWith('pi_test_') && (
          <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded text-blue-700 text-sm">
            🧪 <strong>Test Mode:</strong> This is a test payment. No real charges will be made.
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('cardDetails') || 'Card Details'}
          </label>
          <div className="border border-gray-300 rounded-md p-3">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-gray-900 mb-2">
            {t('orderSummary') || 'Order Summary'}
          </h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>{t('subtotal') || 'Subtotal'}:</span>
              <span>${(order.totalPrice - order.taxPrice - order.shippingPrice).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('tax') || 'Tax'}:</span>
              <span>${order.taxPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('shipping') || 'Shipping'}:</span>
              <span>${order.shippingPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium text-gray-900 border-t pt-1">
              <span>{t('total') || 'Total'}:</span>
              <span>${order.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!stripe || loading}
          className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
            loading || !stripe
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {t('processing') || 'Processing...'}
            </div>
          ) : (
            `${t('pay') || 'Pay'} $${order.totalPrice.toFixed(2)}`
          )}
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-500 text-center">
        {t('securePayment') || 'Your payment is secure and encrypted'}
      </div>
    </div>
  );
};

export default PaymentForm; 