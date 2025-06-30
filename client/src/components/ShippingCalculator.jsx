import React, { useState, useEffect } from 'react';
import { 
  TruckIcon, 
  CalendarIcon, 
  CubeIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  calculateShippingRates, 
  getDefaultOrigin, 
  formatCurrency, 
  formatDeliveryDate,
  formatAddress 
} from '../api/shipping';
import { toast } from 'react-hot-toast';

const ShippingCalculator = ({ 
  orderItems, 
  destination, 
  onShippingSelect, 
  selectedShipping = null,
  className = '' 
}) => {
  const [shippingOptions, setShippingOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [boxTier, setBoxTier] = useState(null);
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const origin = getDefaultOrigin();

  // Calculate shipping rates when component mounts or dependencies change
  useEffect(() => {
    if (orderItems && orderItems.length > 0 && destination) {
      calculateRates();
    }
  }, [orderItems, destination]);

  const calculateRates = async () => {
    if (!orderItems || orderItems.length === 0) {
      setError('No items to calculate shipping for');
      return;
    }

    if (!destination || !destination.address) {
      setError('Please provide a shipping address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Force orderItems to be a real array
      const itemsArray = Array.isArray(orderItems) ? orderItems : Object.values(orderItems);
      const result = await calculateShippingRates(itemsArray, origin, destination);
      console.log('Shipping API result:', result);
      
      if (result.success) {
        const options = Array.isArray(result.options) ? result.options : [];
        setShippingOptions(options);
        setBoxTier(result.boxTier);
        setTotalWeight(result.totalWeight);
        setTotalItems(result.totalItems);
        
        // Auto-select the cheapest option if none selected
        if (!selectedShipping && options.length > 0) {
          const cheapestOption = options[0];
          onShippingSelect(cheapestOption);
        }
      } else {
        setShippingOptions([]);
        setError(result.error || 'Failed to calculate shipping rates');
      }
    } catch (err) {
      console.error('Shipping calculation error:', err);
      setError(err.message || 'Failed to calculate shipping rates');
      toast.error('Failed to calculate shipping rates');
    } finally {
      setLoading(false);
    }
  };

  const handleShippingSelect = (option) => {
    onShippingSelect(option);
  };

  const getStatusIcon = (option) => {
    if (option.tracking) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    }
    return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
  };

  const getCarrierIcon = (carrierName) => {
    const icons = {
      'Canada Post': '🇨🇦',
      'UPS': '📦',
      'Purolator': '🚚',
      'FedEx': '✈️',
      'Standard Shipping': '📮'
    };
    return icons[carrierName] || '📦';
  };

  if (!destination || !destination.address) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500">
          <TruckIcon className="h-5 w-5" />
          <span>Please provide a shipping address to calculate rates</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TruckIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Shipping Options</h3>
          </div>
          <button
            onClick={calculateRates}
            disabled={loading}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
        
        {/* Package Info */}
        {boxTier && (
          <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <CubeIcon className="h-4 w-4" />
              <span>Box: {boxTier.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>📦</span>
              <span>{totalItems} items</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>⚖️</span>
              <span>{totalWeight} kg</span>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-6 text-center">
          <div className="flex items-center justify-center space-x-2">
            <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Calculating shipping rates...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-4">
          <div className="flex items-center space-x-2 text-red-600">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
          <button
            onClick={calculateRates}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Try again
          </button>
        </div>
      )}

      {/* Shipping Options */}
      {!loading && !error && shippingOptions.length > 0 && (
        <div className="p-4 space-y-3">
          {shippingOptions.map((option, index) => (
            <div
              key={`${option.carrier}-${index}`}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedShipping?.carrier === option.carrier && 
                selectedShipping?.rate === option.rate
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleShippingSelect(option)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getCarrierIcon(option.carrier)}</span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {option.carrier}
                      </div>
                      <div className="text-sm text-gray-500">
                        {option.service || 'Standard Shipping'}
                      </div>
                    </div>
                  </div>
                  {getStatusIcon(option)}
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(option.rate)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {option.estimatedDays} day{option.estimatedDays !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Estimated delivery:</span>
                  </div>
                  <span className="font-medium">
                    {formatDeliveryDate(option.estimatedDays)}
                  </span>
                </div>
                
                {option.tracking && (
                  <div className="mt-1 text-xs text-green-600">
                    ✓ Tracking included
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Options */}
      {!loading && !error && shippingOptions.length === 0 && (
        <div className="p-6 text-center text-gray-500">
          <TruckIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No shipping options available for this address</p>
        </div>
      )}

      {/* Shipping Address */}
      {destination && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <div className="font-medium mb-1">Shipping to:</div>
            <div>{formatAddress(destination)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingCalculator; 