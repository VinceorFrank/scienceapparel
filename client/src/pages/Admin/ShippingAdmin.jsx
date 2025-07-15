import React, { useState, useEffect } from 'react';
import { 
  TruckIcon, 
  CogIcon, 
  ChartBarIcon, 
  PlusIcon, 
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  getShippingSettings, 
  updateShippingSettings, 
  getShippingAnalytics,
  testCarrierAPI,
  formatCurrency 
} from '../../api/shipping';
import { toast } from 'react-hot-toast';
import { useLang } from '../../utils/lang';

const ShippingAdmin = () => {
  const { t } = useLang();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('carriers');
  const [editingTier, setEditingTier] = useState(null);
  const [editingCarrier, setEditingCarrier] = useState(null);
  const [testingCarrier, setTestingCarrier] = useState(null);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
    loadAnalytics();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const result = await getShippingSettings();
      if (result.success) {
        setSettings(result.settings);
      } else {
        toast.error('Failed to load shipping settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load shipping settings');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const result = await getShippingAnalytics();
      if (result.success) {
        setAnalytics(result.analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleSaveSettings = async (updates) => {
    try {
      setSaving(true);
      const result = await updateShippingSettings(updates);
      if (result.success) {
        setSettings(prev => ({ ...prev, ...updates }));
        toast.success('Settings updated successfully');
      } else {
        toast.error(result.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestCarrier = async (carrier) => {
    try {
      setTestingCarrier(carrier.name);
      const result = await testCarrierAPI({
        carrierName: carrier.name,
        apiKey: carrier.apiKey,
        apiSecret: carrier.apiSecret
      });
      
      if (result.success) {
        toast.success(`✅ ${carrier.name} API test successful`);
      } else {
        toast.error(`❌ ${carrier.name} API test failed`);
      }
    } catch (error) {
      toast.error(`❌ ${carrier.name} API test failed`);
    } finally {
      setTestingCarrier(null);
    }
  };

  const handleCarrierToggle = (carrierIndex) => {
    const updatedCarriers = [...settings.carriers];
    updatedCarriers[carrierIndex].enabled = !updatedCarriers[carrierIndex].enabled;
    handleSaveSettings({ carriers: updatedCarriers });
  };

  const handleCarrierUpdate = (carrierIndex, updates) => {
    const updatedCarriers = [...settings.carriers];
    updatedCarriers[carrierIndex] = { ...updatedCarriers[carrierIndex], ...updates };
    handleSaveSettings({ carriers: updatedCarriers });
    setEditingCarrier(null);
  };

  const handleTierUpdate = (tierIndex, updates) => {
    const updatedTiers = [...settings.boxTiers];
    updatedTiers[tierIndex] = { ...updatedTiers[tierIndex], ...updates };
    handleSaveSettings({ boxTiers: updatedTiers });
    setEditingTier(null);
  };

  const tabs = [
    { id: 'carriers', name: t('carriers'), icon: TruckIcon },
    { id: 'tiers', name: t('boxTiers'), icon: CogIcon },
    { id: 'analytics', name: t('analytics'), icon: ChartBarIcon }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <ArrowPathIcon className="h-6 w-6 animate-spin text-blue-600" />
          <span>{t('loadingShippingSettings')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('shippingManagement')}</h1>
          <p className="text-gray-600">{t('shippingManagementDesc')}</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'carriers' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Shipping Carriers</h2>
              <p className="text-sm text-gray-600">Configure carrier settings and API connections</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {settings?.carriers?.map((carrier, index) => (
                  <div key={carrier.name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={carrier.enabled}
                            onChange={() => handleCarrierToggle(index)}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <h3 className="font-medium text-gray-900">{carrier.name}</h3>
                        </div>
                        <span className="text-sm text-gray-500">Priority: {carrier.priority}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTestCarrier(carrier)}
                          disabled={testingCarrier === carrier.name}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                        >
                          {testingCarrier === carrier.name ? (
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          ) : (
                            'Test API'
                          )}
                        </button>
                        <button
                          onClick={() => setEditingCarrier(editingCarrier === index ? null : index)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {editingCarrier === index ? (
                      <CarrierEditForm
                        carrier={carrier}
                        onSave={(updates) => handleCarrierUpdate(index, updates)}
                        onCancel={() => setEditingCarrier(null)}
                      />
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Markup:</span>
                          <div className="font-medium">{carrier.markupPercentage}%</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Delay Days:</span>
                          <div className="font-medium">{carrier.delayDays}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">API Key:</span>
                          <div className="font-mono text-xs">{carrier.apiKey ? '***' : 'Not set'}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Description:</span>
                          <div className="text-gray-700">{carrier.description}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tiers' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Box Tiers</h2>
              <p className="text-sm text-gray-600">Configure package sizes and weight estimates</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {settings?.boxTiers?.map((tier, index) => (
                  <div key={tier.name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">{tier.name}</h3>
                      <button
                        onClick={() => setEditingTier(editingTier === index ? null : index)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {editingTier === index ? (
                      <TierEditForm
                        tier={tier}
                        onSave={(updates) => handleTierUpdate(index, updates)}
                        onCancel={() => setEditingTier(null)}
                      />
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Max Items:</span>
                          <div className="font-medium">{tier.maxItems}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Dimensions:</span>
                          <div className="font-medium">
                            {tier.dimensions.length} × {tier.dimensions.width} × {tier.dimensions.height} cm
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Weight:</span>
                          <div className="font-medium">{tier.weightEstimate} kg</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Description:</span>
                          <div className="text-gray-700">{tier.description}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TruckIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Shipments</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics?.totalShipments || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ChartBarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Shipping Cost</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(analytics?.averageShippingCost || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CogIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Most Used Carrier</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics?.mostUsedCarrier || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ArrowPathIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Delivery Time</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics?.averageDeliveryTime || 0} days</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Carrier Usage Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Carrier Usage</h3>
              <div className="space-y-3">
                {analytics?.shippingCostByCarrier && Object.entries(analytics.shippingCostByCarrier).map(([carrier, count]) => (
                  <div key={carrier} className="flex items-center justify-between">
                    <span className="text-gray-700">{carrier}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(count / Math.max(...Object.values(analytics.shippingCostByCarrier))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Carrier Edit Form Component
const CarrierEditForm = ({ carrier, onSave, onCancel }) => {
  const [form, setForm] = useState({
    name: carrier.name,
    markupPercentage: carrier.markupPercentage,
    delayDays: carrier.delayDays,
    priority: carrier.priority,
    description: carrier.description,
    apiKey: carrier.apiKey,
    apiSecret: carrier.apiSecret
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Markup %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={form.markupPercentage}
            onChange={(e) => setForm({ ...form, markupPercentage: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delay Days</label>
          <input
            type="number"
            min="0"
            value={form.delayDays}
            onChange={(e) => setForm({ ...form, delayDays: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <input
            type="number"
            min="0"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter API key"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Secret</label>
          <input
            type="password"
            value={form.apiSecret}
            onChange={(e) => setForm({ ...form, apiSecret: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter API secret"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  );
};

// Tier Edit Form Component
const TierEditForm = ({ tier, onSave, onCancel }) => {
  const [form, setForm] = useState({
    name: tier.name,
    maxItems: tier.maxItems,
    dimensions: { ...tier.dimensions },
    weightEstimate: tier.weightEstimate,
    description: tier.description
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Items</label>
          <input
            type="number"
            min="1"
            value={form.maxItems}
            onChange={(e) => setForm({ ...form, maxItems: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Length (cm)</label>
          <input
            type="number"
            min="1"
            value={form.dimensions.length}
            onChange={(e) => setForm({ 
              ...form, 
              dimensions: { ...form.dimensions, length: parseFloat(e.target.value) }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label>
          <input
            type="number"
            min="1"
            value={form.dimensions.width}
            onChange={(e) => setForm({ 
              ...form, 
              dimensions: { ...form.dimensions, width: parseFloat(e.target.value) }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
          <input
            type="number"
            min="1"
            value={form.dimensions.height}
            onChange={(e) => setForm({ 
              ...form, 
              dimensions: { ...form.dimensions, height: parseFloat(e.target.value) }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={form.weightEstimate}
            onChange={(e) => setForm({ ...form, weightEstimate: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default ShippingAdmin; 