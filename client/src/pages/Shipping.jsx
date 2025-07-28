import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import usePersistentState from "../hooks/usePersistentState";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from "../api/users";
import AddressForm from "../components/AddressForm";
import { createOrder } from '../api/orders';
import { toast } from 'react-toastify';
import ShippingCalculator from "../components/ShippingCalculator";
import { getTestOrderId } from '../utils/testUtils';
import { useLang } from '../utils/lang';
import PageLayout from '../components/PageLayout';

const Shipping = () => {
  const { t } = useLang();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const cart         = location.state?.cart;
  const passedAddr   = location.state?.shippingAddress;

  // persist the address long-term
  const [savedAddr, setSavedAddr] =
    usePersistentState("shippingAddress", {
      address:"", city:"", province:"", postalCode:"", country:"CA"
    });

  // Fetch addresses on mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  // Auto-populate address from cart state if available
  useEffect(() => {
    if (!passedAddr) return;                // nothing came from Cart
    const normalised = {
      ...passedAddr,
      province: passedAddr.province?.toUpperCase(),
      country: "CA"
    };
    setSavedAddr(normalised);               // 1) store to localStorage
  }, [passedAddr, setSavedAddr]);

  const fetchAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAddresses();
      console.log('Fetched addresses response:', response);
      
      // Handle both response structures: {data: {addresses: [...]}} and {addresses: [...]}
      const addresses = response.data?.addresses || response.addresses || [];
      console.log('Extracted addresses:', addresses);
      
      setAddresses(addresses);
      
      // Auto-select default shipping address if available
      const defaultShipping = addresses.find(a => a.type === 'shipping' && a.isDefault);
      if (defaultShipping) setSelectedAddressId(defaultShipping._id);
      
      console.log('Total addresses:', addresses.length);
      console.log('Shipping addresses:', addresses.filter(a => a.type === 'shipping').length);
      console.log('Current addresses state:', addresses);
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setError(err.message || "Erreur lors du chargement des adresses");
    } finally {
      setLoading(false);
    }
  };

  // Let ShippingCalculator handle all shipping rate calculations
  // No need for separate fetchShippingRates function

  const handleSelectAddress = (id) => {
    console.log('Selecting address:', id);
    setSelectedAddressId(id);
    setSelectedShipping(null);
  };

  const handleAddAddress = async (addressData) => {
    try {
      await addAddress(addressData);
      setShowAddressForm(false);
      setSuccessMessage("Adresse ajoutée avec succès!");
      await fetchAddresses();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
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

  // Add handler for proceeding to payment
  const handleProceedToPayment = async () => {
    console.log('=== PAYMENT BUTTON CLICKED ===');
    console.log('selectedAddressId:', selectedAddressId);
    console.log('selectedShipping:', selectedShipping);
    console.log('cart:', cart);
    
    setOrderLoading(true);
    setOrderError(null);
    
    try {
      const selectedAddress = addresses.find(a => a._id === selectedAddressId);
      console.log('selectedAddress:', selectedAddress);
      
      if (!selectedAddress) {
        throw new Error('Please select a shipping address');
      }
      
      if (!selectedShipping) {
        throw new Error('Please select a shipping option');
      }
      
      if (!cart || !cart.items || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }
      
      // Calculate prices
      const itemsPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      const shippingPrice = selectedShipping.rate || 0;
      const taxPrice = itemsPrice * 0.15; // 15% tax for testing
      const totalPrice = itemsPrice + taxPrice + shippingPrice;
      
      console.log('Price calculations:', { itemsPrice, shippingPrice, taxPrice, totalPrice });
      
      // Debug cart items structure
      console.log('Cart items structure:', cart.items);
      console.log('First cart item:', cart.items[0]);
      
      // Prepare order data according to backend expectations
      const orderData = {
        orderItems: cart.items.map(item => {
          console.log('Processing cart item:', item);
          console.log('Item product:', item.product);
          console.log('Item product._id:', item.product._id);
          
          return {
            name: item.product.name,
            qty: item.quantity,
            price: item.price,
            product: item.product._id || item.product
          };
        }),
        shippingAddress: {
          address: selectedAddress.address,
          city: selectedAddress.city,
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country
        },
        paymentMethod: 'Credit Card', // Default for testing
        itemsPrice: parseFloat(itemsPrice.toFixed(2)),
        taxPrice: parseFloat(taxPrice.toFixed(2)),
        shippingPrice: parseFloat(shippingPrice.toFixed(2)),
        totalPrice: parseFloat(totalPrice.toFixed(2))
      };
      
      console.log('Creating order with data:', orderData);
      console.log('Order items structure:', orderData.orderItems);
      
      // For testing: try to create order, if it fails, just navigate to a test payment page
      try {
        const response = await createOrder(orderData);
        console.log('Order creation response:', response);
        
        if (response && response.success && response.data && response.data.order && response.data.order._id) {
          setSavedAddr(selectedAddress);
          navigate(`/payment/${response.data.order._id}`);
        } else if (response && response.success && response.data && response.data._id) {
          setSavedAddr(selectedAddress);
          navigate(`/payment/${response.data._id}`);
        } else {
          throw new Error(response.message || 'Order creation failed');
        }
      } catch (orderError) {
        console.error('Order creation failed, using test fallback:', orderError);
        console.error('Order error details:', orderError.message);
        console.error('Order error response:', orderError.response?.data);
        
        // For testing: create a valid MongoDB ObjectId format
        const testOrderId = getTestOrderId();
        console.log('Using test order ID:', testOrderId);
        setSavedAddr(selectedAddress);
        navigate(`/payment/${testOrderId}`);
      }
    } catch (err) {
      console.error('Payment button error:', err);
      setOrderError(err.message);
      toast.error(err.message || 'Order creation failed');
    } finally {
      setOrderLoading(false);
    }
  };

  // Find the selected address object
  const selectedAddress = addresses.find(a => a._id === selectedAddressId);
  console.log('Selected shipping address for calculator:', selectedAddress);
  console.log('Current addresses state in render:', addresses);
  console.log('Addresses length:', addresses.length);
  console.log('Shipping addresses:', addresses.filter(a => a.type === 'shipping'));

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
        <button onClick={fetchAddresses} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">{t('tryAgain')}</button>
      </div>
    );
  }

  return <PageLayout slug="shipping">{/* page content here */}</PageLayout>;
};

export default Shipping;
