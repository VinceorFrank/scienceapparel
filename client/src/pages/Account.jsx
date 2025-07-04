// client/src/pages/Account.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getUserDashboard, 
  getOrderHistory, 
  getActiveOrders, 
  getOrderTracking,
  reorderFromOrder 
} from '../api/orders';
import { getProfile } from '../api/users';
import Layout from '../components/Layout';
import PastelCard from '../components/PastelCard';

const Account = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [orderHistory, setOrderHistory] = useState(null);
  const [activeOrders, setActiveOrders] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [historyFilters, setHistoryFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboard, history, active] = await Promise.all([
        getUserDashboard(),
        getOrderHistory(historyFilters),
        getActiveOrders()
      ]);
      
      setDashboardData(dashboard.data);
      setOrderHistory(history.data);
      setActiveOrders(active.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderTracking = async (orderId) => {
    try {
      const tracking = await getOrderTracking(orderId);
      setTrackingData(tracking.data);
      setSelectedOrder(orderId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReorder = async (orderId) => {
    try {
      const result = await reorderFromOrder(orderId);
      if (result.data.canProceed) {
        // Redirect to cart with reorder items
        // This would need to be implemented in the cart system
        alert('Items added to cart for reorder!');
      } else {
        alert('Some items are no longer available for reorder.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleHistoryFilterChange = (newFilters) => {
    const updatedFilters = { ...historyFilters, ...newFilters, page: 1 };
    setHistoryFilters(updatedFilters);
    loadOrderHistory(updatedFilters);
  };

  const loadOrderHistory = async (filters) => {
    try {
      const history = await getOrderHistory(filters);
      setOrderHistory(history.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={loadDashboardData}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600 mt-2">Manage your orders, track shipments, and view your account information</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'orders', name: 'Order History', icon: '📦' },
              { id: 'tracking', name: 'Order Tracking', icon: '🚚' },
              { id: 'active', name: 'Active Orders', icon: '⏳' },
              { id: 'profile', name: 'Profile', icon: '👤' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-6">
            {/* Account Summary */}
            <PastelCard className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Summary</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Member since: {formatDate(dashboardData.accountSummary.memberSince)}</p>
                    <p>Last login: {formatDate(dashboardData.accountSummary.lastLogin)}</p>
                    <p>Addresses: {dashboardData.accountSummary.totalAddresses}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Statistics</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Total Orders: {dashboardData.orderStatistics.totalOrders}</p>
                    <p>Total Spent: {formatCurrency(dashboardData.orderStatistics.totalSpent)}</p>
                    <p>Average Order: {formatCurrency(dashboardData.orderStatistics.averageOrderValue)}</p>
                    <p>Completion Rate: {dashboardData.orderStatistics.completionRate}%</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
                  <div className="space-y-2">
                    {dashboardData.quickActions.canReorder && (
                      <button className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                        Reorder Previous Items
                      </button>
                    )}
                    {dashboardData.quickActions.hasPendingOrders && (
                      <Link to="/orders" className="block w-full px-3 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 text-center">
                        View Pending Orders
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </PastelCard>

            {/* Recent Orders */}
            <PastelCard className="bg-gradient-to-r from-green-50 to-emerald-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
              <div className="space-y-4">
                {dashboardData.recentOrders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">Order #{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                        <p className="text-sm text-gray-600">{order.itemCount} items</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(order.totalPrice)}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => loadOrderTracking(order.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Track
                      </button>
                      {order.isDelivered && (
                        <button
                          onClick={() => handleReorder(order.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Reorder
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </PastelCard>

            {/* Recent Activity */}
            <PastelCard className="bg-gradient-to-r from-purple-50 to-pink-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </PastelCard>
          </div>
        )}

        {activeTab === 'orders' && orderHistory && (
          <div className="space-y-6">
            {/* Filters */}
            <PastelCard className="bg-gradient-to-r from-gray-50 to-slate-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order History</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={historyFilters.status}
                  onChange={(e) => handleHistoryFilterChange({ status: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <input
                  type="date"
                  value={historyFilters.dateFrom}
                  onChange={(e) => handleHistoryFilterChange({ dateFrom: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2"
                  placeholder="From Date"
                />
                <input
                  type="date"
                  value={historyFilters.dateTo}
                  onChange={(e) => handleHistoryFilterChange({ dateTo: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2"
                  placeholder="To Date"
                />
                <select
                  value={historyFilters.sortBy}
                  onChange={(e) => handleHistoryFilterChange({ sortBy: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2"
                >
                  <option value="createdAt">Order Date</option>
                  <option value="totalPrice">Total Price</option>
                  <option value="orderStatus">Status</option>
                </select>
              </div>
            </PastelCard>

            {/* Order List */}
            <div className="space-y-4">
              {orderHistory.orders.map((order) => (
                <PastelCard key={order.id} className="bg-white border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <h4 className="font-medium text-gray-900">Order #{order.orderNumber}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{formatDate(order.createdAt)}</p>
                      <p className="text-sm text-gray-600">{order.itemCount} items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(order.totalPrice)}</p>
                      <div className="mt-2 flex space-x-2">
                        <button
                          onClick={() => loadOrderTracking(order.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Track
                        </button>
                        {order.isDelivered && (
                          <button
                            onClick={() => handleReorder(order.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Reorder
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </PastelCard>
              ))}
            </div>

            {/* Pagination */}
            {orderHistory.pagination && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Showing {((orderHistory.pagination.currentPage - 1) * orderHistory.pagination.limit) + 1} to{' '}
                  {Math.min(orderHistory.pagination.currentPage * orderHistory.pagination.limit, orderHistory.pagination.totalOrders)} of{' '}
                  {orderHistory.pagination.totalOrders} orders
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleHistoryFilterChange({ page: orderHistory.pagination.currentPage - 1 })}
                    disabled={!orderHistory.pagination.hasPrevPage}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handleHistoryFilterChange({ page: orderHistory.pagination.currentPage + 1 })}
                    disabled={!orderHistory.pagination.hasNextPage}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tracking' && trackingData && (
          <div className="space-y-6">
            <PastelCard className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Tracking - #{trackingData.order.orderNumber}
              </h3>
              
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Status: <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(trackingData.order.status)}`}>
                      {trackingData.order.status}
                    </span></p>
                    <p>Total: {formatCurrency(trackingData.order.totalPrice)}</p>
                    <p>Ordered: {formatDate(trackingData.order.createdAt)}</p>
                    <p>Payment: {trackingData.order.isPaid ? 'Paid' : 'Pending'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Shipping Details</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Carrier: {trackingData.shipping.carrier}</p>
                    <p>Method: {trackingData.shipping.shippingMethod}</p>
                    <p>Cost: {formatCurrency(trackingData.shipping.shippingCost)}</p>
                    {trackingData.shipping.trackingNumber && (
                      <p>Tracking: {trackingData.shipping.trackingNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tracking Timeline */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Tracking Timeline</h4>
                <div className="space-y-4">
                  {trackingData.tracking.timeline.map((event, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className={`w-3 h-3 rounded-full ${event.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{event.status}</p>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(event.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </PastelCard>
          </div>
        )}

        {activeTab === 'active' && activeOrders && (
          <div className="space-y-6">
            <PastelCard className="bg-gradient-to-r from-yellow-50 to-orange-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Active Orders ({activeOrders.count})
              </h3>
              <div className="space-y-4">
                {activeOrders.orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">Order #{order.orderNumber}</h4>
                        <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                        <p className="text-sm text-gray-600">{order.itemCount} items</p>
                        <p className="text-sm text-gray-600">
                          Estimated Delivery: {formatDate(order.estimatedDelivery)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(order.totalPrice)}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <div className="mt-2">
                          <button
                            onClick={() => loadOrderTracking(order.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Track Order
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {activeOrders.orders.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No active orders found.</p>
                )}
              </div>
            </PastelCard>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <PastelCard className="bg-gradient-to-r from-green-50 to-emerald-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Management</h3>
              <div className="space-y-4">
                <Link
                  to="/customer/edit-profile"
                  className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700"
                >
                  Edit Profile Information
                </Link>
                <Link
                  to="/customer/edit-customer"
                  className="block w-full px-4 py-3 bg-green-600 text-white rounded-lg text-center hover:bg-green-700"
                >
                  Manage Account Settings
                </Link>
                <Link
                  to="/addresses"
                  className="block w-full px-4 py-3 bg-purple-600 text-white rounded-lg text-center hover:bg-purple-700"
                >
                  Manage Addresses
                </Link>
              </div>
            </PastelCard>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Account;

