import React from 'react';
import { useLang } from '../utils/lang';

const About = () => {
  const { t } = useLang();

  return (
    <div className="flex flex-col min-h-screen w-full overflow-hidden">
      
      <main className="flex-1 mt-28 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="text-center max-w-6xl mx-auto py-8 sm:py-12 lg:py-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight" 
               style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
            {t('about')}
          </h1>
          <div className="w-24 h-1 mx-auto mb-6 rounded-full" 
               style={{ background: 'linear-gradient(90deg, #FECFEF 0%, #A7F0BA 100%)' }} />
          <p className="text-lg sm:text-xl lg:text-2xl mb-8 text-slate-700 max-w-3xl mx-auto leading-relaxed">
            {t('aboutSubtitle')}
          </p>
        </section>

        {/* Mission Section */}
        <section className="max-w-6xl mx-auto mb-12 lg:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-blue-400" 
                  style={{ fontFamily: 'Fredoka One, cursive' }}>
                {t('ourMission')}
              </h2>
              <p className="text-lg text-slate-600 mb-4 leading-relaxed">
                {t('missionText1')}
              </p>
              <p className="text-lg text-slate-600 mb-4 leading-relaxed">
                {t('missionText2')}
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                {t('missionText3')}
              </p>
            </div>
            <div className="order-1 lg:order-2">
              <img 
                src="/placeholder.png" 
                alt="Our Mission" 
                className="w-full h-64 lg:h-80 object-cover rounded-3xl shadow-xl border-4 border-white" 
              />
            </div>
          </div>
        </section>

        {/* Origin Story Section */}
        <section className="max-w-6xl mx-auto mb-12 lg:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <img 
                src="/placeholder.png" 
                alt="Our Story" 
                className="w-full h-64 lg:h-80 object-cover rounded-3xl shadow-xl border-4 border-white" 
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-pink-400" 
                  style={{ fontFamily: 'Fredoka One, cursive' }}>
                {t('ourStory')}
              </h2>
              <p className="text-lg text-slate-600 mb-4 leading-relaxed">
                {t('storyText1')}
              </p>
              <p className="text-lg text-slate-600 mb-4 leading-relaxed">
                {t('storyText2')}
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                {t('storyText3')}
              </p>
            </div>
          </div>
        </section>

        {/* Team Message Section */}
        <section className="max-w-6xl mx-auto mb-12 lg:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-blue-400" 
                  style={{ fontFamily: 'Fredoka One, cursive' }}>
                {t('teamMessage')}
              </h2>
              <p className="text-lg text-slate-600 mb-4 leading-relaxed">
                {t('teamText1')}
              </p>
              <p className="text-lg text-slate-600 mb-4 leading-relaxed">
                {t('teamText2')}
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                {t('teamText3')}
              </p>
            </div>
            <div className="order-1 lg:order-2">
              <img 
                src="/placeholder.png" 
                alt="Our Team" 
                className="w-full h-64 lg:h-80 object-cover rounded-3xl shadow-xl border-4 border-white" 
              />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="max-w-6xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-slate-700" 
              style={{ fontFamily: 'Fredoka One, cursive' }}>
            {t('whatOurCustomersSay')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                name: t('customerName1'),
                text: t('testimonial1'),
                rating: 5
              },
              {
                name: t('customerName2'),
                text: t('testimonial2'),
                rating: 5
              },
              {
                name: t('customerName3'),
                text: t('testimonial3'),
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-pink-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-pink-100">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
                <p className="text-slate-600 mb-4 italic leading-relaxed">
                  "{testimonial.text}"
                </p>
                <p className="font-semibold text-blue-400">
                  — {testimonial.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Values Section */}
        <section className="max-w-4xl mx-auto mb-12 lg:mb-16">
          <div className="rounded-3xl bg-gradient-to-r from-blue-100 via-pink-100 to-white shadow-xl p-8 lg:p-12 text-center border border-blue-100">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-blue-400" 
                style={{ fontFamily: 'Fredoka One, cursive' }}>
              {t('ourValues')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🎨</div>
                <h3 className="text-lg font-semibold mb-2 text-pink-500">{t('creativity')}</h3>
                <p className="text-slate-600">{t('creativityDesc')}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🌱</div>
                <h3 className="text-lg font-semibold mb-2 text-green-500">{t('sustainability')}</h3>
                <p className="text-slate-600">{t('sustainabilityDesc')}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🤝</div>
                <h3 className="text-lg font-semibold mb-2 text-blue-500">{t('community')}</h3>
                <p className="text-slate-600">{t('communityDesc')}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;
