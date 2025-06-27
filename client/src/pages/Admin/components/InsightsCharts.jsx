import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
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
          fetchConversionRate(),
          fetchAbandonedCartMetrics(),
          fetchNewsletterAnalytics(),
          fetchAdminActivityAnalytics(),
          fetchSupportTicketStats(),
          fetchTopCustomers(),
          fetchRevenueByProduct(),
          fetchOrderStatusOverTime()
        ]);

        setChartsData({
          revenue: revenueData.data,
          topProducts: topProducts.data,
          ordersByStatus: ordersByStatus.data,
          newCustomers: newCustomers.data,
          revenueByCategory: revenueByCategory.data,
          aov: aovData.data,
          lowStock: lowStock.data,
          repeatCustomers: repeatCustomers.data,
          usersByCountry: usersByCountry.data,
          clv: clvData.data,
          conversion: conversionData.data,
          abandonedCart: abandonedCartData.data,
          newsletter: newsletterData.data,
          adminActivity: adminActivityData.data,
          supportTicketStats: supportTicketStats.data,
          topCustomers: topCustomers.data,
          revenueByProduct: revenueByProduct.data,
          orderStatusOverTime: orderStatusOverTime.data
        });
      } catch (err) {
        console.error('Error fetching charts data:', err);
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Analytics</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const lineOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      filler: {
        propagate: false,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Revenue Over Time */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
        <Line
          data={{
            labels: chartsData.revenue?.map(r => r.month) || [],
            datasets: [{
              label: 'Revenue',
              data: chartsData.revenue?.map(r => r.total) || [],
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
            }],
          }}
          options={lineOptions}
        />
      </div>

      {/* Sales Over Last 7 Days */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Sales Over Last 7 Days</h3>
        <Bar
          data={{
            labels: chartsData.revenue?.slice(-7).map(r => r.month) || [],
            datasets: [{
              label: 'Sales',
              data: chartsData.revenue?.slice(-7).map(r => r.total) || [],
              backgroundColor: 'rgba(34, 197, 94, 0.8)',
            }],
          }}
          options={chartOptions}
        />
      </div>

      {/* Top-Selling Products */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Top-Selling Products</h3>
        <Bar
          data={{
            labels: chartsData.topProducts?.map(p => p.name) || [],
            datasets: [{
              label: 'Units Sold',
              data: chartsData.topProducts?.map(p => p.totalSold) || [],
              backgroundColor: 'rgba(168, 85, 247, 0.8)',
            }],
          }}
          options={chartOptions}
        />
      </div>

      {/* Orders by Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
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
      </div>

      {/* New Customers Over Time */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">New Customers Over Time</h3>
        <Line
          data={{
            labels: chartsData.newCustomers?.map(c => c.month) || [],
            datasets: [{
              label: 'New Customers',
              data: chartsData.newCustomers?.map(c => c.count) || [],
              borderColor: 'rgb(168, 85, 247)',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              fill: true,
            }],
          }}
          options={lineOptions}
        />
      </div>

      {/* Revenue by Category */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Revenue by Category</h3>
        <Pie
          data={{
            labels: chartsData.revenueByCategory?.map(r => r.category) || [],
            datasets: [{
              data: chartsData.revenueByCategory?.map(r => r.total) || [],
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
      </div>

      {/* Conversion Rate Analytics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Conversion Rate Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {chartsData.conversion?.conversionRate || 0}%
            </div>
            <div className="text-sm text-gray-600">Conversion Rate</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              ${chartsData.conversion?.averageOrderValue || 0}
            </div>
            <div className="text-sm text-gray-600">Average Order Value</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {chartsData.conversion?.uniqueCustomers || 0}
            </div>
            <div className="text-sm text-gray-600">Converting Customers</div>
          </div>
        </div>
        <Line
          data={{
            labels: chartsData.conversion?.dailyConversions?.map(d => d.date) || [],
            datasets: [{
              label: 'Daily Orders',
              data: chartsData.conversion?.dailyConversions?.map(d => d.orders) || [],
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
            }],
          }}
          options={lineOptions}
        />
      </div>

      {/* Abandoned Cart Metrics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Abandoned Cart Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {chartsData.abandonedCart?.abandonmentRate || 0}%
            </div>
            <div className="text-sm text-gray-600">Abandonment Rate</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              ${chartsData.abandonedCart?.potentialRevenueLost || 0}
            </div>
            <div className="text-sm text-gray-600">Potential Revenue Lost</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {chartsData.abandonedCart?.abandonedCount || 0}
            </div>
            <div className="text-sm text-gray-600">Abandoned Carts</div>
          </div>
        </div>
        <Bar
          data={{
            labels: chartsData.abandonedCart?.abandonmentByCategory?.map(c => c.category) || [],
            datasets: [{
              label: 'Abandoned Items',
              data: chartsData.abandonedCart?.abandonmentByCategory?.map(c => c.abandonedCount) || [],
              backgroundColor: 'rgba(239, 68, 68, 0.8)',
            }],
          }}
          options={chartOptions}
        />
      </div>

      {/* Newsletter Analytics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Newsletter Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {chartsData.newsletter?.totalSubscribers || 0}
            </div>
            <div className="text-sm text-gray-600">Total Subscribers</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {chartsData.newsletter?.successRate || 0}%
            </div>
            <div className="text-sm text-gray-600">Campaign Success Rate</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {chartsData.newsletter?.totalCampaigns || 0}
            </div>
            <div className="text-sm text-gray-600">Total Campaigns</div>
          </div>
        </div>
        <Line
          data={{
            labels: chartsData.newsletter?.subscriberGrowth?.map(s => s._id) || [],
            datasets: [{
              label: 'New Subscribers',
              data: chartsData.newsletter?.subscriberGrowth?.map(s => s.newSubscribers) || [],
              borderColor: 'rgb(168, 85, 247)',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              fill: true,
            }],
          }}
          options={lineOptions}
        />
      </div>

      {/* Admin Activity Analytics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Admin Activity Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-md font-medium mb-3">Activity by Type</h4>
            <Bar
              data={{
                labels: chartsData.adminActivity?.activityByType?.map(a => a._id) || [],
                datasets: [{
                  label: 'Activity Count',
                  data: chartsData.adminActivity?.activityByType?.map(a => a.count) || [],
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                }],
              }}
              options={chartOptions}
            />
          </div>
          <div>
            <h4 className="text-md font-medium mb-3">Activity Over Time</h4>
            <Line
              data={{
                labels: chartsData.adminActivity?.activityOverTime?.map(a => a._id) || [],
                datasets: [{
                  label: 'Daily Activities',
                  data: chartsData.adminActivity?.activityOverTime?.map(a => a.activities) || [],
                  borderColor: 'rgb(34, 197, 94)',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  fill: true,
                }],
              }}
              options={lineOptions}
            />
          </div>
        </div>
      </div>

      {/* Customer Lifetime Value */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Customer Lifetime Value Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              ${chartsData.clv?.averageCLV || 0}
            </div>
            <div className="text-sm text-gray-600">Average CLV</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {chartsData.clv?.uniqueCustomers || 0}
            </div>
            <div className="text-sm text-gray-600">Total Customers</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              ${chartsData.clv?.totalRevenue || 0}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CLV
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chartsData.clv?.customerCLV?.slice(0, 10).map((customer, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.customerEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${customer.clv.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.orderCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Products */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Low Stock Alert</h3>
        <Bar
          data={{
            labels: chartsData.lowStock?.map(p => p.name) || [],
            datasets: [{
              label: 'Stock Level',
              data: chartsData.lowStock?.map(p => p.stock) || [],
              backgroundColor: 'rgba(239, 68, 68, 0.8)',
            }],
          }}
          options={chartOptions}
        />
      </div>

      {/* Repeat vs One-Time Customers */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Customer Loyalty Analysis</h3>
        <Doughnut
          data={{
            labels: ['Repeat Customers', 'One-Time Customers'],
            datasets: [{
              data: [
                chartsData.repeatCustomers?.repeat || 0,
                chartsData.repeatCustomers?.oneTime || 0,
              ],
              backgroundColor: [
                'rgba(34, 197, 94, 0.8)',
                'rgba(251, 191, 36, 0.8)',
              ],
            }],
          }}
          options={chartOptions}
        />
      </div>

      {/* Users by Country */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Customer Geographic Distribution</h3>
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
      </div>

      {/* Support Ticket Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Support Ticket Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{chartsData.supportTicketStats?.resolved || 0}</div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{chartsData.supportTicketStats?.unresolved || 0}</div>
            <div className="text-sm text-gray-600">Unresolved</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{chartsData.supportTicketStats?.avgResponseTime || 0}h</div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>
        </div>
        <Doughnut
          data={{
            labels: ['Resolved', 'Unresolved'],
            datasets: [{
              data: [chartsData.supportTicketStats?.resolved || 0, chartsData.supportTicketStats?.unresolved || 0],
              backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(239,68,68,0.8)'],
            }],
          }}
          options={chartOptions}
        />
      </div>

      {/* Top Customers by Orders/Spend */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
        <Bar
          data={{
            labels: chartsData.topCustomers?.map(c => c.name) || [],
            datasets: [
              {
                label: 'Orders',
                data: chartsData.topCustomers?.map(c => c.orderCount) || [],
                backgroundColor: 'rgba(59,130,246,0.8)',
              },
              {
                label: 'Total Spend',
                data: chartsData.topCustomers?.map(c => c.totalSpend) || [],
                backgroundColor: 'rgba(251,191,36,0.8)',
                yAxisID: 'y1',
              }
            ],
          }}
          options={{
            ...chartOptions,
            scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Orders' } },
              y1: { beginAtZero: true, position: 'right', title: { display: true, text: 'Total Spend ($)' }, grid: { drawOnChartArea: false } }
            },
            plugins: { tooltip: { mode: 'index', intersect: false } }
          }}
        />
      </div>

      {/* Revenue by Product */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Revenue by Product</h3>
        <Bar
          data={{
            labels: chartsData.revenueByProduct?.map(p => p.name) || [],
            datasets: [
              {
                label: 'Revenue',
                data: chartsData.revenueByProduct?.map(p => p.total) || [],
                backgroundColor: 'rgba(34,197,94,0.8)',
              },
              {
                label: 'Units Sold',
                data: chartsData.revenueByProduct?.map(p => p.qty) || [],
                backgroundColor: 'rgba(59,130,246,0.5)',
                yAxisID: 'y1',
              }
            ],
          }}
          options={{
            ...chartOptions,
            scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Revenue ($)' } },
              y1: { beginAtZero: true, position: 'right', title: { display: true, text: 'Units Sold' }, grid: { drawOnChartArea: false } }
            },
            plugins: { tooltip: { mode: 'index', intersect: false } }
          }}
        />
      </div>

      {/* Order Status Over Time (Stacked) */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Order Status Over Time</h3>
        <Bar
          data={{
            labels: chartsData.orderStatusOverTime?.map(m => m.month) || [],
            datasets: [
              {
                label: 'Pending',
                data: chartsData.orderStatusOverTime?.map(m => m.pending) || [],
                backgroundColor: 'rgba(251,191,36,0.8)',
              },
              {
                label: 'Paid',
                data: chartsData.orderStatusOverTime?.map(m => m.paid) || [],
                backgroundColor: 'rgba(59,130,246,0.8)',
              },
              {
                label: 'Delivered',
                data: chartsData.orderStatusOverTime?.map(m => m.delivered) || [],
                backgroundColor: 'rgba(34,197,94,0.8)',
              },
              {
                label: 'Cancelled',
                data: chartsData.orderStatusOverTime?.map(m => m.cancelled) || [],
                backgroundColor: 'rgba(239,68,68,0.8)',
              }
            ],
          }}
          options={{
            ...chartOptions,
            plugins: { tooltip: { mode: 'index', intersect: false } },
            responsive: true,
            scales: { x: { stacked: true }, y: { stacked: true } }
          }}
        />
      </div>
    </div>
  );
};

export default InsightsCharts; 