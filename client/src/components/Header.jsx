import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiUser, FiShoppingCart, FiMenu, FiX } from 'react-icons/fi';
import { useLang } from '../utils/lang';
import { useCartContext } from './CartContext';
import AuthBadge from './AuthBadge';

const Header = () => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isSearchExpanded, setSearchExpanded] = useState(false);
  const [isUserPopupOpen, setUserPopupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const { cartCount } = useCartContext();
  
  // Debug logging
  console.log('[Header] Current cartCount:', cartCount);



  const links = [
    { path: '/', label: t('home') },
    { path: '/about', label: t('about') },
    { path: '/products', label: t('products') },
    { path: '/products?category=clothing', label: t('clothingAndAccessories') },
    { path: '/products?category=accessories', label: t('accessories') },
    { path: '/faq', label: t('faq') },
    { path: '/contact', label: t('contactUs') },
  ];

  // Real user state from localStorage
  const isLoggedIn = !!localStorage.getItem("token");
  const user = isLoggedIn ? { name: localStorage.getItem("userName") || 'User' } : null;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to first matching product - implement search logic later
      navigate('/products');
      setSearchExpanded(false);
      setSearchQuery('');
    }
  };

  const handleUserAction = (action) => {
    setUserPopupOpen(false);
    if (action === 'login') {
      navigate('/login');
    } else if (action === 'register') {
      navigate('/signup');
    } else if (action === 'profile') {
      navigate('/account');
    } else if (action === 'logout') {
      // Implement logout logic later
      console.log('Logout clicked');
    }
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  return (
    <header className="fixed top-0 left-0 w-full z-30 bg-gradient-to-r from-pink-100 via-blue-100 to-white shadow-lg border-b-2 border-pink-200">
      <div className="flex justify-between items-center px-4 py-3 rounded-b-3xl shadow-md bg-white/80 backdrop-blur-md mx-2 mt-2 border border-blue-100">
        {/* Left side - Hamburger menu */}
        <div className="flex items-center gap-2 text-blue-400 w-16">
          <button
            onClick={() => setMenuOpen(!isMenuOpen)}
            className="rounded-full bg-pink-200 p-2 border border-pink-300 shadow hover:bg-pink-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pastel-pink focus-visible:ring-offset-2"
            aria-label="Open menu"
          >
            <FiMenu size={22} />
          </button>
        </div>

        {/* Center - Logo */}
        <div className="flex-1 flex justify-center">
          <div className="font-bold text-2xl" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED', letterSpacing: '1px' }}>
            LOGO
          </div>
        </div>

        {/* Right side - Icons, AuthBadge, and Language Toggle */}
        <div className="flex items-center gap-3 justify-end">
          {/* AuthBadge - shows when logged in */}
          <AuthBadge />
          
          {/* Search Icon */}
          <button
            onClick={() => setSearchExpanded(!isSearchExpanded)}
            className="text-blue-400 hover:text-pink-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pastel-pink focus-visible:ring-offset-2 rounded"
            aria-label="Search"
          >
            <FiSearch size={26} />
          </button>

          {/* User Icon - only show when not logged in */}
          {!isLoggedIn && (
                      <button
            onClick={() => setUserPopupOpen(!isUserPopupOpen)}
            className="text-blue-400 hover:text-pink-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pastel-pink focus-visible:ring-offset-2 rounded"
            aria-label="User menu"
          >
              <FiUser size={26} />
            </button>
          )}

          {/* Cart Icon with Badge */}
          <button
            onClick={handleCartClick}
            className="relative text-blue-400 hover:text-pink-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pastel-pink focus-visible:ring-offset-2 rounded"
            aria-label="Cart"
          >
            <FiShoppingCart size={26} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="px-4 py-1 rounded-full bg-pink-200 text-blue-700 font-bold border-2 border-pink-300 hover:bg-pink-300 shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pastel-pink focus-visible:ring-offset-2"
          >
            {lang === 'en' ? 'FR' : 'EN'}
          </button>
        </div>
      </div>

      {/* Expanded Search Bar */}
      {isSearchExpanded && (
        <div className="fixed top-0 left-0 w-full bg-gradient-to-r from-pink-100 via-blue-100 to-white shadow-lg border-b-2 border-pink-200 z-40">
          <div className="flex justify-between items-center px-4 py-2 rounded-b-3xl shadow-md bg-white/80 backdrop-blur-md mx-2 mt-2 border border-blue-100">
            <div className="flex-1"></div>
            <form onSubmit={handleSearch} className="flex items-center gap-3 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchProducts')}
                className="w-full sm:w-64 px-3 py-1.5 rounded-full border border-blue-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold rounded-full shadow-lg hover:from-pink-500 hover:to-pink-600 transition-all duration-300 text-sm"
              >
                Search
              </button>
            </form>
            <button
              onClick={() => setSearchExpanded(false)}
              className="text-blue-400 hover:text-pink-400 transition-colors"
              aria-label="Close search"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
      )}

      {/* User Authentication Popup */}
      {isUserPopupOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-30 z-50" onClick={() => setUserPopupOpen(false)}>
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-pink-100 via-blue-100 to-white rounded-3xl shadow-2xl p-8 w-full max-w-sm sm:max-w-md border border-blue-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-blue-400 mb-2" style={{ fontFamily: 'Fredoka One, cursive' }}>
                {isLoggedIn ? 'Welcome Back!' : 'Welcome'}
              </h2>
              {isLoggedIn && (
                <p className="text-slate-600 mb-4">Hello, {user.name}</p>
              )}
            </div>

            <div className="space-y-3">
              {!isLoggedIn ? (
                <>
                  <button
                    onClick={() => handleUserAction('login')}
                    className="w-full px-6 py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold rounded-full shadow-lg hover:from-pink-500 hover:to-pink-600 transition-all duration-300"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleUserAction('register')}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold rounded-full shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300"
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleUserAction('profile')}
                    className="w-full px-6 py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold rounded-full shadow-lg hover:from-pink-500 hover:to-pink-600 transition-all duration-300"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => handleUserAction('logout')}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold rounded-full shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setUserPopupOpen(false)}
              className="absolute top-4 right-4 text-blue-400 hover:text-pink-400 text-xl"
              aria-label="Close popup"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hamburger Menu */}
      {isMenuOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-30 z-40" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-4 left-4 bg-gradient-to-br from-pink-100 via-blue-100 to-white rounded-3xl shadow-2xl p-6 w-full max-w-xs sm:max-w-sm md:max-w-md max-h-[80vh] overflow-y-auto border border-blue-100 flex flex-col gap-2 animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="self-end mb-2 text-blue-400 hover:text-pink-400"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
            {links.map(({ path, label }) => (
              <a
                key={path}
                href={path}
                className="block w-full text-left px-4 py-2 rounded-full font-semibold text-blue-700 hover:bg-pink-200 hover:text-pink-700 transition"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 