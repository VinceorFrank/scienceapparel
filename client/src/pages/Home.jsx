import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { fetchProducts } from "../api/products";
import { addCartItem, getCart } from "../api/cart";
import { toast } from 'react-toastify';
import { useLang } from '../utils/lang';
import { usePageAssets } from '../hooks/usePageAssets';
import { useBlockToggle } from '../hooks/useBlockToggle';
import { useHeroSettings } from '../hooks/useHeroSettings';
import { useMiniButtonSettings } from '../hooks/useMiniButtonSettings';

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
  const { heroEnabled = true, miniEnabled = true, infoAEnabled = true, infoBEnabled = true } = useBlockToggle('home');
  const { buttonPosition = 'bottom', buttonDestination = 'products' } = useHeroSettings('home');
  const { buttonDestination: miniButtonDestination = 'products' } = useMiniButtonSettings('home');
  console.log('[DEBUG] Home component - usePageAssets data:', data);
  const hero = data?.find(a => a.slot === 'hero');
  const infoA = data?.find(a => a.slot === 'infoA');
  const infoB = data?.find(a => a.slot === 'infoB');
  const background = data?.find(a => a.slot === 'background');
  const mini = data?.find(a => a.slot === 'mini');
  
  console.log('[DEBUG] Home component - found assets:', {
    hero: hero?.imageUrl,
    infoA: infoA?.imageUrl,
    infoB: infoB?.imageUrl,
    background: background?.imageUrl,
    mini: mini?.imageUrl
  });

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchProducts();
        setProducts((data.items || data.data || []).slice(0, 6));
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

  // Helper function to get button destination URL
  const getButtonDestination = () => {
    switch (buttonDestination) {
      case 'clothing-accessories':
        return '/clothing-accessories';
      case 'accessories':
        return '/accessories';
      default:
        return '/products';
    }
  };

  // Helper function to get mini button destination URL
  const getMiniButtonDestination = () => {
    switch (miniButtonDestination) {
      case 'clothing-accessories':
        return '/clothing-accessories';
      case 'accessories':
        return '/accessories';
      default:
        return '/products';
    }
  };

  const updateCartQuantities = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      const cart = getGuestCart();
      const quantities = {};
      cart.forEach(item => {
        quantities[item._id] = item.quantity;
      });
      setCartQuantities(quantities);
    } else {
      // Fetch cart from backend for logged-in users
      try {
        const data = await getCart();
        const items = data.data?.cart?.items || data.cart?.items || [];
        const quantities = {};
        items.forEach(item => {
          const id = item.product?._id || item.product || item._id;
          quantities[id] = item.quantity;
        });
        setCartQuantities(quantities);
      } catch {
        setCartQuantities({});
      }
    }
  };

  const handleAddToCart = async (product) => {
    const currentQty = cartQuantities[product._id] || 0;
    if (product.stock === 0) {
      toast.error(`${product.name} is out of stock!`, { position: "top-center", autoClose: 2000 });
      return;
    }
    if (product.stock <= currentQty) {
      toast.warn(`Only ${product.stock} in stock. You already have ${currentQty} in your cart.`, { position: "top-center", autoClose: 3000 });
      return;
    }
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await addCartItem(product._id, 1);
        toast.success(`${product.name} ajouté au panier !`, { position: "top-center", autoClose: 2000 });
        window.dispatchEvent(new Event('cartUpdated'));
        await updateCartQuantities();
      } catch {
        toast.error(t('failedToAddToCart'), { position: "top-center", autoClose: 2000 });
      }
    } else {
      addToGuestCart(product);
      toast.success(`${product.name} ajouté au panier !`, { position: "top-center", autoClose: 2000 });
      const newQty = (cartQuantities[product._id] || 0) + 1;
      setCartQuantities({ ...cartQuantities, [product._id]: newQty });
    }
  };

  // Fallback to ensure component renders
  if (!heroEnabled && !miniEnabled && !infoAEnabled && !infoBEnabled) {
    return (
      <div className="flex flex-col min-h-screen w-full overflow-hidden">
        <Header />
        <main className="flex-1 mt-28 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-gray-700 mb-4">Welcome to our Store!</h1>
            <p className="text-gray-600">All content blocks are currently hidden. Please enable them in the admin panel.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col min-h-screen w-full overflow-hidden"
      style={{
                    backgroundImage: background?.imageUrl ? `url(${background?.imageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {background?.imageUrl && (
        <div 
          className="absolute inset-0"
                      style={{ backgroundColor: `rgba(255,255,255,${background?.overlay ?? 0.1})` }}
        />
      )}
      <Header />
      {/* Hero Section */}
      {heroEnabled && (
        <main className="flex-1 mt-28 px-4 sm:px-6 lg:px-8 relative z-10">
          <section
            className="relative flex items-center justify-center min-h-[70vh] sm:min-h-[60vh] rounded-3xl mx-4 sm:mx-6 lg:mx-8 overflow-hidden"
            style={{
              backgroundImage: hero?.imageUrl ? `url(${hero?.imageUrl})` : 'linear-gradient(to bottom, #fce7f3, #a7f0ba)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
                          {console.log('[DEBUG] Hero section backgroundImage:', hero?.imageUrl ? `url(${hero?.imageUrl})` : 'linear-gradient(to bottom, #fce7f3, #a7f0ba)')}
            {hero?.imageUrl && (
              <div
                className="absolute inset-0"
                style={{ backgroundColor: `rgba(255,255,255,${hero?.overlay ?? 0.2})` }}
              />
            )}
            <div className="relative z-10 w-full text-center max-w-6xl mx-auto py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
              {/* Button at Top */}
              {buttonPosition === 'top' && (
                <div className="mb-8">
                  <Link to={getButtonDestination()}>
                    <button className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold rounded-full shadow-lg hover:from-pink-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-base sm:text-lg">
                      {t('shopNow')}
                    </button>
                  </Link>
                </div>
              )}

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-8 leading-tight sm:leading-normal"
                style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
                {t('newTopics')}
              </h1>

              {/* Button at Middle */}
              {buttonPosition === 'middle' && (
                <div className="mb-8">
                  <Link to={getButtonDestination()}>
                    <button className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold rounded-full shadow-lg hover:from-pink-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-base sm:text-lg">
                      {t('shopNow')}
                    </button>
                  </Link>
                </div>
              )}

              <div className="w-20 sm:w-24 h-1 mx-auto mb-8 sm:mb-10 rounded-full"
                style={{ background: 'linear-gradient(90deg, #FECFEF 0%, #A7F0BA 100%)' }} />
              
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-10 sm:mb-12 text-slate-700 max-w-2xl sm:max-w-3xl mx-auto leading-relaxed px-2">
                {t('discoverProductsLudic')}
              </p>

              {/* Button at Bottom (default) */}
              {buttonPosition === 'bottom' && (
                <Link to={getButtonDestination()}>
                  <button className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold rounded-full shadow-lg hover:from-pink-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-base sm:text-lg">
                    {t('shopNow')}
                  </button>
                </Link>
              )}
            </div>
          </section>

          {/* Spacing between Hero and Info Block */}
          <div className="h-8 sm:h-12 lg:h-16"></div>
        </main>
      )}

      {/* Main content container */}
      <main className="flex-1 mt-28 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Mini Banner Section */}
        {miniEnabled && (
          <section className="max-w-7xl mx-auto mb-8">
            <div 
              className="relative rounded-2xl overflow-hidden shadow-lg"
              style={{
                backgroundImage: mini?.imageUrl ? `url(${mini.imageUrl})` : 'linear-gradient(to right, #fce7f3, #a7f0ba)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: '200px'
              }}
            >
              <div 
                className="absolute inset-0"
                style={{ backgroundColor: `rgba(255,255,255,${mini?.overlay ?? 0.2})` }}
              />
              <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2"
                    style={{ fontFamily: 'Fredoka One, cursive' }}>
                    Special Offer!
                  </h2>
                  <p className="text-lg text-gray-700 mb-4">
                    Discover our latest collection with exclusive deals
                  </p>
                  <Link to={getMiniButtonDestination()}>
                    <button className="px-6 py-2 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold rounded-full shadow-lg hover:from-pink-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105">
                      Shop Now
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* First Info Block Section */}
        {infoAEnabled && (
          <section className="max-w-4xl mx-auto mb-12 lg:mb-16">
          <div 
            className="rounded-3xl shadow-xl p-8 lg:p-12 flex flex-col items-center border border-blue-100 relative overflow-hidden"
            style={{
              backgroundImage: infoA?.imageUrl ? `url(${infoA?.imageUrl})` : 'linear-gradient(to right, #fce7f3, #dbeafe, #ffffff)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {infoA?.imageUrl && (
              <div 
                className="absolute inset-0"
                style={{ backgroundColor: `rgba(255,255,255,${infoA?.overlay ?? 0.2})` }}
              />
            )}
            <div className="relative z-10 text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-blue-400 text-center"
                style={{ fontFamily: 'Fredoka One, cursive' }}>
                {t('whyShopWithUs')}
              </h2>
              <p className="text-lg lg:text-xl text-slate-600 mb-6 text-center max-w-2xl">
                {t('funOriginalTshirts')}
              </p>
              <div className="flex flex-wrap gap-4 justify-center mt-4">
                <div className="bg-pink-200 text-pink-700 rounded-full px-6 py-3 text-sm font-semibold shadow-md hover:bg-pink-300 transition-colors">
                  {t('fastShipping')}
                </div>
                <div className="bg-blue-200 text-blue-700 rounded-full px-6 py-3 text-sm font-semibold shadow-md hover:bg-blue-300 transition-colors">
                  {t('uniqueDesigns')}
                </div>
                <div className="bg-white text-blue-400 border border-blue-100 rounded-full px-6 py-3 text-sm font-semibold shadow-md hover:bg-blue-50 transition-colors">
                  {t('greatQuality')}
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* First Featured Products Section */}
        <section className="max-w-7xl mx-auto py-8 lg:py-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-slate-700"
            style={{ fontFamily: 'Fredoka One, cursive' }}>
            {t('featuredProducts')}
          </h2>
          {loading ? (
            <div className="text-center text-lg text-blue-400">{t('loadingProducts')}</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {products.slice(0, 3).map((product, i) => {
                const isOutOfStock = product.stock === 0;
                const currentQty = cartQuantities[product._id] || 0;
                return (
                  <div key={product._id || i} className="group bg-gradient-to-br from-pink-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 text-center border border-pink-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="relative mb-6">
                      <img
                        src={product.image || '/placeholder.png'}
                        alt={product.name}
                        className="w-32 h-32 mx-auto rounded-2xl shadow-lg border-4 border-white group-hover:scale-105 transition-transform duration-300"
                        onError={e => { e.target.src = '/placeholder.png'; }}
                      />
                      {product.isNew && (
                        <div className="absolute -top-2 -right-2 bg-pink-400 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {t('new')}
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold mb-2"
                      style={{ fontFamily: 'Fredoka One, cursive', color: '#F472B6' }}>
                      {product.name}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                      {product.description}
                    </p>
                    <div className="text-yellow-600 font-semibold mt-1">{t('stock')}: {product.stock}</div>
                    {isOutOfStock && (
                      <div className="text-red-500 font-semibold mt-2">{t('outOfStock')}</div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-pink-500 font-bold text-xl">${product.price?.toFixed(2)}</span>
                      <button
                        className="px-4 py-2 bg-pink-300 text-white font-semibold rounded-full text-sm hover:bg-pink-400 transition-colors disabled:opacity-50"
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock}
                      >
                        {t('addToCart')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* View All Products Button */}
          <div className="text-center mt-8 lg:mt-12">
            <Link to="/products">
              <button className="px-8 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold rounded-full shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105">
                {t('viewAllProducts')}
              </button>
            </Link>
          </div>
        </section>

        {/* Second Info Block Section */}
        {infoBEnabled && (
          <section className="max-w-4xl mx-auto mb-12 lg:mb-16">
          <div 
            className="rounded-3xl shadow-xl p-8 lg:p-12 flex flex-col items-center border border-blue-100 relative overflow-hidden"
            style={{
              backgroundImage: infoB?.imageUrl ? `url(${infoB?.imageUrl})` : 'linear-gradient(to right, #fce7f3, #dbeafe, #ffffff)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {infoB?.imageUrl && (
              <div 
                className="absolute inset-0"
                style={{ backgroundColor: `rgba(255,255,255,${infoB?.overlay ?? 0.2})` }}
              />
            )}
            <div className="relative z-10 text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-blue-400 text-center"
                style={{ fontFamily: 'Fredoka One, cursive' }}>
                {t('whyShopWithUs')}
              </h2>
              <p className="text-lg lg:text-xl text-slate-600 mb-6 text-center max-w-2xl">
                {t('funOriginalTshirts')}
              </p>
              <div className="flex flex-wrap gap-4 justify-center mt-4">
                <div className="bg-pink-200 text-pink-700 rounded-full px-6 py-3 text-sm font-semibold shadow-md hover:bg-pink-300 transition-colors">
                  {t('fastShipping')}
                </div>
                <div className="bg-blue-200 text-blue-700 rounded-full px-6 py-3 text-sm font-semibold shadow-md hover:bg-blue-300 transition-colors">
                  {t('uniqueDesigns')}
                </div>
                <div className="bg-white text-blue-400 border border-blue-100 rounded-full px-6 py-3 text-sm font-semibold shadow-md hover:bg-blue-50 transition-colors">
                  {t('greatQuality')}
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Second Featured Products Section */}
        <section className="max-w-7xl mx-auto py-8 lg:py-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-slate-700"
            style={{ fontFamily: 'Fredoka One, cursive' }}>
            {t('featuredProducts')}
          </h2>
          {loading ? (
            <div className="text-center text-lg text-blue-400">{t('loadingProducts')}</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {products.slice(3, 6).map((product, i) => {
                const isOutOfStock = product.stock === 0;
                const currentQty = cartQuantities[product._id] || 0;
                return (
                  <div key={product._id || i} className="group bg-gradient-to-br from-pink-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 text-center border border-pink-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="relative mb-6">
                      <img
                        src={product.image || '/placeholder.png'}
                        alt={product.name}
                        className="w-32 h-32 mx-auto rounded-2xl shadow-lg border-4 border-white group-hover:scale-105 transition-transform duration-300"
                        onError={e => { e.target.src = '/placeholder.png'; }}
                      />
                      {product.isNew && (
                        <div className="absolute -top-2 -right-2 bg-pink-400 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {t('new')}
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold mb-2"
                      style={{ fontFamily: 'Fredoka One, cursive', color: '#F472B6' }}>
                      {product.name}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                      {product.description}
                    </p>
                    <div className="text-yellow-600 font-semibold mt-1">{t('stock')}: {product.stock}</div>
                    {isOutOfStock && (
                      <div className="text-red-500 font-semibold mt-2">{t('outOfStock')}</div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-pink-500 font-bold text-xl">${product.price?.toFixed(2)}</span>
                      <button
                        className="px-4 py-2 bg-pink-300 text-white font-semibold rounded-full text-sm hover:bg-pink-400 transition-colors disabled:opacity-50"
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock}
                      >
                        {t('addToCart')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* View All Products Button */}
          <div className="text-center mt-8 lg:mt-12">
            <Link to="/products">
              <button className="px-8 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold rounded-full shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105">
                {t('viewAllProducts')}
              </button>
            </Link>
          </div>
        </section>

        {/* Newsletter Signup Section - Bottom */}
        <section className="max-w-4xl mx-auto mb-12 lg:mb-16">
          <div className="rounded-3xl bg-gradient-to-r from-blue-100 via-pink-100 to-white shadow-xl p-8 lg:p-12 text-center border border-pink-100">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-blue-400"
              style={{ fontFamily: 'Fredoka One, cursive' }}>
              {t('stayConnected')}
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              {t('newsletterDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder={t('emailPlaceholder')}
                className="flex-1 px-6 py-3 rounded-full border border-blue-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              />
              <button className="px-8 py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold rounded-full shadow-lg hover:from-pink-500 hover:to-pink-600 transition-all duration-300">
                {t('subscribe')}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
