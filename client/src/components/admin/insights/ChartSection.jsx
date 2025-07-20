import React from 'react';

const ChartSection = ({ id, title, subtitle, children, icon, isCollapsed = false, onToggle }) => (
  <div id={id} className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-6">
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        </div>
        {onToggle && (
          <button
            onClick={onToggle}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        )}
      </div>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {!isCollapsed && children}
  </div>
);

export default ChartSection; 