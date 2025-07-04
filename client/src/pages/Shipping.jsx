import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from "../api/users";
import { getShippingRates } from "../api/shipping";
import AddressForm from "../components/AddressForm";

const Shipping = () => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const cart = location.state?.cart;

  // Fetch addresses on mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAddresses();
      setAddresses(data.addresses || []);
      // Auto-select default shipping address if available
      const defaultShipping = (data.addresses || []).find(a => a.type === 'shipping' && a.isDefault);
      if (defaultShipping) setSelectedAddressId(defaultShipping._id);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des adresses");
    } finally {
      setLoading(false);
    }
  };

  // Fetch shipping rates when address or cart changes
  useEffect(() => {
    if (!selectedAddressId || !cart) return;
    const address = addresses.find(a => a._id === selectedAddressId);
    if (!address) return;
    fetchShippingRates(address);
  }, [selectedAddressId, cart]);

  const fetchShippingRates = async (address) => {
    setRatesLoading(true);
    setRatesError(null);
    setShippingOptions([]);
    try {
      const result = await getShippingRates(
        cart.items.map(item => ({
          name: item.product.name,
          qty: item.quantity,
          price: item.price,
          product: item.product._id || item.product
        })),
        {}, // origin (handled by backend)
        {
          address: address.address,
          city: address.city,
          postalCode: address.postalCode,
          country: address.country
        }
      );
      setShippingOptions(result.options || []);
    } catch (err) {
      setRatesError(err.message || "Erreur lors du calcul des frais de livraison");
    } finally {
      setRatesLoading(false);
    }
  };

  const handleSelectAddress = (id) => {
    setSelectedAddressId(id);
    setSelectedShipping(null);
  };

  const handleAddAddress = async (addressData) => {
    try {
      await addAddress(addressData);
      setShowAddressForm(false);
      await fetchAddresses();
    } catch (err) {
      setError(err.message || "Erreur lors de l'ajout de l'adresse");
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleUpdateAddress = async (addressId, addressData) => {
    try {
      await updateAddress(addressId, addressData);
      setShowAddressForm(false);
      setEditingAddress(null);
      await fetchAddresses();
    } catch (err) {
      setError(err.message || "Erreur lors de la mise à jour de l'adresse");
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Supprimer cette adresse ?")) return;
    try {
      await deleteAddress(addressId);
      await fetchAddresses();
    } catch (err) {
      setError(err.message || "Erreur lors de la suppression de l'adresse");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-red-600">
        <p>{error}</p>
        <button onClick={fetchAddresses} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Livraison</h1>
      {/* Address Selection */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Adresse de livraison</h2>
        {addresses.length === 0 && (
          <div className="text-gray-500 mb-4">Aucune adresse enregistrée.</div>
        )}
        <div className="space-y-3 mb-4">
          {addresses.filter(a => a.type === 'shipping').map(address => (
            <div
              key={address._id}
              className={`flex items-center justify-between p-3 rounded border cursor-pointer ${selectedAddressId === address._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
              onClick={() => handleSelectAddress(address._id)}
            >
              <div>
                <div className="font-medium">{address.firstName} {address.lastName}</div>
                <div className="text-sm text-gray-600">{address.address}, {address.city}, {address.postalCode}, {address.country}</div>
                {address.isDefault && <span className="text-xs text-blue-600">Adresse par défaut</span>}
              </div>
              <div className="flex space-x-2">
                <button onClick={e => { e.stopPropagation(); handleEditAddress(address); }} className="text-blue-600 hover:underline">Modifier</button>
                <button onClick={e => { e.stopPropagation(); handleDeleteAddress(address._id); }} className="text-red-500 hover:underline">Supprimer</button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => { setShowAddressForm(true); setEditingAddress(null); }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Ajouter une adresse
        </button>
        {showAddressForm && (
          <div className="mt-4">
            <AddressForm
              initialData={editingAddress}
              onSave={editingAddress ? (data) => handleUpdateAddress(editingAddress._id, data) : handleAddAddress}
              onCancel={() => { setShowAddressForm(false); setEditingAddress(null); }}
            />
          </div>
        )}
      </div>

      {/* Shipping Options */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Options de livraison</h2>
        {ratesLoading && (
          <div className="text-gray-500">Chargement des options de livraison...</div>
        )}
        {ratesError && (
          <div className="text-red-600 mb-2">{ratesError}</div>
        )}
        {!ratesLoading && !ratesError && shippingOptions.length === 0 && (
          <div className="text-gray-500">Aucune option de livraison disponible pour cette adresse.</div>
        )}
        <div className="space-y-3">
          {shippingOptions.map(option => (
            <div
              key={option.carrier + option.service}
              className={`flex items-center justify-between p-3 rounded border cursor-pointer ${selectedShipping === option ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
              onClick={() => setSelectedShipping(option)}
            >
              <div>
                <div className="font-medium">{option.carrier} - {option.service}</div>
                <div className="text-sm text-gray-600">Estimation: {option.estimatedDays} jours • {option.deliveryDateFormatted}</div>
              </div>
              <div className="font-bold text-blue-700 text-lg">${option.rate.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300"
          onClick={() => navigate('/cart')}
        >
          Retour au panier
        </button>
        <button
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          onClick={() => navigate('/payment', { state: { cart, selectedAddress: addresses.find(a => a._id === selectedAddressId), selectedShipping } })}
          disabled={!selectedAddressId || !selectedShipping}
        >
          Passer au paiement
        </button>
      </div>
    </div>
  );
};

export default Shipping;
