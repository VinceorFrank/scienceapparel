import React from 'react';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { GiMoneyStack, GiAlienSkull, GiReturnArrow, GiHandTruck, GiHeartburn, GiAnatomy } from 'react-icons/gi';
import { ImWarning } from 'react-icons/im';
import { PiChartLineUpBold } from 'react-icons/pi';

const DashboardMetrics = () => {
  const { data, isLoading, error, refetch } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg shadow border border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-600 font-medium">Error loading metrics</p>
            <p className="text-red-500 text-sm">{error.message}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Sales",
      value: `$${data?.totalSales?.toFixed(2) || '0.00'}`,
      icon: <GiMoneyStack style={{ color: '#2ecc40', fontSize: '2.5rem' }} />,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "+12.5%",
      trendColor: "text-green-600"
    },
    {
      title: "Total Orders",
      value: data?.totalOrders || 0,
      icon: <span style={{ fontSize: '2.5rem' }}>📦</span>,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "+8.2%",
      trendColor: "text-blue-600"
    },
    {
      title: "Active Users",
      value: data?.activeUsers || 0,
      icon: <span style={{ fontSize: '2.5rem' }}>👽</span>,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: "+15.3%",
      trendColor: "text-purple-600"
    },
    {
      title: "Pending Orders",
      value: data?.pendingOrders || 0,
      icon: <span style={{ fontSize: '2.5rem' }}>⏳</span>,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      trend: "-5.1%",
      trendColor: "text-green-600"
    },
    {
      title: "Low Stock",
      value: data?.lowStock || 0,
      icon: (
        <GiHandTruck
          style={{
            color: (data?.lowStock > 0) ? '#FF2400' : '#2ecc40',
            fontSize: '2.5rem',
          }}
        />
      ),
      color: (data?.lowStock > 0) ? "text-red-600" : "text-green-600",
      bgColor: (data?.lowStock > 0) ? "bg-red-50" : "bg-green-50",
      trend: data?.lowStockItems > 0 ? "Action needed" : "All good",
      trendColor: data?.lowStockItems > 0 ? "text-red-600" : "text-green-600"
    },
    {
      title: "Recent Registrations",
      value: data?.recentRegistrations || 0,
      icon: <GiAnatomy className="pulse" style={{ color: '#FF69B4', fontSize: '2.5rem' }} />,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      trend: "+22.1%",
      trendColor: "text-indigo-600"
    },
    {
      title: "Average Order Value",
      value: `$${data?.averageOrderValue?.toFixed(2) || '0.00'}`,
      icon: <PiChartLineUpBold style={{ color: 'black', fontSize: '2.5rem' }} />,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      trend: "+3.7%",
      trendColor: "text-teal-600"
    },
    {
      title: "Return Rate",
      value: `${data?.returnRate?.toFixed(1) || '0'}%`,
      icon: <GiReturnArrow style={{ color: '#FF2400', fontSize: '2.5rem' }} />,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: data?.returnRate > 5 ? "High" : "Low",
      trendColor: data?.returnRate > 5 ? "text-red-600" : "text-green-600"
    },
    {
      title: "Alerts",
      value: data?.alerts || 0,
      icon: (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'black',
            borderRadius: '0.5rem',
            padding: '0.25rem',
          }}
        >
          <ImWarning style={{ color: '#FFFF00', fontSize: '2.5rem' }} />
        </span>
      ),
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      trend: data?.alerts > 0 ? "Action needed" : "All good",
      trendColor: data?.alerts > 0 ? "text-red-600" : "text-green-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};

const MetricCard = ({ title, value, icon, color, bgColor, trend, trendColor }) => (
  <div className={`${bgColor} p-6 rounded-lg shadow hover:shadow-lg transition-all duration-200 border border-gray-100`}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <div className={`p-2 rounded-lg ${bgColor.replace('50', '100')}`}>
        {icon}
      </div>
    </div>
    <div className="flex items-end justify-between">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <span className={`text-xs font-medium ${trendColor}`}>
        {trend}
      </span>
    </div>
  </div>
);

export default DashboardMetrics; 