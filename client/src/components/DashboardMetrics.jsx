import React from 'react';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';

const DashboardMetrics = () => {
  const { data, isLoading, error, refetch } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg shadow">
        <p className="text-red-600">Error loading metrics: {error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Sales */}
      <MetricCard
        title="Total Sales"
        value={`$${data?.totalSales?.toFixed(2) || '0.00'}`}
        icon="💰"
      />

      {/* Total Orders */}
      <MetricCard
        title="Total Orders"
        value={data?.totalOrders || 0}
        icon="📦"
      />

      {/* Active Users */}
      <MetricCard
        title="Active Users"
        value={data?.activeUsers || 0}
        icon="👥"
      />

      {/* Pending Orders */}
      <MetricCard
        title="Pending Orders"
        value={data?.pendingOrders || 0}
        icon="⏳"
      />

      {/* Low Stock Items */}
      <MetricCard
        title="Low Stock Items"
        value={data?.lowStockItems || 0}
        icon="⚠️"
      />

      {/* Recent Registrations */}
      <MetricCard
        title="Recent Registrations"
        value={data?.recentRegistrations || 0}
        icon="📝"
      />

      {/* Average Order Value */}
      <MetricCard
        title="Average Order Value"
        value={`$${data?.averageOrderValue?.toFixed(2) || '0.00'}`}
        icon="📊"
      />

      {/* Return Rate */}
      <MetricCard
        title="Return Rate"
        value={`${data?.returnRate?.toFixed(1) || '0'}%`}
        icon="↩️"
      />
    </div>
  );
};

const MetricCard = ({ title, value, icon }) => (
  <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <span className="text-2xl">{icon}</span>
    </div>
    <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
  </div>
);

export default DashboardMetrics; 