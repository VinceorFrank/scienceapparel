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
import Footer from "../components/Footer";
import ShippingCalculator from "../components/ShippingCalculator";

const getGuestCart = () => {
  try {
    return JSON.parse(localStorage.getItem("guestCart")) || [];
  } catch {
    return [];
  }
};

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({ address: "", city: "", province: "", postalCode: "", country: "" });
  const navigate = useNavigate();

  // Fetch cart on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchCart();
    } else {
      const updateGuestCart = () => {
        const guestItems = getGuestCart();
        setCart({ items: guestItems, guest: true });
        setLoading(false);
      };
      updateGuestCart();
      window.addEventListener("storage", updateGuestCart);
      window.addEventListener("focus", updateGuestCart);
      return () => {
        window.removeEventListener("storage", updateGuestCart);
        window.removeEventListener("focus", updateGuestCart);
      };
    }
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCart();
      setCart(data.data.cart);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement du panier");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (productId, quantity) => {
    setUpdating(true);
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await updateCartItem(productId, quantity);
        await fetchCart();
      } catch (err) {
        setError(err.message || "Erreur lors de la mise à jour de la quantité");
      } finally {
        setUpdating(false);
      }
    } else {
      // Guest cart
      let guestItems = getGuestCart();
      guestItems = guestItems.map(item =>
        (item._id === productId ? { ...item, quantity } : item)
      ).filter(item => item.quantity > 0);
      localStorage.setItem("guestCart", JSON.stringify(guestItems));
      setCart({ items: guestItems, guest: true });
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (productId) => {
    setUpdating(true);
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await removeCartItem(productId);
        await fetchCart();
      } catch (err) {
        setError(err.message || "Erreur lors de la suppression de l'article");
      } finally {
        setUpdating(false);
      }
    } else {
      // Guest cart
      let guestItems = getGuestCart();
      guestItems = guestItems.filter(item => item._id !== productId);
      localStorage.setItem("guestCart", JSON.stringify(guestItems));
      setCart({ items: guestItems, guest: true });
      setUpdating(false);
    }
  };

  // Calculate subtotal
  const subtotal = cart && cart.items
    ? cart.items.reduce((sum, item) => {
        const price = item.price || 0;
        const quantity = item.quantity || 1;
        return sum + price * quantity;
      }, 0)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pastel-50 to-pastel-100">
      {/* Header */}
      <header className="text-center py-8">
        <h1 className="text-3xl md:text-4xl font-bold font-fredoka tracking-tight mb-2">Panier</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-2">
        {/* If cart is empty */}
        {(!cart || !cart.items || cart.items.length === 0) ? (
          <div className="w-full max-w-md bg-white rounded-lg shadow p-8 flex flex-col items-center mt-8">
            <p className="text-lg font-semibold mb-4">Votre panier est vide</p>
            <Link to="/products" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-fredoka">Découvrir nos produits</Link>
          </div>
        ) : (
          <div className="w-full max-w-3xl bg-white rounded-lg shadow p-6 flex flex-col gap-8 mt-4">
            {/* Cart Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-lg font-fredoka">
                <thead>
                  <tr className="border-b">
                    <th className="py-2"></th>
                    <th className="py-2 text-left">Produit</th>
                    <th className="py-2 text-center">Prix</th>
                    <th className="py-2 text-center">Quantité</th>
                    <th className="py-2 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item, idx) => {
                    if (!item || typeof item !== 'object' || !(item._id || item.id)) return null;
                    const name = item.name || 'Produit';
                    const image = item.image
                      ? (item.image.startsWith('http') ? item.image
                        : item.image.startsWith('/uploads/') ? item.image
                        : `/uploads/images/${item.image}`)
                      : '/placeholder.png';
                    const price = item.price || 0;
                    const quantity = item.quantity || 1;
                    const productId = item._id || item.id || idx;
                    return (
                      <tr key={productId} className="border-b last:border-b-0">
                        <td className="py-2 text-center">
                          <button
                            onClick={() => handleRemoveItem(productId)}
                            className="text-red-400 hover:text-red-600 text-xl px-2"
                            title="Supprimer l'article"
                            aria-label="Supprimer l'article"
                            disabled={updating}
                          >
                            ×
                          </button>
                        </td>
                        <td className="py-2 flex items-center gap-4">
                          <img src={image} alt={name} className="w-16 h-16 object-cover rounded bg-pastel-200 border" />
                          <span className="font-semibold text-base md:text-lg">{name}</span>
                        </td>
                        <td className="py-2 text-center">{price.toFixed(2)} $</td>
                        <td className="py-2 text-center">
                          <div className="inline-flex items-center border rounded">
                            <button
                              onClick={() => handleQuantityChange(productId, Math.max(1, quantity - 1))}
                              className="px-2 py-1 text-lg font-bold text-gray-500 hover:text-blue-600"
                              disabled={updating || quantity <= 1}
                              aria-label="Diminuer la quantité"
                            >
                              −
                            </button>
                            <span className="px-3 select-none">{quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(productId, quantity + 1)}
                              className="px-2 py-1 text-lg font-bold text-gray-500 hover:text-blue-600"
                              disabled={updating}
                              aria-label="Augmenter la quantité"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-2 text-center font-semibold">{(price * quantity).toFixed(2)} $</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Special Instructions */}
            <div>
              <label htmlFor="specialInstructions" className="block font-semibold mb-2">Instructions spéciales</label>
              <textarea
                id="specialInstructions"
                className="w-full border rounded p-2 min-h-[60px] text-base"
                placeholder="Ajoutez des instructions pour votre commande (optionnel)"
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
              />
            </div>

            {/* Shipping Address Form & Calculator */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
              {/* Shipping Address Form */}
              <div className="flex-1 bg-pastel-100 rounded-lg p-4 mb-2">
                <div className="font-semibold mb-2">Adresse de livraison</div>
                <form className="flex flex-col gap-2">
                  <input
                    type="text"
                    name="address"
                    value={shippingAddress.address}
                    onChange={e => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                    placeholder="Adresse"
                    className="border rounded p-2"
                  />
                  <input
                    type="text"
                    name="city"
                    value={shippingAddress.city}
                    onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    placeholder="Ville"
                    className="border rounded p-2"
                  />
                  <input
                    type="text"
                    name="province"
                    value={shippingAddress.province}
                    onChange={e => setShippingAddress({ ...shippingAddress, province: e.target.value })}
                    placeholder="Province"
                    className="border rounded p-2"
                  />
                  <input
                    type="text"
                    name="postalCode"
                    value={shippingAddress.postalCode}
                    onChange={e => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                    placeholder="Code postal"
                    className="border rounded p-2"
                  />
                  <input
                    type="text"
                    name="country"
                    value={shippingAddress.country}
                    onChange={e => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                    placeholder="Pays"
                    className="border rounded p-2"
                  />
                </form>
                {/* Shipping Calculator (shows carriers/rates if address is filled) */}
                <div className="mt-4">
                  <ShippingCalculator
                    orderItems={cart.items.map(item => ({
                      name: item.name || 'Produit',
                      qty: item.quantity || 1,
                      price: item.price || 0,
                      product: item._id || item.id || null
                    }))}
                    destination={shippingAddress}
                    selectedShipping={selectedShipping}
                    onShippingSelect={setSelectedShipping}
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div className="flex-1 bg-pastel-100 rounded-lg p-4">
                <div className="flex justify-between mb-2 text-lg">
                  <span>Sous-total</span>
                  <span className="font-bold">{subtotal.toFixed(2)} $</span>
                </div>
                <div className="flex justify-between mb-2 text-lg">
                  <span>Livraison</span>
                  <span className="font-bold">{selectedShipping ? `${selectedShipping.rate.toFixed(2)} $` : '--'}</span>
                </div>
                <div className="flex justify-between mb-2 text-lg">
                  <span>Estimation livraison</span>
                  <span className="font-bold">{selectedShipping ? `${selectedShipping.estimatedDays} jours` : '--'}</span>
                </div>
                <div className="text-gray-500 text-sm mb-2">Commande minimum : 20 $<br />Taxes et transport en sus</div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>{(subtotal + (selectedShipping ? selectedShipping.rate : 0)).toFixed(2)} $</span>
                </div>
                <button
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-fredoka text-lg mt-4"
                  onClick={() => navigate('/shipping', { state: { cart, specialInstructions, shippingAddress, selectedShipping } })}
                  disabled={updating || !selectedShipping}
                >
                  Paiement
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer (same as Home) */}
      <Footer />
    </div>
  );
};

export default Cart;
