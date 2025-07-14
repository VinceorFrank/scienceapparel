import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useLang } from '../utils/lang';
import { fetchProducts } from '../api/products';
import { addCartItem } from '../api/cart';
import { toast } from 'react-toastify';

const getGuestCart = () => {
  try {
    return JSON.parse(localStorage.getItem('guestCart')) || [];
  } catch {
    return [];
  }
};
const setGuestCart = (cart) => {
  localStorage.setItem('guestCart', JSON.stringify(cart));
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

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchProducts();
        setProducts((data.items || data.data || []).slice(0, 6));
      } catch (err) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleAddToCart = async (product) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await addCartItem(product._id, 1);
        toast.success(`${product.name} added to cart!`);
        window.dispatchEvent(new Event('cartUpdated'));
      } catch {
        toast.error('Failed to add to cart.');
      }
    } else {
      addToGuestCart(product);
      toast.success(`${product.name} added to cart!`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full overflow-hidden">
      <Header />
      
      {/* Hero Section */}
      <main className="flex-1 mt-28 px-4 sm:px-6 lg:px-8">
        <section className="text-center max-w-6xl mx-auto py-8 sm:py-12 lg:py-16">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight" 
                 style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
              {t('newTopics')}
            </h1>
            <div className="w-24 h-1 mx-auto mb-6 rounded-full" 
                 style={{ background: 'linear-gradient(90deg, #FECFEF 0%, #A7F0BA 100%)' }} />
            <p className="text-lg sm:text-xl lg:text-2xl mb-8 text-slate-700 max-w-3xl mx-auto leading-relaxed">
              {t('discoverProductsLudic')}
            </p>
            <Link to="/products">
              <button className="px-8 py-4 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold rounded-full shadow-lg hover:from-pink-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-lg">
                {t('shopNow')}
              </button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-4xl mx-auto mb-12 lg:mb-16">
          <div className="rounded-3xl bg-gradient-to-r from-pink-100 via-blue-100 to-white shadow-xl p-8 lg:p-12 flex flex-col items-center border border-blue-100">
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
        </section>

        {/* Featured Products Section */}
        <section className="max-w-7xl mx-auto py-8 lg:py-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-slate-700" 
              style={{ fontFamily: 'Fredoka One, cursive' }}>
            {t('featuredProducts')}
          </h2>
          {loading ? (
            <div className="text-center text-lg text-blue-400">Loading products...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {products.map((product, i) => (
                <div key={product._id || i} className="group bg-gradient-to-br from-pink-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 text-center border border-pink-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="relative mb-6">
                    <img 
                      src={product.image || '/placeholder.png'} 
                      alt={product.name} 
                      className="w-32 h-32 mx-auto rounded-2xl shadow-lg border-4 border-white group-hover:scale-105 transition-transform duration-300" 
                    />
                    {product.featured && (
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
                  <div className="flex items-center justify-between">
                    <span className="text-pink-500 font-bold text-xl">${product.price?.toFixed(2)}</span>
                    <button
                      className="px-4 py-2 bg-pink-300 text-white font-semibold rounded-full text-sm hover:bg-pink-400 transition-colors"
                      onClick={() => handleAddToCart(product)}
                    >
                      {t('addToCart') || 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
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
        <section className="max-w-4xl mx-auto mb-12 lg:mb-16">
          <div className="rounded-3xl bg-gradient-to-r from-pink-100 via-blue-100 to-white shadow-xl p-8 lg:p-12 flex flex-col items-center border border-blue-100">
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
        </section>

        {/* Second Featured Products Section */}
        <section className="max-w-7xl mx-auto py-8 lg:py-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-slate-700" 
              style={{ fontFamily: 'Fredoka One, cursive' }}>
            {t('featuredProducts')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[4, 5, 6].map((i) => (
              <div key={i} className="group bg-gradient-to-br from-pink-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 text-center border border-pink-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative mb-6">
                  <img 
                    src="/placeholder.png" 
                    alt={`${t('product')} ${i}`} 
                    className="w-32 h-32 mx-auto rounded-2xl shadow-lg border-4 border-white group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute -top-2 -right-2 bg-pink-400 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {t('new')}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2" 
                    style={{ fontFamily: 'Fredoka One, cursive', color: '#F472B6' }}>
                  {t('product')} {i}
                </h3>
                <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                  {t('descriptionHere')}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-pink-500 font-bold text-xl">$24.99</span>
                  <button className="px-4 py-2 bg-pink-300 text-white font-semibold rounded-full text-sm hover:bg-pink-400 transition-colors">
                    {t('viewDetails')}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
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
