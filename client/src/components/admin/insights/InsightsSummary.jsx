import React from 'react';
import StatCard from './StatCard';

const InsightsSummary = ({ data, timeRange = '30' }) => {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-100 p-4 rounded-lg animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${data.totalRevenue?.toLocaleString() || '0'}`,
      icon: '💰',
      color: 'green',
      trend: data.revenueTrend || null,
      subtitle: `Last ${timeRange} days`
    },
    {
      title: 'Total Orders',
      value: data.totalOrders?.toLocaleString() || '0',
      icon: '📦',
      color: 'blue',
      trend: data.ordersTrend || null,
      subtitle: `Last ${timeRange} days`
    },
    {
      title: 'New Customers',
      value: data.newCustomers?.toLocaleString() || '0',
      icon: '👥',
      color: 'purple',
      trend: data.customersTrend || null,
      subtitle: `Last ${timeRange} days`
    },
    {
      title: 'Average Order Value',
      value: `$${data.averageOrderValue?.toFixed(2) || '0.00'}`,
      icon: '📊',
      color: 'yellow',
      trend: data.aovTrend || null,
      subtitle: `Last ${timeRange} days`
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Summary Dashboard</h2>
        <div className="text-sm text-gray-500">
          Key metrics for the last {timeRange} days
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
            subtitle={stat.subtitle}
          />
        ))}
      </div>
    </div>
  );
};

export default InsightsSummary; 