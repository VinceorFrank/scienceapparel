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
import Header from "../components/Header";

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
        window.dispatchEvent(new Event('cartUpdated'));
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
      console.log('[Cart] Updated guestCart:', guestItems);
      window.dispatchEvent(new Event('cartUpdated'));
      console.log('[Cart] cartUpdated event dispatched');
    }
  };

  const handleRemoveItem = async (productId) => {
    setUpdating(true);
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await removeCartItem(productId);
        await fetchCart();
        window.dispatchEvent(new Event('cartUpdated'));
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
      window.dispatchEvent(new Event('cartUpdated'));
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
    <div className="min-h-screen flex flex-col w-full bg-gradient-to-b from-pink-50 via-blue-50 to-white overflow-x-hidden">
      <Header />
      {/* Header */}
      <header className="text-center py-8">
        <h1 className="text-3xl md:text-4xl font-bold font-fredoka tracking-tight mb-2 text-blue-400">Panier</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-2">
        <div className="w-full max-w-5xl bg-gradient-to-br from-pink-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 md:p-10 mb-8 border border-blue-100">
          {/* Cart Table and Summary go here */}
          {/* If cart is empty */}
          {(!cart || !cart.items || cart.items.length === 0) ? (
            <div className="w-full max-w-md bg-white rounded-lg shadow p-8 flex flex-col items-center mt-8">
              <p className="text-lg font-semibold mb-4">Votre panier est vide</p>
              <Link to="/products" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-fredoka">Découvrir nos produits</Link>
            </div>
          ) : (
            <>
              {/* Cart Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-lg font-fredoka">
                  <thead>
                    <tr className="border-b bg-pastel-100">
                      <th className="py-3 text-left text-xl">Produit</th>
                      <th className="py-3 text-center text-xl">Prix</th>
                      <th className="py-3 text-center text-xl">Quantité</th>
                      <th className="py-3 text-center text-xl">Total</th>
                      <th className="py-3 text-center text-xl"></th>
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
                        <tr key={productId} className="border-b last:border-b-0 hover:bg-pastel-50 transition rounded-lg">
                          <td className="py-4 flex items-center gap-6">
                            <div className="w-80 h-80 aspect-square bg-white rounded-2xl border shadow-lg flex items-center justify-center overflow-hidden">
                              <img src={image} alt={name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-2xl md:text-3xl text-gray-800">{name}</span>
                              <span className="text-sm md:text-base text-gray-600 mt-1">{item.description || 'Aucune description disponible'}</span>
                            </div>
                          </td>
                          <td className="py-4 text-center text-xl text-blue-700 font-semibold">{price.toFixed(2)} $</td>
                          <td className="py-4 text-center">
                            <div className="inline-flex items-center border rounded-lg bg-white shadow-sm">
                              <button
                                onClick={() => handleQuantityChange(productId, Math.max(1, quantity - 1))}
                                className="px-3 py-2 text-2xl font-bold text-gray-500 hover:text-blue-600"
                                disabled={updating || quantity <= 1}
                                aria-label="Diminuer la quantité"
                              >
                                −
                              </button>
                              <span className="px-4 text-xl select-none">{quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(productId, quantity + 1)}
                                className="px-3 py-2 text-2xl font-bold text-gray-500 hover:text-blue-600"
                                disabled={updating}
                                aria-label="Augmenter la quantité"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-4 text-center text-xl font-bold text-green-700">{(price * quantity).toFixed(2)} $</td>
                          <td className="py-4 text-center">
                            <button
                              onClick={() => handleRemoveItem(productId)}
                              className="text-red-400 hover:text-red-600 text-3xl px-3 rounded-full bg-pastel-100 hover:bg-pastel-200 transition shadow-sm"
                              title="Supprimer l'article"
                              aria-label="Supprimer l'article"
                              disabled={updating}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Continue Shopping Button */}
              <div className="mb-8 flex justify-start">
                <Link to="/products">
                  <button className="px-8 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold rounded-full shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300 text-lg">
                    Continuer vos achats
                  </button>
                </Link>
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
            </>
          )}
        </div>
      </main>

      {/* Single Footer at the bottom */}
    </div>
  );
};

export default Cart;
