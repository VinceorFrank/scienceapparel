import React, { useState } from 'react';
import Header from '../components/Header';
import { useLang } from '../utils/lang';

// Mock order data for demonstration
const mockOrder = {
  orderNumber: 'ORD123456',
  email: 'jane@example.com',
  date: '2024-06-01',
  status: 'Shipped', // Possible: Processing, Shipped, Out for Delivery, Delivered
  estimatedDelivery: '2024-06-05',
  trackingLink: 'https://tracking.example.com/ORD123456',
  shippingAddress: {
    name: 'Jane Doe',
    address: '123 Fashion Street',
    city: 'Montreal',
    postalCode: 'H2H 2P9',
    country: 'Canada',
  },
  items: [
    { name: 'T-shirt à poche', qty: 2, price: 19.99 },
    { name: 'Crewneck pastel', qty: 1, price: 39.99 },
  ],
  total: 79.97,
};

const statusSteps = [
  { key: 'Processing', label: 'Processing', icon: '🛒', color: 'bg-yellow-200', text: 'text-yellow-600' },
  { key: 'Shipped', label: 'Shipped', icon: '🚚', color: 'bg-blue-200', text: 'text-blue-600' },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: '📦', color: 'bg-purple-200', text: 'text-purple-600' },
  { key: 'Delivered', label: 'Delivered', icon: '✅', color: 'bg-green-200', text: 'text-green-600' },
];

const OrderTracking = () => {
  const { t } = useLang();
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);
    // Simulate API call
    setTimeout(() => {
      if (
        orderNumber.trim().toUpperCase() === mockOrder.orderNumber &&
        email.trim().toLowerCase() === mockOrder.email
      ) {
        setOrder(mockOrder);
        setError('');
      } else {
        setError(t('orderNotFound'));
        setOrder(null);
      }
      setLoading(false);
    }, 1200);
  };

  // Find the current step index
  const getCurrentStep = (status) => {
    return statusSteps.findIndex((step) => step.key === status);
  };

  return (
    <div className="flex flex-col min-h-screen w-full overflow-hidden">
      <Header />
      <main className="flex-1 mt-28 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="text-center max-w-4xl mx-auto py-8 sm:py-12 lg:py-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight"
              style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
            {t('orderTrackingTitle')}
          </h1>
          <div className="w-24 h-1 mx-auto mb-6 rounded-full"
               style={{ background: 'linear-gradient(90deg, #FECFEF 0%, #A7F0BA 100%)' }} />
          <p className="text-lg sm:text-xl lg:text-2xl mb-8 text-slate-700 max-w-2xl mx-auto leading-relaxed">
            {t('orderTrackingSubtitle')}
          </p>
        </section>

        {/* Lookup Form */}
        <section className="max-w-xl mx-auto mb-12 lg:mb-16">
          <form onSubmit={handleSubmit} className="bg-gradient-to-br from-blue-100 via-pink-100 to-white rounded-3xl shadow-xl p-8 lg:p-12 border border-blue-100 space-y-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-400 text-center" style={{ fontFamily: 'Fredoka One, cursive' }}>{t('orderLookup')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('orderNumber')}</label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-blue-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  placeholder={t('orderNumberPlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-blue-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  placeholder={t('emailPlaceholder')}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full px-8 py-4 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold rounded-full shadow-lg hover:from-pink-500 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? t('searching') : t('trackOrder')}
            </button>
            {error && <div className="text-center text-red-600 font-semibold mt-2">{error}</div>}
          </form>
        </section>

        {/* Order Result */}
        {order && (
          <section className="max-w-3xl mx-auto mb-12 lg:mb-16">
            <div className="bg-gradient-to-br from-green-100 via-blue-100 to-white rounded-3xl shadow-xl p-8 lg:p-12 border border-green-100">
              <h2 className="text-2xl font-bold mb-6 text-green-400 text-center" style={{ fontFamily: 'Fredoka One, cursive' }}>{t('orderSummary')}</h2>
              <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <div className="font-semibold text-blue-400">{t('orderNumber')}: <span className="text-slate-700">{order.orderNumber}</span></div>
                  <div className="text-sm text-slate-600">{t('orderDate')}: {order.date}</div>
                </div>
                <div>
                  <div className="font-semibold text-blue-400">{t('status')}: <span className="text-slate-700">{t(order.status)}</span></div>
                  <div className="text-sm text-slate-600">{t('estimatedDelivery')}: {order.estimatedDelivery}</div>
                </div>
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between mb-8">
                {statusSteps.map((step, idx) => {
                  const currentIdx = getCurrentStep(order.status);
                  const isActive = idx <= currentIdx;
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-full mb-2 text-2xl font-bold border-4 ${isActive ? step.color + ' ' + step.text + ' border-white shadow-lg' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                        {step.icon}
                      </div>
                      <div className={`text-xs font-semibold ${isActive ? step.text : 'text-gray-400'}`}>{t(step.label)}</div>
                      {idx < statusSteps.length - 1 && (
                        <div className={`w-full h-1 ${isActive ? step.color : 'bg-gray-200'} mt-2 mb-2`}></div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2 text-blue-400">{t('items')}</h3>
                <ul className="divide-y divide-blue-100">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="py-2 flex justify-between items-center">
                      <span>{item.name} <span className="text-xs text-slate-500">x{item.qty}</span></span>
                      <span className="font-semibold text-blue-400">${(item.price * item.qty).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-right mt-2 font-bold text-lg text-green-600">
                  {t('total')}: ${order.total.toFixed(2)}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2 text-blue-400">{t('shippingAddress')}</h3>
                <div className="text-slate-700">
                  {order.shippingAddress.name}<br />
                  {order.shippingAddress.address}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.postalCode}<br />
                  {order.shippingAddress.country}
                </div>
              </div>

              {/* Tracking Link */}
              <div className="mb-2">
                <a
                  href={order.trackingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold rounded-full shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300"
                >
                  {t('trackShipment')}
                </a>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default OrderTracking;
