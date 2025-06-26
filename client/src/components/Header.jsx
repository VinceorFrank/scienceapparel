import React, { useState } from 'react';
import { FiSearch, FiUser, FiShoppingCart, FiMenu } from 'react-icons/fi';
import { useLang } from '../utils/lang';

const Header = () => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const { lang, setLang, t } = useLang();

  const links = [
    { path: '/', label: t('home') },
    { path: '/products', label: t('products') },
    { path: '/cart', label: t('cart') },
    { path: '/order-tracking', label: t('orderTracking') },
    { path: '/account', label: t('account') },
    { path: '/about', label: t('about') },
    { path: '/faq', label: t('faq') },
    { path: '/shipping', label: t('shipping') },
    { path: '/reviews', label: t('reviews') },
    { path: '/newsletter', label: t('newsletter') },
    { path: '/responsibility', label: t('responsibility') },
    { path: '/calendly', label: t('calendly') },
    { path: '/complaint', label: t('complaint') },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-30 bg-gradient-to-r from-pink-100 via-blue-100 to-white shadow-lg border-b-2 border-pink-200">
      <div className="flex justify-between items-center px-4 py-3 rounded-b-3xl shadow-md bg-white/80 backdrop-blur-md mx-2 mt-2 border border-blue-100">
        <div className="flex items-center gap-2 text-blue-400">
          <button
            onClick={() => setMenuOpen(!isMenuOpen)}
            className="rounded-full bg-pink-200 p-2 border border-pink-300 shadow hover:bg-pink-300 transition mr-2"
            aria-label="Open menu"
          >
            <FiMenu size={22} />
          </button>
          <FiSearch size={22} />
          <FiUser size={22} />
          <FiShoppingCart size={22} />
        </div>
        <div className="font-bold text-2xl" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED', letterSpacing: '1px' }}>
          LOGO
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="px-4 py-1 rounded-full bg-pink-200 text-blue-700 font-bold border-2 border-pink-300 hover:bg-pink-300 shadow transition"
          >
            {lang === 'en' ? 'FR' : 'EN'}
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-30 z-40" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-4 left-4 bg-gradient-to-br from-pink-100 via-blue-100 to-white rounded-3xl shadow-2xl p-6 w-72 max-h-[80vh] overflow-y-auto border border-blue-100 flex flex-col gap-2 animate-fade-in"
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