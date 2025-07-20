import React from 'react';

const StatCard = ({ title, value, icon, color = 'blue', trend = null, subtitle = null }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  const trendIcon = trend > 0 ? '↗' : trend < 0 ? '↘' : null;
  const trendColor = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500';

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-2">
        {icon && <span className="text-xl">{icon}</span>}
        {trend !== null && (
          <span className={`text-sm font-medium ${trendColor}`}>
            {trendIcon} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm font-medium">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
};

export default StatCard; 