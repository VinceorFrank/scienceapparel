import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLang } from '../utils/lang';

const FAQ = () => {
  const { t } = useLang();
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (id) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const faqCategories = [
    {
      title: t('faqOrders'),
      items: [
        {
          id: 'order1',
          question: t('faqOrderQ1'),
          answer: t('faqOrderA1')
        },
        {
          id: 'order2',
          question: t('faqOrderQ2'),
          answer: t('faqOrderA2')
        },
        {
          id: 'order3',
          question: t('faqOrderQ3'),
          answer: t('faqOrderA3')
        },
        {
          id: 'order4',
          question: t('faqOrderQ4'),
          answer: t('faqOrderA4')
        }
      ]
    },
    {
      title: t('faqShipping'),
      items: [
        {
          id: 'shipping1',
          question: t('faqShippingQ1'),
          answer: t('faqShippingA1')
        },
        {
          id: 'shipping2',
          question: t('faqShippingQ2'),
          answer: t('faqShippingA2')
        },
        {
          id: 'shipping3',
          question: t('faqShippingQ3'),
          answer: t('faqShippingA3')
        }
      ]
    },
    {
      title: t('faqProducts'),
      items: [
        {
          id: 'product1',
          question: t('faqProductQ1'),
          answer: t('faqProductA1')
        },
        {
          id: 'product2',
          question: t('faqProductQ2'),
          answer: t('faqProductA2')
        },
        {
          id: 'product3',
          question: t('faqProductQ3'),
          answer: t('faqProductA3')
        }
      ]
    },
    {
      title: t('faqReturns'),
      items: [
        {
          id: 'return1',
          question: t('faqReturnQ1'),
          answer: t('faqReturnA1')
        },
        {
          id: 'return2',
          question: t('faqReturnQ2'),
          answer: t('faqReturnA2')
        },
        {
          id: 'return3',
          question: t('faqReturnQ3'),
          answer: t('faqReturnA3')
        }
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen w-full overflow-hidden">
      <Header />
      
      <main className="flex-1 mt-28 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="text-center max-w-6xl mx-auto py-8 sm:py-12 lg:py-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight" 
               style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
            {t('faq')}
          </h1>
          <div className="w-24 h-1 mx-auto mb-6 rounded-full" 
               style={{ background: 'linear-gradient(90deg, #FECFEF 0%, #A7F0BA 100%)' }} />
          <p className="text-lg sm:text-xl lg:text-2xl mb-8 text-slate-700 max-w-3xl mx-auto leading-relaxed">
            {t('faqSubtitle')}
          </p>
        </section>

        {/* FAQ Categories */}
        <section className="max-w-4xl mx-auto mb-12 lg:mb-16">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-blue-400 text-center" 
                  style={{ fontFamily: 'Fredoka One, cursive' }}>
                {category.title}
              </h2>
              <div className="space-y-4">
                {category.items.map((item) => (
                  <div key={item.id} className="bg-gradient-to-r from-pink-100 via-blue-100 to-white rounded-2xl shadow-lg border border-pink-100 overflow-hidden">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-pink-50 transition-colors"
                    >
                      <span className="font-semibold text-slate-700 text-lg">
                        {item.question}
                      </span>
                      {openItems[item.id] ? (
                        <FiChevronUp className="text-blue-400 text-xl" />
                      ) : (
                        <FiChevronDown className="text-blue-400 text-xl" />
                      )}
                    </button>
                    {openItems[item.id] && (
                      <div className="px-6 pb-4">
                        <div className="border-t border-pink-200 pt-4">
                          <p className="text-slate-600 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Contact Section */}
        <section className="max-w-4xl mx-auto mb-12 lg:mb-16">
          <div className="rounded-3xl bg-gradient-to-r from-blue-100 via-pink-100 to-white shadow-xl p-8 lg:p-12 text-center border border-pink-100">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-blue-400" 
                style={{ fontFamily: 'Fredoka One, cursive' }}>
              {t('faqStillHaveQuestions')}
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              {t('faqContactText')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="bg-white rounded-2xl p-4 shadow-md">
                <div className="text-2xl mb-2">📧</div>
                <h3 className="font-semibold text-slate-700 mb-1">{t('email')}</h3>
                <p className="text-blue-400">support@example.com</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-md">
                <div className="text-2xl mb-2">📞</div>
                <h3 className="font-semibold text-slate-700 mb-1">{t('phone')}</h3>
                <p className="text-blue-400">+1 (514) 555-0123</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-md">
                <div className="text-2xl mb-2">⏰</div>
                <h3 className="font-semibold text-slate-700 mb-1">{t('hours')}</h3>
                <p className="text-blue-400">{t('hoursText')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="max-w-4xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-slate-700" 
              style={{ fontFamily: 'Fredoka One, cursive' }}>
            {t('faqQuickLinks')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: t('shipping'), icon: '🚚', link: '/shipping' },
              { title: t('returns'), icon: '↩️', link: '/returns' },
              { title: t('sizeGuide'), icon: '📏', link: '/size-guide' },
              { title: t('careInstructions'), icon: '👕', link: '/care' },
              { title: t('privacyPolicy'), icon: '🔒', link: '/privacy' },
              { title: t('termsOfService'), icon: '📋', link: '/terms' }
            ].map((item, index) => (
              <a
                key={index}
                href={item.link}
                className="bg-gradient-to-br from-pink-100 via-blue-100 to-white rounded-2xl shadow-lg p-6 text-center border border-pink-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-slate-700">{item.title}</h3>
              </a>
            ))}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default FAQ;
