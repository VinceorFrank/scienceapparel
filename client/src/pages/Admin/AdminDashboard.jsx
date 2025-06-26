import React, { useState, useEffect } from "react";
import DashboardMetrics from "../../components/DashboardMetrics";
import SalesChart from "./components/SalesChart";
import { useQuery } from '@tanstack/react-query';
import { fetchRecentOrders, fetchStockAlerts, fetchCustomerActivity } from '../../api/dashboard';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics.js';
import { useProductManagement } from '../../hooks/useProductManagement.jsx';
import useUserManagement from '../../hooks/useUserManagement.js';
import useOrderManagement from '../../hooks/useOrderManagement.js';
import { useLang } from "../../utils/lang";

const AdminDashboard = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { handleCreate } = useProductManagement();
  const dashboardMetrics = useDashboardMetrics();
  const { t } = useLang();

  // Fetch data with real-time updates
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['recentOrders'],
    queryFn: fetchRecentOrders,
    refetchInterval: 30000,
  });

  const { data: stockAlerts, isLoading: stockLoading } = useQuery({
    queryKey: ['stockAlerts'],
    queryFn: fetchStockAlerts,
    refetchInterval: 60000,
  });

  const { data: customerActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['customerActivity'],
    queryFn: fetchCustomerActivity,
    refetchInterval: 120000,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
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
      title: t("addProduct"),
      icon: "➕",
      action: () => window.location.href = '/admin/products',
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: t("orders"),
      icon: "📦",
      action: () => window.location.href = '/admin/orders',
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: t("users"),
      icon: "👽",
      action: () => window.location.href = '/admin/users',
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: t("categories"),
      icon: "🏷️",
      action: () => window.location.href = '/admin/categories',
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FCFAF6] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with refresh button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold mb-1" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>{t("dashboard")}</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-500">
              {t("lastUpdated")}: {lastUpdate.toLocaleTimeString()}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 bg-pink-300 text-white rounded-full shadow hover:bg-pink-400 disabled:opacity-50 flex items-center space-x-2 font-bold transition"
            >
              <span>{isRefreshing ? "🔄" : "🔄"}</span>
              <span>{isRefreshing ? t("refreshing") : t("refresh")}</span>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>{t("quickActions")}</h2>
          <div className="w-24 h-1 mb-6 rounded-full" style={{ background: 'linear-gradient(90deg, #FECFEF 0%, #A7F0BA 100%)' }} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`bg-gradient-to-br from-pink-100 via-blue-100 to-white text-blue-700 p-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-200 flex flex-col items-center space-y-2 border border-pink-100 font-semibold`}
              >
                <span className="text-3xl">{action.icon}</span>
                <span className="font-bold" style={{ fontFamily: 'Fredoka One, cursive' }}>{action.title}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Dashboard Metrics */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>{t("overview")}</h2>
          <div className="w-24 h-1 mb-6 rounded-full" style={{ background: 'linear-gradient(90deg, #FECFEF 0%, #A7F0BA 100%)' }} />
          <DashboardMetrics />
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sales Chart */}
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-100 via-pink-100 to-white rounded-3xl shadow-lg p-6 border border-blue-100">
            <SalesChart />
          </div>
          
          {/* Recent Orders */}
          <div className="bg-gradient-to-br from-pink-100 via-blue-100 to-white p-6 rounded-3xl shadow-lg border border-pink-100">
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>{t("recentOrders")}</h2>
            <div className="w-16 h-1 mb-4 rounded-full" style={{ background: 'linear-gradient(90deg, #FECFEF 0%, #A7F0BA 100%)' }} />
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
                        <p className="text-sm text-gray-500">{order.user?.name || t("unknown")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">${order.totalPrice}</p>
                        <p className={`text-xs px-2 py-1 rounded-full ${
                          order.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.isPaid ? t("paid") : t("pending")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">{t("noRecentOrders")}</p>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Stock Alerts */}
          <div className="bg-gradient-to-br from-pink-100 via-blue-100 to-white p-6 rounded-3xl shadow-lg border border-pink-100">
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>{t("stockAlerts")}</h2>
            <div className="w-16 h-1 mb-4 rounded-full" style={{ background: 'linear-gradient(90deg, #FECFEF 0%, #A7F0BA 100%)' }} />
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
                      <p className="text-sm text-gray-500">{t("stock")}: {product.stock}</p>
                    </div>
                    <span className="text-red-600 font-medium">{t("lowStock")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">{t("noStockAlerts")}</p>
            )}
          </div>

          {/* Customer Activity */}
          <div className="bg-gradient-to-br from-pink-100 via-blue-100 to-white p-6 rounded-3xl shadow-lg border border-pink-100">
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>{t("customerActivity")}</h2>
            <div className="w-16 h-1 mb-4 rounded-full" style={{ background: 'linear-gradient(90deg, #FECFEF 0%, #A7F0BA 100%)' }} />
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
                      <p className="text-sm text-gray-500">{customer.orderCount} {t("orders")}</p>
                    </div>
                    <span className="text-blue-600 font-medium">${customer.totalSpent}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">{t("noRecentActivity")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 