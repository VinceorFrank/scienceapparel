import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useLang } from '../utils/lang';

const Responsibility = () => {
  const { t } = useLang();

  return (
    <div className="flex flex-col min-h-screen w-full overflow-hidden">
      <Header />
      
      <main className="flex-1 mt-28 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="text-center max-w-6xl mx-auto py-8 sm:py-12 lg:py-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight" 
               style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
            {t('responsibility')}
          </h1>
          <div className="w-24 h-1 mx-auto mb-6 rounded-full" 
               style={{ background: 'linear-gradient(90deg, #FECFEF 0%, #A7F0BA 100%)' }} />
          <p className="text-lg sm:text-xl lg:text-2xl mb-8 text-slate-700 max-w-3xl mx-auto leading-relaxed">
            {t('responsibilitySubtitle')}
          </p>
        </section>

        {/* Environmental Initiatives Section */}
        <section className="max-w-6xl mx-auto mb-12 lg:mb-16">
          <div className="bg-gradient-to-br from-green-100 via-blue-100 to-white rounded-3xl shadow-xl p-8 lg:p-12 border border-green-100">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-green-600" 
                style={{ fontFamily: 'Fredoka One, cursive' }}>
              🌱 {t('environmentalInitiatives')}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-green-200">
                <h3 className="text-xl lg:text-2xl font-bold mb-4 text-green-600">
                  {t('ecoPackaging')}
                </h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  {t('ecoPackagingDesc')}
                </p>
                <ul className="space-y-2">
                  {t('ecoPackagingFeatures').map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-slate-600">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-green-200">
                <h3 className="text-xl lg:text-2xl font-bold mb-4 text-green-600">
                  {t('wasteReduction')}
                </h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  {t('wasteReductionDesc')}
                </p>
                <ul className="space-y-2">
                  {t('wasteReductionFeatures').map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-slate-600">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Fair Trade Section */}
        <section className="max-w-6xl mx-auto mb-12 lg:mb-16">
          <div className="bg-gradient-to-br from-orange-100 via-blue-100 to-white rounded-3xl shadow-xl p-8 lg:p-12 border border-orange-100">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-orange-600" 
                style={{ fontFamily: 'Fredoka One, cursive' }}>
              🤝 {t('fairTrade')}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-orange-200">
                <h3 className="text-xl lg:text-2xl font-bold mb-4 text-blue-600">
                  {t('localPartners')}
                </h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  {t('localPartnersDesc')}
                </p>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium italic">
                    "{t('localPartnersStats')}"
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-orange-200">
                <h3 className="text-xl lg:text-2xl font-bold mb-4 text-blue-600">
                  {t('workingConditions')}
                </h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  {t('workingConditionsDesc')}
                </p>
                <ul className="space-y-2">
                  {t('workingConditionsFeatures').map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-slate-600">
                      <span className="text-orange-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Community Engagement Section */}
        <section className="max-w-6xl mx-auto mb-12 lg:mb-16">
          <div className="bg-gradient-to-br from-purple-100 via-blue-100 to-white rounded-3xl shadow-xl p-8 lg:p-12 border border-purple-100">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-purple-600" 
                style={{ fontFamily: 'Fredoka One, cursive' }}>
              🏘️ {t('communityEngagement')}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-purple-200">
                <h3 className="text-xl lg:text-2xl font-bold mb-4 text-blue-600">
                  {t('localDonations')}
                </h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  {t('localDonationsDesc')}
                </p>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <p className="text-sm text-green-800 font-medium italic">
                    "{t('localDonationsStats')}"
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-purple-200">
                <h3 className="text-xl lg:text-2xl font-bold mb-4 text-blue-600">
                  {t('educationalPrograms')}
                </h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  {t('educationalProgramsDesc')}
                </p>
                <ul className="space-y-2">
                  {t('educationalProgramsFeatures').map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-slate-600">
                      <span className="text-purple-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Transparency Section */}
        <section className="max-w-6xl mx-auto mb-12 lg:mb-16">
          <div className="bg-gradient-to-br from-teal-100 via-blue-100 to-white rounded-3xl shadow-xl p-8 lg:p-12 border border-teal-100">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center text-teal-600" 
                style={{ fontFamily: 'Fredoka One, cursive' }}>
              📊 {t('transparency')}
            </h2>
            <p className="text-lg text-slate-600 mb-8 text-center max-w-3xl mx-auto leading-relaxed">
              {t('transparencyDesc')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-2xl p-6 text-center border border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {t('transparencyStats.recyclablePackaging')}
                </div>
                <div className="text-sm text-slate-600">
                  {t('transparencyLabels.recyclablePackaging')}
                </div>
              </div>
              <div className="bg-green-50 rounded-2xl p-6 text-center border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {t('transparencyStats.localSuppliers')}
                </div>
                <div className="text-sm text-slate-600">
                  {t('transparencyLabels.localSuppliers')}
                </div>
              </div>
              <div className="bg-purple-50 rounded-2xl p-6 text-center border border-purple-200">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {t('transparencyStats.profitsDonated')}
                </div>
                <div className="text-sm text-slate-600">
                  {t('transparencyLabels.profitsDonated')}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="max-w-4xl mx-auto mb-12 lg:mb-16">
          <div className="rounded-3xl bg-gradient-to-r from-blue-100 via-pink-100 to-white shadow-xl p-8 lg:p-12 text-center border border-blue-100">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-blue-400" 
                style={{ fontFamily: 'Fredoka One, cursive' }}>
              {t('responsibilityQuestions')}
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              {t('responsibilityContactDesc')}
            </p>
            <Link to="/contact">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-400 to-purple-500 text-white font-bold rounded-full shadow-lg hover:from-blue-500 hover:to-purple-600 transition-all duration-300 transform hover:scale-105">
                {t('contactUs')}
              </button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Responsibility;
