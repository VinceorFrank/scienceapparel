import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../api/products";
import { addCartItem, getCart } from "../api/cart";
import { toast } from 'react-toastify';
import { useLang } from '../utils/lang';
import { usePageAssets } from '../hooks/usePageAssets';
import { useBlockToggle } from '../hooks/useBlockToggle';
import { useHeroSettings } from '../hooks/useHeroSettings';
import { useMiniButtonSettings } from '../hooks/useMiniButtonSettings';
import LayoutRenderer from '../components/LayoutRenderer';

const getGuestCart = () => {
  try {
    return JSON.parse(localStorage.getItem("guestCart")) || [];
  } catch {
    return [];
  }
};
const setGuestCart = (cart) => {
  localStorage.setItem("guestCart", JSON.stringify(cart));
};
const addToGuestCart = (product) => {
  const cart = getGuestCart();
  const existing = cart.find((item) => item._id === product._id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  setGuestCart(cart);
  window.dispatchEvent(new Event('cartUpdated'));
};

const Home = () => {
  const { t } = useLang();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartQuantities, setCartQuantities] = useState({});
  const { data, isLoading: assetsLoading } = usePageAssets('home');
  const { blockOrder, getToggles } = useBlockToggle('home');
  const { buttonPosition, buttonDestination } = useHeroSettings('home');
  const { buttonDestination: miniButtonDestination } = useMiniButtonSettings('home');

  // Prepare button settings for LayoutRenderer
  const buttonSettings = {
    hero: {
      position: buttonPosition,
      destination: buttonDestination
    },
    mini: {
      position: 'center',
      destination: miniButtonDestination
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchProducts();
        // Store the full list; we'll filter by slot in the render
        setProducts(data.items || data.data || []);
      } catch (err) {
        setError(t('failedToLoadProducts'));
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
    updateCartQuantities();
    window.addEventListener('cartUpdated', updateCartQuantities);
    return () => window.removeEventListener('cartUpdated', updateCartQuantities);
  }, []);

  const updateCartQuantities = async () => {
    try {
      const cart = await getCart();
      const quantities = {};
      cart.items.forEach(item => {
        quantities[item.product._id] = item.quantity;
      });
      setCartQuantities(quantities);
    } catch (err) {
      console.error('Failed to update cart quantities:', err);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await addCartItem(product._id, 1);
      toast.success(t('addedToCart'));
      updateCartQuantities();
    } catch (err) {
      console.error('Failed to add to cart:', err);
      toast.error(t('failedToAddToCart'));
    }
  };

  // Filter products for different sections
  const featuredProducts = products.slice(0, 3);
  const newArrivals = products.slice(3, 6);

  return (
    <div className="min-h-screen pt-32 px-4 sm:px-8">
      {/* Use LayoutRenderer for the main blocks */}
      <LayoutRenderer
        slug="home"
        assets={data}
        toggles={getToggles()}
        blockOrder={blockOrder}
        buttonSettings={buttonSettings}
      />

      {/* Product Sections - These are specific to Home page and not part of the block system */}
      {!loading && !error && (
        <>
          {/* Featured Products Section */}
          <section className="max-w-7xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
              {t('featuredProducts')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <div key={product._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="relative">
                    <img
                      src={product.imageUrl || '/placeholder.png'}
                      alt={product.name}
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {t('featured')}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{product.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-pink-500">${product.price}</span>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="bg-gradient-to-r from-pink-400 to-pink-500 text-white px-6 py-2 rounded-full hover:from-pink-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                      >
                        {t('addToCart')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* New Arrivals Section */}
          <section className="max-w-7xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
              {t('newArrivals')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {newArrivals.map((product) => (
                <div key={product._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="relative">
                    <img
                      src={product.imageUrl || '/placeholder.png'}
                      alt={product.name}
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {t('new')}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{product.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-pink-500">${product.price}</span>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="bg-gradient-to-r from-pink-400 to-pink-500 text-white px-6 py-2 rounded-full hover:from-pink-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                      >
                        {t('addToCart')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
};

export default Home;
