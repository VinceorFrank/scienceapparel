import React from 'react';

const ChartContainer = ({ 
  children, 
  title, 
  subtitle, 
  height = '400px', 
  className = '',
  showExport = false,
  exportData = null,
  exportFilename = 'chart-data.csv'
}) => {
  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h4 className="text-lg font-semibold text-gray-800">{title}</h4>}
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      
      <div className="relative" style={{ height }}>
        {children}
      </div>
      
      {showExport && exportData && (
        <div className="mt-3 flex justify-end">
          <ExportButton 
            data={exportData} 
            filename={exportFilename}
            label="Export Data"
          />
        </div>
      )}
    </div>
  );
};

// Import ExportButton for the export functionality
import ExportButton from './ExportButton';

export default ChartContainer; 