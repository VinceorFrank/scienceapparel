import React from 'react';

const ExportButton = ({ data, filename = 'report.csv', label = 'Export CSV', disabled = false }) => {
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      // Handle different data formats
      let exportData = data;
      
      // If data is an object with arrays, flatten it
      if (typeof data === 'object' && !Array.isArray(data)) {
        exportData = Object.entries(data).map(([key, value]) => ({
          metric: key,
          value: Array.isArray(value) ? value.length : value
        }));
      }

      // Ensure we have an array of objects
      if (!Array.isArray(exportData)) {
        console.error('Data must be an array for CSV export');
        return;
      }

      // Get headers from first object
      const headers = Object.keys(exportData[0]);
      
      // Create CSV content
      const csv = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header];
            // Handle special characters and wrap in quotes if needed
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <button
      onClick={exportToCSV}
      disabled={disabled || !data || data.length === 0}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        disabled 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
          : 'bg-gray-200 hover:bg-gray-300 text-gray-800 hover:text-gray-900'
      }`}
      title={disabled ? 'No data to export' : 'Download as CSV file'}
    >
      📊 {label}
    </button>
  );
};

export default ExportButton; 