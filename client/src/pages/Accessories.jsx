import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../utils/lang";
import { getProducts } from "../api/products";
import { addCartItem } from "../api/cart";

const Accessories = () => {
  const { t } = useLang();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartMessage, setCartMessage] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getProducts();
        // Filter for accessories only
        const accessoriesProducts = data.filter(product => 
          product.category && product.category.toLowerCase().includes('accessory') ||
          product.category && product.category.toLowerCase().includes('accessoires')
        );
        setProducts(accessoriesProducts);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleAddToCart = async (product) => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await addCartItem(product._id, 1);
        setCartMessage(`${product.name} ${t('addedToCart')} !`);
        window.dispatchEvent(new Event('cartUpdated'));
      } catch (err) {
        setCartMessage(t('errorAddingToCart'));
      }
    } else {
      let guestCart = [];
      try {
        guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
      } catch { 
        guestCart = []; 
      }
      const existing = guestCart.find((item) => item._id === product._id);
      if (existing) {
        existing.quantity += 1;
      } else {
        guestCart.push({ ...product, quantity: 1 });
      }
      localStorage.setItem("guestCart", JSON.stringify(guestCart));
      setCartMessage(`${product.name} ${t('addedToCartGuest')} !`);
      window.dispatchEvent(new Event('cartUpdated'));
    }
    setTimeout(() => setCartMessage(""), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400 mb-4">{t('loadingProducts')}</div>
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-500 mb-4">{t('errorLoadingProducts')}</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-pink-100 to-blue-100 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-700"
            style={{ fontFamily: 'Fredoka One, cursive' }}>
            {t('accessories')}
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            {t('accessoriesDescription')}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/products">
              <button className="px-8 py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold rounded-full shadow-lg hover:from-pink-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105">
                {t('viewAllProducts')}
              </button>
            </Link>
            <Link to="/clothing-accessories">
              <button className="px-8 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold rounded-full shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105">
                {t('clothingAndAccessories')}
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Cart Message */}
      {cartMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg">
          {cartMessage}
        </div>
      )}

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto py-12 px-4">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-3xl font-bold text-slate-400 mb-4">🎒</div>
            <h2 className="text-2xl font-bold text-slate-600 mb-4">{t('noAccessoriesFound')}</h2>
            <p className="text-slate-500 mb-8">{t('checkBackLater')}</p>
            <Link to="/products">
              <button className="px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold rounded-full shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300">
                {t('browseAllProducts')}
              </button>
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-700"
              style={{ fontFamily: 'Fredoka One, cursive' }}>
              {t('ourAccessories')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => {
                const isOutOfStock = product.stock === 0;
                return (
                  <div key={product._id} className="group bg-gradient-to-br from-pink-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 text-center border border-pink-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
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
                    <div className="flex items-center justify-between mt-4">
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
          </>
        )}
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-blue-100 to-pink-100 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-700"
            style={{ fontFamily: 'Fredoka One, cursive' }}>
            {t('completeYourLook')}
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            {t('accessoriesCompleteLook')}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/products">
              <button className="px-8 py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold rounded-full shadow-lg hover:from-pink-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105">
                {t('shopNow')}
              </button>
            </Link>
            <Link to="/contact">
              <button className="px-8 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold rounded-full shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105">
                {t('contactUs')}
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Accessories; 