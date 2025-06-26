import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { toast } from 'react-toastify';

const ImportModal = ({ 
  isOpen, 
  onClose, 
  onImport, 
  title = 'Import Data', 
  dataType = 'products',
  sampleHeaders = [],
  validationRules = {}
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setPreview([]);

    // Parse CSV for preview
    Papa.parse(selectedFile, {
      header: true,
      preview: 5, // Show first 5 rows
      complete: (results) => {
        if (results.errors.length > 0) {
          setErrors(results.errors.map(err => `Row ${err.row}: ${err.message}`));
          toast.error('CSV parsing errors found');
        } else {
          setPreview(results.data);
        }
      },
      error: (error) => {
        toast.error('Error parsing CSV file');
        console.error('CSV parsing error:', error);
      }
    });
  };

  const validateData = (data) => {
    const validationErrors = [];
    
    data.forEach((row, index) => {
      // Check required fields
      if (dataType === 'products') {
        if (!row.Name || !row.Price) {
          validationErrors.push(`Row ${index + 1}: Name and Price are required`);
        }
        if (row.Price && isNaN(parseFloat(row.Price))) {
          validationErrors.push(`Row ${index + 1}: Price must be a number`);
        }
        if (row.Stock && isNaN(parseInt(row.Stock))) {
          validationErrors.push(`Row ${index + 1}: Stock must be a number`);
        }
      }
      
      if (dataType === 'categories') {
        if (!row.Name) {
          validationErrors.push(`Row ${index + 1}: Name is required`);
        }
      }
      
      if (dataType === 'users') {
        if (!row.Email || !row.Name) {
          validationErrors.push(`Row ${index + 1}: Email and Name are required`);
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (row.Email && !emailRegex.test(row.Email)) {
          validationErrors.push(`Row ${index + 1}: Invalid email format`);
        }
      }
    });

    return validationErrors;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsLoading(true);
    setImportProgress(0);

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        if (results.errors.length > 0) {
          setErrors(results.errors.map(err => `Row ${err.row}: ${err.message}`));
          setIsLoading(false);
          return;
        }

        // Validate data
        const validationErrors = validateData(results.data);
        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          setIsLoading(false);
          toast.error('Validation errors found. Please fix them before importing.');
          return;
        }

        try {
          // Simulate progress
          const progressInterval = setInterval(() => {
            setImportProgress(prev => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return 90;
              }
              return prev + 10;
            });
          }, 100);

          // Call the import function
          await onImport(results.data);
          
          clearInterval(progressInterval);
          setImportProgress(100);
          
          setTimeout(() => {
            setIsLoading(false);
            onClose();
            toast.success('Import completed successfully!');
          }, 500);

        } catch (error) {
          setIsLoading(false);
          toast.error('Import failed: ' + error.message);
        }
      },
      error: (error) => {
        setIsLoading(false);
        toast.error('Error processing file: ' + error.message);
      }
    });
  };

  const handleDownloadTemplate = () => {
    const templateData = sampleHeaders.map(header => ({ [header]: '' }));
    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" style={{ color: '#6DD5ED' }}>{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        {/* File Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select CSV File
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              disabled={isLoading}
            >
              Choose File
            </button>
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name}
              </p>
            )}
          </div>
        </div>

        {/* Template Download */}
        <div className="mb-6">
          <button
            onClick={handleDownloadTemplate}
            className="text-blue-500 hover:text-blue-700 text-sm underline"
            disabled={isLoading}
          >
            Download CSV Template
          </button>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Preview (First 5 rows)</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    {Object.keys(preview[0] || {}).map(header => (
                      <th key={header} className="border border-gray-300 px-3 py-2 text-left text-sm">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-300 px-3 py-2 text-sm">
                          {value || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Validation Errors</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
              {errors.map((error, index) => (
                <p key={index} className="text-red-600 text-sm mb-1">
                  {error}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isLoading && (
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Importing... {importProgress}%
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
            disabled={!file || isLoading || errors.length > 0}
          >
            {isLoading ? 'Importing...' : 'Import Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal; 