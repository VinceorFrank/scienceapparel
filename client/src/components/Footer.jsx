import React from 'react';
import { FaFacebookF, FaInstagram, FaYoutube, FaTiktok, FaLinkedinIn } from 'react-icons/fa';
import { SiAmericanexpress, SiApplepay, SiMastercard, SiShopify, SiVisa } from 'react-icons/si';
import { useLang } from '../utils/lang';

const Footer = () => {
  const { t } = useLang();
  const links = [
    { path: '/', label: t('home') },
    { path: '/about', label: t('about') },
    { path: '/products', label: t('products') },
    { path: '/products?category=clothing', label: t('clothingAndAccessories') },
    { path: '/products?category=accessories', label: t('accessories') },
    { path: '/faq', label: t('faq') },
    { path: '/contact', label: t('contactUs') },
  ];

  // Split links into 3 rows of 4 (last row may have fewer)
  const rows = [
    links.slice(0, 4),
    links.slice(4, 8),
    links.slice(8, 12),
    links.slice(12)
  ];

  return (
    <footer className="w-full bg-gradient-to-r from-pink-100 via-blue-100 to-white py-10 border-t-2 border-pink-200 mt-8">
      <div className="flex flex-col items-center justify-center px-6 max-w-2xl mx-auto rounded-3xl shadow-lg bg-white/80 backdrop-blur-md border border-blue-100 py-8 mb-6">
        <div className="font-bold text-2xl mb-2" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED', letterSpacing: '1px' }}>
          LOGO
        </div>
        <p className="mb-2 text-blue-500 font-semibold">{t('contactUsAt')} <span className="underline">info@example.com</span></p>
        {/* Address */}
        <p className="mb-4 text-slate-500 text-sm">234 Rue Test, Longueuil, QC J4Y2G6 Canada</p>
        {/* Social Media Icons */}
        <div className="flex gap-5 mb-4">
                      <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-blue-500 hover:text-pink-400 text-2xl"><FaFacebookF /></a>
        </div>
        {/* Newsletter Signup */}
        <form className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-md mb-4">
          <input
            type="email"
            placeholder={t('yourEmailAddress')}
            className="flex-1 px-4 py-2 rounded-full border border-blue-100 bg-white shadow focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
          <button type="submit" className="px-6 py-2 rounded-full bg-pink-300 text-white font-bold shadow hover:bg-pink-400 transition">
            {t('subscribe')}
          </button>
        </form>
        {/* Payment Methods */}
        <div className="flex gap-4 mb-4">
          <span className="bg-white rounded-lg shadow p-2 flex items-center"><SiAmericanexpress className="text-blue-600 text-2xl" /></span>
          <span className="bg-white rounded-lg shadow p-2 flex items-center"><SiApplepay className="text-black text-2xl" /></span>
          <span className="bg-white rounded-lg shadow p-2 flex items-center"><SiMastercard className="text-red-500 text-2xl" /></span>
          <span className="bg-white rounded-lg shadow p-2 flex items-center"><SiVisa className="text-blue-800 text-2xl" /></span>
        </div>
      </div>
      {/* Navigation grid */}
      <div className="max-w-3xl mx-auto mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {links.map(({ path, label }) => (
            <a
              key={path}
              href={path}
              className="block text-center px-3 py-2 rounded-full bg-pink-100 text-blue-700 font-semibold shadow hover:bg-blue-100 hover:text-pink-500 transition"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
      <div className="w-full text-center text-xs pt-4 text-blue-400 font-semibold">
        © {new Date().getFullYear()} E-commerce T-shirt. {t('allRightsReserved')}
      </div>
    </footer>
  );
};

export default Footer; 