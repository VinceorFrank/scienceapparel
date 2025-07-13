import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Orders = () => {
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
        setOrders(data.orders || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-yellow-50 to-blue-50 py-10 px-2">
      <div className="w-full max-w-3xl">
        <h1 className="text-4xl font-bold text-center text-blue-400 mb-6 font-fredoka">My Orders</h1>
        {loading && (
          <div className="text-center text-lg text-blue-400">Loading orders...</div>
        )}
        {error && (
          <div className="text-center text-red-500 mb-4">{error}</div>
        )}
        {!loading && !error && orders.length === 0 && (
          <div className="text-center text-gray-500">You have no orders yet.</div>
        )}
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white bg-opacity-80 rounded-xl shadow-md p-6 flex flex-col gap-2 border border-blue-100"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
                <div className="font-bold text-lg text-blue-500">Order #{order._id.slice(-6).toUpperCase()}</div>
                <div className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Status:</span> {order.status || 'Processing'}
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Total:</span> ${order.totalPrice?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="mt-2">
                <div className="font-semibold text-blue-400 mb-1">Items:</div>
                <ul className="pl-4 list-disc">
                  {order.orderItems && order.orderItems.length > 0 ? (
                    order.orderItems.map((item, idx) => (
                      <li key={idx} className="text-gray-700">
                        {item.name} x{item.qty} <span className="text-gray-400">(${item.price?.toFixed(2) || '0.00'} each)</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400">No items found.</li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 rounded-lg bg-blue-200 hover:bg-blue-300 text-blue-700 font-semibold shadow"
          >
            Back to Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Orders; 