import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { getOrderById } from '../api/orders';

const OrderTest = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Sample order IDs from the seed script (you can replace these with actual order IDs)
  const sampleOrderIds = [
    // These will be populated after running the seed script
    // You can find actual order IDs in your database or admin panel
  ];

  useEffect(() => {
    // For demo purposes, let's show some sample order data
    const sampleOrders = [
      {
        _id: 'demo-order-1',
        orderItems: [
          {
            name: 'Periodic Table Shirt',
            qty: 2,
            price: 25.99,
            image: '/uploads/images/periodic-shirt.jpg'
          },
          {
            name: 'Galaxy Poster',
            qty: 1,
            price: 15.99,
            image: '/uploads/images/galaxy-poster.jpg'
          }
        ],
        shippingAddress: {
          address: '123 Main St',
          city: 'Anytown',
          postalCode: '12345',
          country: 'USA'
        },
        paymentMethod: 'PayPal',
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: 67.97,
        isPaid: true,
        paidAt: new Date('2024-01-15'),
        isDelivered: false,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        _id: 'demo-order-2',
        orderItems: [
          {
            name: 'Beaker Mug',
            qty: 1,
            price: 12.99,
            image: '/uploads/images/beaker-mug.jpg'
          }
        ],
        shippingAddress: {
          address: '456 Oak St',
          city: 'Anytown',
          postalCode: '12346',
          country: 'USA'
        },
        paymentMethod: 'Credit Card',
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: 12.99,
        isPaid: false,
        isDelivered: false,
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-14')
      }
    ];

    setOrders(sampleOrders);
    setLoading(false);
  }, []);

  const getOrderStatus = (order) => {
    if (!order.isPaid) return { text: "En attente de paiement", color: "bg-yellow-100 text-yellow-800", icon: "⏳" };
    if (!order.isDelivered) return { text: "En cours de livraison", color: "bg-blue-100 text-blue-800", icon: "🚚" };
    return { text: "Livrée", color: "bg-green-100 text-green-800", icon: "✅" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-white">
      <Header />
      
      <div className="max-w-6xl mx-auto p-6 mt-28">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold mb-4" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
            📦 Order Demo Page
          </h1>
          <p className="text-lg text-slate-600 mb-6">
            Test and view sample orders from your e-commerce site
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-pink-100">
          <h2 className="text-2xl font-bold mb-4 text-blue-600">🚀 How to View Real Orders</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-green-600">✅ Quick Setup:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Run: <code className="bg-gray-100 px-2 py-1 rounded">node setup-order-demo.js</code></li>
                <li>Start servers: <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code></li>
                <li>Login with: <code className="bg-gray-100 px-2 py-1 rounded">john@example.com / password123</code></li>
                <li>Go to Account page to see real orders</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-blue-600">🔑 Test Credentials:</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Customer:</strong> john@example.com / password123
                </div>
                <div>
                  <strong>Admin:</strong> admin@example.com / password123
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Orders */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center text-slate-700 mb-6">
            📋 Sample Orders (Demo Data)
          </h2>
          
          {orders.map((order) => {
            const status = getOrderStatus(order);
            return (
              <div key={order._id} className="bg-white rounded-2xl shadow-lg border border-pink-100 overflow-hidden">
                {/* Order Header */}
                <div className="bg-gradient-to-r from-pink-100 to-blue-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">
                        Order #{order._id.slice(-6)}
                      </h3>
                      <p className="text-slate-600">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${status.color}`}>
                      {status.icon} {status.text}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <h4 className="font-semibold mb-4 text-slate-700">Items:</h4>
                  <div className="space-y-3">
                    {order.orderItems.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={item.image || '/placeholder.png'}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.target.src = '/placeholder.png';
                          }}
                        />
                        <div className="flex-1">
                          <h5 className="font-medium text-slate-800">{item.name}</h5>
                          <p className="text-sm text-slate-500">Qty: {item.qty}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-800">
                            €{(item.price * item.qty).toFixed(2)}
                          </p>
                          <p className="text-sm text-slate-500">
                            €{item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-slate-600">Shipping to:</p>
                        <p className="font-medium text-slate-800">
                          {order.shippingAddress.address}, {order.shippingAddress.city}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Total:</p>
                        <p className="text-xl font-bold text-slate-800">
                          €{order.totalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex gap-3">
                    <Link
                      to={`/order/${order._id}`}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
                    >
                      👁️ View Details
                    </Link>
                    {!order.isPaid && (
                      <Link
                        to={`/payment/${order._id}`}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-center"
                      >
                        💳 Pay Now
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="bg-gradient-to-r from-pink-400 to-pink-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:from-pink-500 hover:to-pink-600 transition-all duration-300"
            >
              🏠 Back to Home
            </Link>
            <Link
              to="/products"
              className="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300"
            >
              🛍️ Browse Products
            </Link>
            <Link
              to="/login"
              className="bg-gradient-to-r from-green-400 to-green-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:from-green-500 hover:to-green-600 transition-all duration-300"
            >
              👤 Login to See Real Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTest; 