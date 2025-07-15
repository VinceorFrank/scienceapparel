import React, { useState, useEffect } from 'react';
import { 
  getAddresses, 
  addAddress, 
  updateAddress, 
  deleteAddress, 
  setDefaultAddress 
} from '../api/users';
import Layout from '../components/Layout';
import PastelCard from '../components/PastelCard';
import { useLang } from '../utils/lang';

const Addresses = () => {
  const { t } = useLang();
  const [addresses, setAddresses] = useState({ shipping: [], billing: [], all: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Form data
  const [formData, setFormData] = useState({
    type: 'shipping',
    isDefault: false,
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: ''
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await getAddresses();
      setAddresses(response.data.addresses);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (editingAddress) {
        await updateAddress(editingAddress._id, formData);
        setSuccess(t('addressUpdatedSuccess'));
      } else {
        await addAddress(formData);
        setSuccess(t('addressAddedSuccess'));
      }

      setShowAddForm(false);
      setEditingAddress(null);
      resetForm();
      loadAddresses();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      type: address.type,
      isDefault: address.isDefault,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone
    });
    setShowAddForm(true);
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm(t('confirmDeleteAddress'))) {
      return;
    }

    try {
      await deleteAddress(addressId);
      setSuccess(t('addressDeletedSuccess'));
      loadAddresses();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await setDefaultAddress(addressId);
      setSuccess(t('defaultAddressUpdatedSuccess'));
      loadAddresses();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'shipping',
      isDefault: false,
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      phone: ''
    });
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingAddress(null);
    resetForm();
  };

  const getAddressTypeIcon = (type) => {
    return type === 'shipping' ? '📦' : '💳';
  };

  const getAddressTypeColor = (type) => {
    return type === 'shipping' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const renderAddressCard = (address) => (
    <div key={address._id} className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{getAddressTypeIcon(address.type)}</span>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAddressTypeColor(address.type)}`}>
            {t(address.type)}
          </span>
          {address.isDefault && (
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
              {t('default')}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(address)}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            {t('edit')}
          </button>
          {!address.isDefault && (
            <button
              onClick={() => handleSetDefault(address._id)}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
            >
              {t('setDefault')}
            </button>
          )}
          <button
            onClick={() => handleDelete(address._id)}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            {t('delete')}
          </button>
        </div>
      </div>
      <div className="space-y-1 text-sm text-gray-600">
        <p className="font-medium text-gray-900">{address.street}</p>
        <p>{address.city}, {address.state} {address.zipCode}</p>
        <p>{address.country}</p>
        {address.phone && <p>📞 {address.phone}</p>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Address Management</h1>
          <p className="text-gray-600 mt-2">Manage your shipping and billing addresses</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'all', name: 'All Addresses', icon: '📍', count: addresses.all.length },
              { id: 'shipping', name: 'Shipping', icon: '📦', count: addresses.shipping.length },
              { id: 'billing', name: 'Billing', icon: '💳', count: addresses.billing.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Add Address Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Add New Address
          </button>
        </div>

        {/* Add/Edit Address Form */}
        {showAddForm && (
          <PastelCard className="bg-gradient-to-r from-blue-50 to-indigo-50 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="shipping">Shipping Address</option>
                    <option value="billing">Billing Address</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700">Set as default {formData.type} address</span>
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP/Postal Code *
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingAddress ? 'Update Address' : 'Add Address')}
                </button>
              </div>
            </form>
          </PastelCard>
        )}

        {/* Address List */}
        <div className="space-y-6">
          {activeTab === 'all' && addresses.all.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.all.map(renderAddressCard)}
            </div>
          )}

          {activeTab === 'shipping' && addresses.shipping.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.shipping.map(renderAddressCard)}
            </div>
          )}

          {activeTab === 'billing' && addresses.billing.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.billing.map(renderAddressCard)}
            </div>
          )}

          {/* Empty State */}
          {((activeTab === 'all' && addresses.all.length === 0) ||
            (activeTab === 'shipping' && addresses.shipping.length === 0) ||
            (activeTab === 'billing' && addresses.billing.length === 0)) && (
            <PastelCard className="bg-gradient-to-r from-gray-50 to-slate-50">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses found</h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === 'all' 
                    ? "You haven't added any addresses yet."
                    : `You haven't added any ${activeTab} addresses yet.`
                  }
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Your First Address
                </button>
              </div>
            </PastelCard>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Addresses; 