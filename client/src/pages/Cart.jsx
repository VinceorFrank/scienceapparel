import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartSummary,
} from "../api/cart";
import ShippingCalculator from "../components/ShippingCalculator";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({ address: "", city: "", postalCode: "", country: "" });
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  // Fetch cart on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchCart();
  }, [navigate]);

  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCart();
      setCart(data.cart);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement du panier");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (productId, quantity) => {
    setUpdating(true);
    try {
      await updateCartItem(productId, quantity);
      await fetchCart();
    } catch (err) {
      setError(err.message || "Erreur lors de la mise à jour de la quantité");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (productId) => {
    setUpdating(true);
    try {
      await removeCartItem(productId);
      await fetchCart();
    } catch (err) {
      setError(err.message || "Erreur lors de la suppression de l'article");
    } finally {
      setUpdating(false);
    }
  };

  const handleClearCart = async () => {
    setUpdating(true);
    try {
      await clearCart();
      await fetchCart();
    } catch (err) {
      setError(err.message || "Erreur lors du vidage du panier");
    } finally {
      setUpdating(false);
    }
  };

  // Calculate subtotal
  const subtotal = cart ? cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0) : 0;

  // Handle address input changes
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
    setSelectedShipping(null); // Reset selected shipping when address changes
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
        <button onClick={fetchCart} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Réessayer</button>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-6">Panier</h1>
        <p className="text-gray-500 mb-6">Votre panier est vide.</p>
        <Link to="/products" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">Découvrir nos produits</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Panier</h1>
      {/* Cart Items */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Articles</h2>
        {cart.items.map((item) => (
          <div key={item.product._id || item.product} className="flex items-center justify-between border-b py-2">
            <div className="flex items-center space-x-3">
              <img src={`/uploads/images/${item.product.image || 'placeholder.png'}`} alt={item.product.name} className="w-12 h-12 object-cover rounded border" onError={e => { e.target.src = '/placeholder.png'; }} />
              <div>
                <div className="font-medium">{item.product.name}</div>
                <div className="text-sm text-gray-500">Qty: 
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    disabled={updating}
                    onChange={e => handleQuantityChange(item.product._id || item.product, parseInt(e.target.value, 10))}
                    className="w-16 border rounded p-1 ml-2 text-center"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="font-medium">${(item.price * item.quantity).toFixed(2)}</div>
              <button
                onClick={() => handleRemoveItem(item.product._id || item.product)}
                className="ml-2 text-red-500 hover:text-red-700"
                disabled={updating}
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={handleClearCart}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          disabled={updating}
        >
          Vider le panier
        </button>
      </div>

      {/* Shipping Address Form */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Adresse de livraison</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="address"
            value={shippingAddress.address}
            onChange={handleAddressChange}
            placeholder="Adresse"
            className="border rounded p-2"
            required
          />
          <input
            type="text"
            name="city"
            value={shippingAddress.city}
            onChange={handleAddressChange}
            placeholder="Ville"
            className="border rounded p-2"
            required
          />
          <input
            type="text"
            name="postalCode"
            value={shippingAddress.postalCode}
            onChange={handleAddressChange}
            placeholder="Code Postal"
            className="border rounded p-2"
            required
          />
          <input
            type="text"
            name="country"
            value={shippingAddress.country}
            onChange={handleAddressChange}
            placeholder="Pays"
            className="border rounded p-2"
            required
          />
        </form>
      </div>

      {/* Shipping Calculator */}
      <div className="mb-6">
        <ShippingCalculator
          orderItems={cart.items.map(item => ({
            name: item.product.name,
            qty: item.quantity,
            price: item.price,
            product: item.product._id || item.product
          }))}
          destination={shippingAddress}
          selectedShipping={selectedShipping}
          onShippingSelect={setSelectedShipping}
        />
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Résumé de la commande</h2>
        <div className="flex justify-between mb-2">
          <span>Sous-total:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Livraison:</span>
          <span>{selectedShipping ? `$${selectedShipping.rate.toFixed(2)}` : '--'}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Estimation livraison:</span>
          <span>{selectedShipping ? `${selectedShipping.estimatedDays} jours` : '--'}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
          <span>Total:</span>
          <span>${(subtotal + (selectedShipping ? selectedShipping.rate : 0)).toFixed(2)}</span>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => navigate('/shipping', { state: { cart, shippingAddress, selectedShipping } })}
            disabled={updating || !selectedShipping}
          >
            Passer à la livraison
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
