import React, { useEffect, useState } from 'react';
import { StatCard, LegendLabel, TimeRangeSelector } from '../../components/admin/insights';
import {
  fetchAOV,
  fetchRevenueOverTime,
  fetchNewCustomersOverTime,
  fetchRepeatVsOneTimeCustomers,
  fetchAbandonedCartMetrics,
  fetchTopCustomers,
  fetchOrdersByStatus
} from '../../api/stats';

const SummaryDashboard = () => {
  const [data, setData] = useState({});
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [aov, revenue, newCustomers, repeat, abandon, topCustomers, orders] = await Promise.all([
          fetchAOV(),
          fetchRevenueOverTime(),
          fetchNewCustomersOverTime(),
          fetchRepeatVsOneTimeCustomers(),
          fetchAbandonedCartMetrics(),
          fetchTopCustomers(),
          fetchOrdersByStatus()
        ]);

        // Debug logging to see what we're getting
        console.log('Orders response:', orders);
        console.log('Orders data:', orders.data?.data);

        // Calculate totals based on time range
        const daysToInclude = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        
        // Safely calculate total orders
        const ordersData = orders.data?.data;
        let totalOrders = 0;
        if (ordersData && typeof ordersData === 'object') {
          totalOrders = Object.values(ordersData).reduce((sum, c) => {
            const num = typeof c === 'number' ? c : parseInt(c) || 0;
            return sum + num;
          }, 0);
        }
        
        // Safely extract and validate all data
        const aovValue = parseFloat(aov.data?.data?.averageOrderValue) || 0;
        
        const revenueData = revenue.data?.data;
        const revenueValue = Array.isArray(revenueData) 
          ? revenueData.slice(-daysToInclude).reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0)
          : 0;
        
        const newCustomersData = newCustomers.data?.data;
        const newCustomersValue = Array.isArray(newCustomersData)
          ? newCustomersData.slice(-daysToInclude).reduce((sum, c) => sum + (parseInt(c.count) || 0), 0)
          : 0;
        
        const repeatData = repeat.data?.data;
        const repeatRateValue = repeatData && repeatData.repeat && repeatData.oneTime
          ? Math.round((repeatData.repeat / (repeatData.repeat + repeatData.oneTime)) * 100)
          : 0;
        
        const abandonRateValue = parseFloat(abandon.data?.data?.abandonmentRate) || 0;
        
        const topCustomerData = topCustomers.data?.data?.[0] || {};
        
        setData({
          aov: aovValue,
          revenue: revenueValue,
          newCustomers: newCustomersValue,
          repeatRate: repeatRateValue,
          abandonRate: abandonRateValue,
          topCustomer: topCustomerData,
          totalOrders: totalOrders
        });
      } catch (error) {
        console.error('Error loading summary data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading executive summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📊 Executive Summary</h1>
          <p className="text-gray-600 mt-1">Key performance indicators for business leaders</p>
        </div>
        <TimeRangeSelector 
          value={timeRange} 
          onChange={setTimeRange}
          label="Time Period"
        />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard 
          title={
            <LegendLabel 
              term="Total Revenue" 
              tooltip={`Total revenue generated in the last ${timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}.`} 
            />
          } 
          value={`$${data.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          color="blue"
          icon="💰"
        />
        
        <StatCard 
          title={
            <LegendLabel 
              term="Total Orders" 
              tooltip="Total number of orders processed." 
            />
          } 
          value={data.totalOrders.toLocaleString()} 
          color="purple"
          icon="📦"
        />
        
        <StatCard 
          title={
            <LegendLabel 
              term="New Customers" 
              tooltip={`Customers acquired in the last ${timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}.`} 
            />
          } 
          value={data.newCustomers.toLocaleString()} 
          color="green"
          icon="🆕"
        />
        
        <StatCard 
          title={
            <LegendLabel 
              term="Repeat Purchase Rate" 
              tooltip="Percentage of customers who ordered more than once." 
            />
          } 
          value={`${data.repeatRate}%`} 
          color="yellow"
          icon="🔄"
        />
        
        <StatCard 
          title={
            <LegendLabel 
              term="Average Order Value" 
              tooltip="Average dollar amount spent per order." 
            />
          } 
          value={`$${data.aov.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          color="pink"
          icon="📊"
        />
        
        <StatCard 
          title={
            <LegendLabel 
              term="Cart Abandonment Rate" 
              tooltip="Percentage of customers who left without completing checkout." 
            />
          } 
          value={`${data.abandonRate}%`} 
          color="red"
          icon="🛒"
        />
        
        <StatCard 
          title={
            <LegendLabel 
              term="Top Customer" 
              tooltip="Customer with the highest total purchases." 
            />
          } 
          value={data.topCustomer?.name || 'N/A'} 
          subtitle={data.topCustomer?.name ? `$${data.topCustomer?.totalSpent?.toLocaleString() || 0}` : ''}
          color="indigo"
          icon="👑"
        />
        
        <StatCard 
          title={
            <LegendLabel 
              term="Conversion Rate" 
              tooltip="Percentage of visitors who completed a purchase." 
            />
          } 
          value={`${data.totalOrders > 0 ? Math.round((data.totalOrders / (data.totalOrders + (data.totalOrders * data.abandonRate / 100))) * 100) : 0}%`} 
          color="teal"
          icon="🎯"
        />
      </div>

      {/* Quick Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">💡 Quick Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span className="text-gray-700">
              {data.revenue > 0 ? `Revenue per day: $${(data.revenue / (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90)).toFixed(2)}` : 'No revenue data'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-gray-700">
              {data.newCustomers > 0 ? `New customers per day: ${(data.newCustomers / (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90)).toFixed(1)}` : 'No new customers'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span className="text-gray-700">
              {data.totalOrders > 0 ? `Orders per day: ${(data.totalOrders / (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90)).toFixed(1)}` : 'No orders'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryDashboard; 