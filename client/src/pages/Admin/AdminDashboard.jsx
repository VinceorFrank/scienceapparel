import React, { useState, useEffect } from "react";
import DashboardMetrics from "../../components/DashboardMetrics";
import SalesChart from "./components/SalesChart";
import { useQuery } from '@tanstack/react-query';
import { fetchRecentOrders, fetchStockAlerts, fetchCustomerActivity } from '../../api/dashboard';
import api from '../../api/config';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics.js';
import { useProductManagement } from '../../hooks/useProductManagement.jsx';
import useUserManagement from '../../hooks/useUserManagement.js';
import useOrderManagement from '../../hooks/useOrderManagement.js';

const AdminDashboard = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { handleCreate } = useProductManagement();
  const dashboardMetrics = useDashboardMetrics();

  // Fetch data with real-time updates
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['recentOrders'],
    queryFn: fetchRecentOrders,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: stockAlerts, isLoading: stockLoading } = useQuery({
    queryKey: ['stockAlerts'],
    queryFn: fetchStockAlerts,
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: customerActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['customerActivity'],
    queryFn: fetchCustomerActivity,
    refetchInterval: 120000, // Refetch every 2 minutes
  });

  // Auto-refresh timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refetch all data
      await Promise.all([
        fetchRecentOrders(),
        fetchStockAlerts(),
        fetchCustomerActivity()
      ]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const quickActions = [
    {
      title: "Add Product",
      icon: "➕",
      action: () => window.location.href = '/admin/products',
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "View Orders",
      icon: "📦",
      action: () => window.location.href = '/admin/orders',
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Manage Users",
      icon: "👥",
      action: () => window.location.href = '/admin/users',
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "Categories",
      icon: "🏷️",
      action: () => window.location.href = '/admin/categories',
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with refresh button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
            >
              <span>{isRefreshing ? "🔄" : "🔄"}</span>
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`${action.color} text-white p-4 rounded-lg shadow hover:shadow-lg transition-all duration-200 flex flex-col items-center space-y-2`}
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="font-medium">{action.title}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Dashboard Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Overview</h2>
          <DashboardMetrics />
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <div className="lg:col-span-2">
            <SalesChart />
          </div>
          
          {/* Recent Orders */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Orders</h2>
            {ordersLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.slice(0, 5).map((order) => (
                  <div key={order._id} className="border-b pb-3 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">#{order._id.slice(-6)}</p>
                        <p className="text-sm text-gray-500">{order.user?.name || 'Unknown'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">${order.totalPrice}</p>
                        <p className={`text-xs px-2 py-1 rounded-full ${
                          order.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.isPaid ? 'Paid' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent orders</p>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Stock Alerts */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Stock Alerts</h2>
            {stockLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : stockAlerts && stockAlerts.length > 0 ? (
              <div className="space-y-3">
                {stockAlerts.slice(0, 5).map((product) => (
                  <div key={product._id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                    </div>
                    <span className="text-red-600 font-medium">Low Stock</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No stock alerts</p>
            )}
          </div>

          {/* Customer Activity */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Customer Activity</h2>
            {activityLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : customerActivity && customerActivity.length > 0 ? (
              <div className="space-y-3">
                {customerActivity.slice(0, 5).map((customer) => (
                  <div key={customer._id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{customer.userDetails.name}</p>
                      <p className="text-sm text-gray-500">{customer.orderCount} orders</p>
                    </div>
                    <span className="text-blue-600 font-medium">${customer.totalSpent}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 