import React from 'react';

const LegendLabel = ({ term, tooltip, color = 'gray', className = '' }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    gray: 'text-gray-700',
  };

  return (
    <span 
      className={`text-sm font-medium ${colorClasses[color]} ${className}`}
      title={tooltip}
      style={{ cursor: tooltip ? 'help' : 'default' }}
    >
      {term}
      {tooltip && (
        <span className="ml-1 text-gray-400" title={tooltip}>
          ℹ
        </span>
      )}
    </span>
  );
};

export default LegendLabel; 