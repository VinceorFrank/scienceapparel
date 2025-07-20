import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  UsersIcon, 
  ShoppingBagIcon, 
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  CogIcon,
  ArrowTrendingUpIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import DashboardMetrics from "../../components/DashboardMetrics";
import SalesChart from "./components/SalesChart";
import RevenueChart from './components/RevenueChart';
import InsightsCharts from './components/InsightsCharts';
import SummaryDashboard from './SummaryDashboard';
import { useQuery } from '@tanstack/react-query';
import { fetchRecentOrders, fetchStockAlerts, fetchCustomerActivity } from '../../api/dashboard';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics.js';
import { useProductManagement } from '../../hooks/useProductManagement.jsx';
import useUserManagement from '../../hooks/useUserManagement.js';
import useOrderManagement from '../../hooks/useOrderManagement.js';
import { useLang } from "../../utils/lang";
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
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
      title: 'Executive Summary',
      description: 'Key performance indicators for leaders',
      icon: ChartBarIcon,
      onClick: () => handleTabChange('summary')
    },
    {
      title: 'Add Product',
      description: 'Create a new product listing',
      icon: ShoppingBagIcon,
      link: '/admin/products',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'View Orders',
      description: 'Manage customer orders',
      icon: ShoppingCartIcon,
      link: '/admin/orders',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Customer Insights',
      description: 'Analyze customer behavior',
      icon: UserGroupIcon,
      link: '/admin/customer-insights',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Support Tickets',
      description: 'Handle customer support',
      icon: BellIcon,
      link: '/admin/support',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Newsletter',
      description: 'Manage email campaigns',
      icon: EnvelopeIcon,
      link: '/admin/newsletter',
      color: 'bg-pink-500 hover:bg-pink-600'
    },
    {
      title: 'Settings',
      description: 'Configure system settings',
      icon: CogIcon,
      link: '/admin/settings',
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  const tabs = [
    { id: 'overview', name: t('overview'), icon: ChartBarIcon },
    { id: 'summary', name: '📊 Executive Summary', icon: ChartBarIcon },
    { id: 'analytics', name: t('advancedAnalytics'), icon: ArrowTrendingUpIcon },
    { id: 'insights', name: t('businessInsights'), icon: DocumentTextIcon }
  ];

  const handleTabChange = (tabId) => {
    try {
      setActiveTab(tabId);
    } catch (err) {
      console.error('Error changing tab:', err);
      toast.error('Failed to switch tab. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Sales Over the Last 7 Days Chart (move to top) */}
        <SalesChart />
        {/* Revenue Over Time Chart (move to main content area) */}
        {/* Header with refresh button */}
        <div className="bg-gradient-to-br from-green-100 via-yellow-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 mb-8 border border-green-100">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-2 leading-tight" 
                   style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
                {t("dashboard")}
              </h1>
              <div className="w-24 h-1 rounded-full mb-4" 
                   style={{ background: 'linear-gradient(90deg, #FECFEF 0%, #A7F0BA 100%)' }} />
              <p className="text-lg text-slate-600">
                {t("lastUpdated")}: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-6 py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white rounded-2xl shadow-lg hover:from-pink-500 hover:to-pink-600 disabled:opacity-50 flex items-center space-x-3 font-bold transition-all duration-300 transform hover:scale-105 disabled:transform-none"
            >
              <span className="text-xl">{isRefreshing ? "🔄" : "🔄"}</span>
              <span>{isRefreshing ? t("refreshing") : t("refresh")}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-green-100 via-yellow-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-green-100">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
                  {t('quickActions')}
                </h2>
                <div className="w-24 h-1 mx-auto rounded-full mb-4" 
                     style={{ background: 'linear-gradient(90deg, #FECFEF 0%, #A7F0BA 100%)' }} />
                <p className="text-lg text-slate-600">{t('quickActionsDesc')}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quickActions.map((action) => (
                  action.onClick ? (
                    <button
                      key={action.title}
                      onClick={action.onClick}
                      className="group bg-gradient-to-br from-pink-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-pink-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                    >
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <action.icon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-700 mb-2" style={{ fontFamily: 'Fredoka One, cursive' }}>
                            {action.title}
                          </h3>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <Link
                      key={action.title}
                      to={action.link}
                      className="group bg-gradient-to-br from-pink-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-pink-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                    >
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <action.icon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-700 mb-2" style={{ fontFamily: 'Fredoka One, cursive' }}>
                            {action.title}
                          </h3>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <DashboardMetrics />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Analytics Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group bg-gradient-to-br from-green-100 via-yellow-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-green-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <ArrowTrendingUpIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-700 mb-1" style={{ fontFamily: 'Fredoka One, cursive' }}>
                      {t('conversionRate')}
                    </h3>
                    <p className="text-3xl font-bold text-blue-600 mb-2">2.4%</p>
                    <p className="text-sm text-slate-600">{t('fromLastMonth', { value: '+0.3%' })}</p>
                  </div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-green-100 via-yellow-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-green-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <CurrencyDollarIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-700 mb-1" style={{ fontFamily: 'Fredoka One, cursive' }}>
                      {t('customerCLV')}
                    </h3>
                    <p className="text-3xl font-bold text-green-600 mb-2">$127</p>
                    <p className="text-sm text-slate-600">{t('fromLastMonth', { value: '+$12' })}</p>
                  </div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-green-100 via-yellow-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-green-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <ExclamationTriangleIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-700 mb-1" style={{ fontFamily: 'Fredoka One, cursive' }}>
                      {t('abandonmentRate')}
                    </h3>
                    <p className="text-3xl font-bold text-purple-600 mb-2">18.2%</p>
                    <p className="text-sm text-slate-600">{t('fromLastMonth', { value: '-2.1%' })}</p>
                  </div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-green-100 via-yellow-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-green-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <EnvelopeIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-700 mb-1" style={{ fontFamily: 'Fredoka One, cursive' }}>
                      {t('newsletterEngagement')}
                    </h3>
                    <p className="text-3xl font-bold text-orange-600 mb-2">24.7%</p>
                    <p className="text-sm text-slate-600">{t('fromLastMonth', { value: '+3.2%' })}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Analytics Charts */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{t('advancedAnalytics')}</h2>
                <p className="text-sm text-gray-600">{t('comprehensiveMetrics')}</p>
              </div>
              <div className="p-6">
                <InsightsCharts />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg border border-gray-100">
              <SummaryDashboard />
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            {/* Business Insights */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{t('businessInsights')}</h2>
                <p className="text-sm text-gray-600">{t('actionableRecommendations')}</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Revenue Insights */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">{t('revenueInsights')}</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li>• {t('topProductsRevenue')}</li>
                      <li>• {t('weekendSalesHigher')}</li>
                      <li>• {t('averageOrderValueIncrease')}</li>
                      <li>• {t('repeatBuyersPercentage')}</li>
                    </ul>
                  </div>

                  {/* Customer Insights */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">{t('customerInsights')}</h3>
                    <ul className="space-y-2 text-sm text-green-800">
                      <li>• {t('customersFromUS')}</li>
                      <li>• {t('customerAcquisitionCost')}</li>
                      <li>• {t('customerSatisfactionRate')}</li>
                      <li>• {t('newsletterSubscribersPercentage')}</li>
                    </ul>
                  </div>

                  {/* Inventory Insights */}
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-orange-900 mb-2">{t('inventoryInsights')}</h3>
                    <ul className="space-y-2 text-sm text-orange-800">
                      <li>• {t('lowStockProducts')}</li>
                      <li>• {t('apparelHighestTurnover')}</li>
                      <li>• {t('seasonalProductsPeak')}</li>
                      <li>• {t('averageRestockTime')}</li>
                    </ul>
                  </div>

                  {/* Marketing Insights */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2">{t('marketingInsights')}</h3>
                    <ul className="space-y-2 text-sm text-purple-800">
                      <li>• {t('emailCampaignsOpenRate')}</li>
                      <li>• {t('socialMediaTraffic')}</li>
                      <li>• {t('cartAbandonmentRecovery')}</li>
                      <li>• {t('newsletterSubscribersSpendMore')}</li>
                    </ul>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-3">{t('recommendedActions')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-yellow-900">{t('optimizeCartRecovery')}</p>
                        <p className="text-xs text-yellow-800">{t('implementAbandonedCartEmails')}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-yellow-900">{t('restockLowInventory')}</p>
                        <p className="text-xs text-yellow-800">{t('productsNeedRestocking')}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-yellow-900">{t('enhanceNewsletterStrategy')}</p>
                        <p className="text-xs text-yellow-800">{t('focusWeekendCampaigns')}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-yellow-900">{t('targetRepeatCustomers')}</p>
                        <p className="text-xs text-yellow-800">{t('focusOnRetention')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 