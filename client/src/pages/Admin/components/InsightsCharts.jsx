import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { Disclosure } from '@headlessui/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Import reusable components
import {
  ChartSection,
  StatCard,
  ExportButton,
  TimeRangeSelector,
  LegendLabel,
  InsightsSummary
} from '../../../components/admin/insights';
import InsightsNavPanel from '../../../components/admin/insights/InsightsNavPanel';

import {
  fetchRevenueOverTime,
  fetchTopProducts,
  fetchOrdersByStatus,
  fetchNewCustomersOverTime,
  fetchRevenueByCategory,
  fetchAOV,
  fetchLowStockProducts,
  fetchRepeatVsOneTimeCustomers,
  fetchUsersByCountry,
  fetchCLV,
  fetchConversionRate,
  fetchAbandonedCartMetrics,
  fetchNewsletterAnalytics,
  fetchAdminActivityAnalytics,
  fetchSupportTicketStats,
  fetchTopCustomers,
  fetchRevenueByProduct,
  fetchOrderStatusOverTime
} from '../../../api/stats';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const InsightsCharts = () => {
  const [chartsData, setChartsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          revenueData,
          topProducts,
          ordersByStatus,
          newCustomers,
          revenueByCategory,
          aovData,
          lowStock,
          repeatCustomers,
          usersByCountry,
          clvData,
          conversionData,
          abandonedCartData,
          newsletterData,
          adminActivityData,
          supportTicketStats,
          topCustomers,
          revenueByProduct,
          orderStatusOverTime
        ] = await Promise.all([
          fetchRevenueOverTime(),
          fetchTopProducts(),
          fetchOrdersByStatus(),
          fetchNewCustomersOverTime(),
          fetchRevenueByCategory(),
          fetchAOV(),
          fetchLowStockProducts(),
          fetchRepeatVsOneTimeCustomers(),
          fetchUsersByCountry(),
          fetchCLV(),
          fetchConversionRate(timeRange),
          fetchAbandonedCartMetrics(timeRange),
          fetchNewsletterAnalytics(),
          fetchAdminActivityAnalytics(),
          fetchSupportTicketStats(),
          fetchTopCustomers(),
          fetchRevenueByProduct(),
          fetchOrderStatusOverTime()
        ]);

        setChartsData({
          revenue: revenueData.data || [],
          topProducts: topProducts.data || [],
          ordersByStatus: ordersByStatus.data || {},
          newCustomers: newCustomers.data || [],
          revenueByCategory: revenueByCategory.data || [],
          aov: aovData.data || {},
          lowStock: lowStock.data || [],
          repeatCustomers: repeatCustomers.data || {},
          usersByCountry: usersByCountry.data || {},
          clv: clvData.data || {},
          conversion: conversionData.data || {},
          abandonedCart: abandonedCartData.data || {},
          newsletter: newsletterData.data || {},
          adminActivity: adminActivityData.data || {},
          supportTicketStats: supportTicketStats.data || {},
          topCustomers: topCustomers.data || [],
          revenueByProduct: revenueByProduct.data || [],
          orderStatusOverTime: orderStatusOverTime.data || []
        });
      } catch (err) {
        console.error('Error fetching charts data:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [timeRange]);

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
  };

  const lineOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Summary data for the dashboard
  const summaryData = {
    totalRevenue: Array.isArray(chartsData.revenue) ? chartsData.revenue.reduce((sum, r) => sum + (r.total || 0), 0) : 0,
    totalOrders: Object.values(chartsData.ordersByStatus || {}).reduce((sum, c) => sum + (c || 0), 0),
    newCustomers: Array.isArray(chartsData.newCustomers) ? chartsData.newCustomers.slice(-30).reduce((sum, c) => sum + (c.count || 0), 0) : 0,
    averageOrderValue: chartsData.aov?.averageOrderValue || 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Navigation Panel */}
      <InsightsNavPanel />
      
      {/* Main Content */}
      <main className="flex-1 space-y-6">
        {/* Global Time Filter */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
          <TimeRangeSelector 
            value={timeRange} 
            onChange={setTimeRange}
            label="Time Period"
          />
        </div>

        {/* Summary Dashboard */}
        <section id="dashboard" className="scroll-mt-20">
          <InsightsSummary data={summaryData} timeRange={timeRange} />
        </section>

        {/* Sales Analytics Section */}
        <section id="sales" className="scroll-mt-20">
          <Disclosure defaultOpen>
            {({ open }) => (
              <>
                <Disclosure.Button className="flex w-full justify-between rounded-lg bg-blue-50 px-4 py-3 text-left text-lg font-medium text-blue-900 hover:bg-blue-100 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                  <span className="flex items-center gap-2">
                    📈 Sales Analytics
                    <LegendLabel 
                      term="Revenue & Order Performance" 
                      tooltip="Track your sales performance, revenue trends, and order statistics"
                    />
                  </span>
                  <span className="text-blue-500">
                    {open ? '▲' : '▼'}
                  </span>
                </Disclosure.Button>
                <Disclosure.Panel className="px-4 pb-2 pt-4 text-sm text-gray-500">
                  <div className="space-y-6">
                    {/* Revenue Over Time */}
                    <ChartSection 
                      title="Revenue Trends" 
                      subtitle="Track your revenue growth over time"
                      icon="💰"
                    >
                      <Line
                        data={{
                          labels: Array.isArray(chartsData.revenue) ? chartsData.revenue.map(r => r.date) : [],
                          datasets: [{
                            label: 'Revenue',
                            data: Array.isArray(chartsData.revenue) ? chartsData.revenue.map(r => r.total) : [],
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            fill: true,
                          }],
                        }}
                        options={lineOptions}
                      />
                      <ExportButton 
                        data={Array.isArray(chartsData.revenue) ? chartsData.revenue : []} 
                        filename="revenue-trends.csv"
                      />
                    </ChartSection>

                    {/* Order Status Distribution */}
                    <ChartSection 
                      title="Order Status Distribution" 
                      subtitle="Current status of all orders"
                      icon="📦"
                    >
                      <Doughnut
                        data={{
                          labels: Object.keys(chartsData.ordersByStatus || {}),
                          datasets: [{
                            data: Object.values(chartsData.ordersByStatus || {}),
                            backgroundColor: [
                              'rgba(34, 197, 94, 0.8)',
                              'rgba(59, 130, 246, 0.8)',
                              'rgba(251, 191, 36, 0.8)',
                              'rgba(239, 68, 68, 0.8)',
                            ],
                          }],
                        }}
                        options={chartOptions}
                      />
                      <ExportButton 
                        data={Object.entries(chartsData.ordersByStatus || {}).map(([status, count]) => ({ status, count }))} 
                        filename="order-status-distribution.csv"
                      />
                    </ChartSection>
                  </div>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        </section>

        {/* Customer Analytics Section */}
        <section id="customers" className="scroll-mt-20">
          <Disclosure defaultOpen>
            {({ open }) => (
              <>
                <Disclosure.Button className="flex w-full justify-between rounded-lg bg-green-50 px-4 py-3 text-left text-lg font-medium text-green-900 hover:bg-green-100 focus:outline-none focus-visible:ring focus-visible:ring-green-500 focus-visible:ring-opacity-75">
                  <span className="flex items-center gap-2">
                    👥 Customer Analytics
                    <LegendLabel 
                      term="Customer Behavior & Insights" 
                      tooltip="Understand your customer base, lifetime value, and geographic distribution"
                    />
                  </span>
                  <span className="text-green-500">
                    {open ? '▲' : '▼'}
                  </span>
                </Disclosure.Button>
                <Disclosure.Panel className="px-4 pb-2 pt-4 text-sm text-gray-500">
                  <div className="space-y-6">
                    {/* New Customers Over Time */}
                    <ChartSection 
                      title="New Customer Acquisition" 
                      subtitle="Track how many new customers you're gaining over time"
                      icon="🆕"
                    >
                      <Line
                        data={{
                          labels: Array.isArray(chartsData.newCustomers) ? chartsData.newCustomers.map(c => c.month) : [],
                          datasets: [{
                            label: 'New Customers',
                            data: Array.isArray(chartsData.newCustomers) ? chartsData.newCustomers.map(c => c.count) : [],
                            borderColor: 'rgb(168, 85, 247)',
                            backgroundColor: 'rgba(168, 85, 247, 0.1)',
                            fill: true,
                          }],
                        }}
                        options={lineOptions}
                      />
                      <ExportButton 
                        data={Array.isArray(chartsData.newCustomers) ? chartsData.newCustomers : []} 
                        filename="new-customers-over-time.csv"
                      />
                    </ChartSection>

                    {/* Customer Geographic Distribution */}
                    <ChartSection 
                      title="Customer Geographic Distribution" 
                      subtitle="Where your customers are located"
                      icon="🌍"
                    >
                      {Object.keys(chartsData.usersByCountry || {}).length > 5 ? (
                        <Bar
                          data={{
                            labels: Object.keys(chartsData.usersByCountry || {}),
                            datasets: [{
                              label: 'Customers',
                              data: Object.values(chartsData.usersByCountry || {}),
                              backgroundColor: 'rgba(59, 130, 246, 0.8)',
                            }],
                          }}
                          options={chartOptions}
                        />
                      ) : (
                        <Pie
                          data={{
                            labels: Object.keys(chartsData.usersByCountry || {}),
                            datasets: [{
                              data: Object.values(chartsData.usersByCountry || {}),
                              backgroundColor: [
                                'rgba(59, 130, 246, 0.8)',
                                'rgba(34, 197, 94, 0.8)',
                                'rgba(251, 191, 36, 0.8)',
                                'rgba(239, 68, 68, 0.8)',
                                'rgba(168, 85, 247, 0.8)',
                              ],
                            }],
                          }}
                          options={chartOptions}
                        />
                      )}
                      <ExportButton 
                        data={Object.entries(chartsData.usersByCountry || {}).map(([country, count]) => ({ country, count }))} 
                        filename="customer-geographic-distribution.csv"
                      />
                    </ChartSection>
                  </div>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        </section>

        {/* Product Analytics Section */}
        <section id="products" className="scroll-mt-20">
          <Disclosure>
            {({ open }) => (
              <>
                <Disclosure.Button className="flex w-full justify-between rounded-lg bg-purple-50 px-4 py-3 text-left text-lg font-medium text-purple-900 hover:bg-purple-100 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75">
                  <span className="flex items-center gap-2">
                    📦 Product Analytics
                    <LegendLabel 
                      term="Product Performance & Inventory" 
                      tooltip="Track your best-selling products, inventory levels, and product revenue"
                    />
                  </span>
                  <span className="text-purple-500">
                    {open ? '▲' : '▼'}
                  </span>
                </Disclosure.Button>
                <Disclosure.Panel className="px-4 pb-2 pt-4 text-sm text-gray-500">
                  <div className="space-y-6">
                    {/* Top-Selling Products */}
                    <ChartSection 
                      title="Best-Selling Products" 
                      subtitle="Products with the highest sales volume"
                      icon="🏆"
                    >
                      <Bar
                        data={{
                          labels: Array.isArray(chartsData.topProducts) ? chartsData.topProducts.map(p => p.name) : [],
                          datasets: [{
                            label: 'Units Sold',
                            data: Array.isArray(chartsData.topProducts) ? chartsData.topProducts.map(p => p.totalSold) : [],
                            backgroundColor: 'rgba(168, 85, 247, 0.8)',
                          }],
                        }}
                        options={chartOptions}
                      />
                      <ExportButton 
                        data={Array.isArray(chartsData.topProducts) ? chartsData.topProducts : []} 
                        filename="best-selling-products.csv"
                      />
                    </ChartSection>

                    {/* Low Stock Alert */}
                    <ChartSection 
                      title="Low Stock Products" 
                      subtitle="Products that need restocking"
                      icon="⚠️"
                    >
                      <Bar
                        data={{
                          labels: Array.isArray(chartsData.lowStock) ? chartsData.lowStock.map(p => p.name) : [],
                          datasets: [{
                            label: 'Stock Level',
                            data: Array.isArray(chartsData.lowStock) ? chartsData.lowStock.map(p => p.stock) : [],
                            backgroundColor: 'rgba(239, 68, 68, 0.8)',
                          }],
                        }}
                        options={chartOptions}
                      />
                      <ExportButton 
                        data={Array.isArray(chartsData.lowStock) ? chartsData.lowStock : []} 
                        filename="low-stock-products.csv"
                      />
                    </ChartSection>
                  </div>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        </section>

        {/* Engagement Analytics Section */}
        <section id="engagement" className="scroll-mt-20">
          <Disclosure>
            {({ open }) => (
              <>
                <Disclosure.Button className="flex w-full justify-between rounded-lg bg-yellow-50 px-4 py-3 text-left text-lg font-medium text-yellow-900 hover:bg-yellow-100 focus:outline-none focus-visible:ring focus-visible:ring-yellow-500 focus-visible:ring-opacity-75">
                  <span className="flex items-center gap-2">
                    📈 Engagement Analytics
                    <LegendLabel 
                      term="Conversion & User Engagement" 
                      tooltip="Track conversion rates, abandoned carts, newsletter performance, and admin activity"
                    />
                  </span>
                  <span className="text-yellow-500">
                    {open ? '▲' : '▼'}
                  </span>
                </Disclosure.Button>
                <Disclosure.Panel className="px-4 pb-2 pt-4 text-sm text-gray-500">
                  <div className="space-y-6">
                    {/* Conversion Rate Analytics */}
                    <ChartSection 
                      title="Conversion Rate Analytics" 
                      subtitle="How well you're converting visitors to customers"
                      icon="🎯"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <StatCard
                          title="Conversion Rate"
                          value={`${chartsData.conversion?.conversionRate || 0}%`}
                          color="blue"
                        />
                        <StatCard
                          title="Average Order Value"
                          value={`$${chartsData.conversion?.averageOrderValue || 0}`}
                          color="green"
                        />
                        <StatCard
                          title="Converting Customers"
                          value={chartsData.conversion?.uniqueCustomers?.toLocaleString() || '0'}
                          color="purple"
                        />
                      </div>
                      <Line
                        data={{
                          labels: Array.isArray(chartsData.conversion?.dailyConversions) ? chartsData.conversion.dailyConversions.map(d => d.date) : [],
                          datasets: [{
                            label: 'Daily Orders',
                            data: Array.isArray(chartsData.conversion?.dailyConversions) ? chartsData.conversion.dailyConversions.map(d => d.orders) : [],
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            fill: true,
                          }],
                        }}
                        options={lineOptions}
                      />
                      <ExportButton 
                        data={Array.isArray(chartsData.conversion?.dailyConversions) ? chartsData.conversion.dailyConversions : []} 
                        filename="conversion-rate-analytics.csv"
                      />
                    </ChartSection>

                    {/* Abandoned Cart Analytics */}
                    <ChartSection 
                      title="Abandoned Checkout Analytics" 
                      subtitle="Track cart abandonment and potential revenue loss"
                      icon="🛒"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <StatCard
                          title="Abandonment Rate"
                          value={`${chartsData.abandonedCart?.abandonmentRate || 0}%`}
                          color="red"
                        />
                        <StatCard
                          title="Potential Revenue Lost"
                          value={`$${chartsData.abandonedCart?.potentialRevenueLost || 0}`}
                          color="orange"
                        />
                        <StatCard
                          title="Abandoned Carts"
                          value={chartsData.abandonedCart?.abandonedCount?.toLocaleString() || '0'}
                          color="yellow"
                        />
                      </div>
                      <Bar
                        data={{
                          labels: Array.isArray(chartsData.abandonedCart?.abandonmentByCategory) ? chartsData.abandonedCart.abandonmentByCategory.map(c => c.category) : [],
                          datasets: [{
                            label: 'Abandoned Items',
                            data: Array.isArray(chartsData.abandonedCart?.abandonmentByCategory) ? chartsData.abandonedCart.abandonmentByCategory.map(c => c.abandonedCount) : [],
                            backgroundColor: 'rgba(239, 68, 68, 0.8)',
                          }],
                        }}
                        options={chartOptions}
                      />
                      <ExportButton 
                        data={Array.isArray(chartsData.abandonedCart?.abandonmentByCategory) ? chartsData.abandonedCart.abandonmentByCategory : []} 
                        filename="abandoned-cart-analytics.csv"
                      />
                    </ChartSection>
                  </div>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        </section>
      </main>
    </div>
  );
};

export default InsightsCharts; 