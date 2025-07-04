import React from 'react';
import Header from '../components/Header';
import { useLang } from '../utils/lang';

const Home = () => {
  const { t } = useLang();

  return (
    <div className="flex flex-col min-h-screen w-full overflow-hidden bg-[#FCFAF6]">
      <Header />
      <main className="flex-1 mt-28 px-4">
        <section className="text-center max-w-4xl mx-auto py-12">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-2" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
            {t('newTopics')}
          </h1>
          <div className="w-24 h-1 mx-auto mb-6 rounded-full" style={{ background: 'linear-gradient(90deg, #FECFEF 0%, #A7F0BA 100%)' }} />
          <p className="text-xl mb-8 text-slate-700">
            {t('discoverProductsLudic')}
          </p>
          <button className="px-8 py-3 bg-pink-300 text-white font-bold rounded-full shadow-lg hover:bg-pink-400 transition">
            {t('shopNow')}
          </button>
        </section>

        {/* Pastel Info Block */}
        <section className="max-w-3xl mx-auto mb-12">
          <div className="rounded-3xl bg-gradient-to-r from-pink-100 via-blue-100 to-white shadow-md p-8 flex flex-col items-center border border-blue-100">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-blue-400" style={{ fontFamily: 'Fredoka One, cursive' }}>
              {t('whyShopWithUs')}
            </h2>
            <p className="text-lg text-slate-600 mb-2">
              {t('funOriginalTshirts')}
            </p>
            <ul className="flex flex-wrap gap-4 justify-center mt-2">
              <li className="bg-pink-200 text-pink-700 rounded-full px-4 py-1 text-sm font-semibold shadow">{t('fastShipping')}</li>
              <li className="bg-blue-200 text-blue-700 rounded-full px-4 py-1 text-sm font-semibold shadow">{t('uniqueDesigns')}</li>
              <li className="bg-white text-blue-400 border border-blue-100 rounded-full px-4 py-1 text-sm font-semibold shadow">{t('greatQuality')}</li>
            </ul>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 max-w-5xl mx-auto py-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gradient-to-br from-pink-100 via-blue-100 to-white rounded-3xl shadow-xl p-8 text-center border border-pink-100 hover:shadow-2xl transition">
              <img src="/placeholder.png" alt="Product" className="w-32 h-32 mx-auto mb-4 rounded-2xl shadow-md border-4 border-white" />
              <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: 'Fredoka One, cursive', color: '#F472B6' }}>{t('product')} {i}</h2>
              <p className="text-sm text-slate-500 mb-2">{t('descriptionHere')}</p>
              <span className="text-pink-500 font-bold text-lg">$19.99</span>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Home;
