import React, { useState } from 'react';
import { FiMail, FiPhone, FiMapPin, FiClock } from 'react-icons/fi';
import Header from '../components/Header';
import { useLang } from '../utils/lang';

const Contact = () => {
  const { t } = useLang();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset status after 3 seconds
      setTimeout(() => setSubmitStatus(null), 3000);
    }, 1500);
  };

  const contactInfo = [
    {
      icon: <FiMail className="text-2xl" />,
      title: t('email'),
      value: 'support@example.com',
      description: t('emailDescription')
    },
    {
      icon: <FiPhone className="text-2xl" />,
      title: t('phone'),
      value: '+1 (514) 555-0123',
      description: t('phoneDescription')
    },
    {
      icon: <FiMapPin className="text-2xl" />,
      title: t('address'),
      value: t('addressValue'),
      description: t('addressDescription')
    },
    {
      icon: <FiClock className="text-2xl" />,
      title: t('hours'),
      value: t('hoursValue'),
      description: t('hoursDescription')
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
            {t('contactUs')}
          </h1>
          <div className="w-24 h-1 mx-auto mb-6 rounded-full" 
               style={{ background: 'linear-gradient(90deg, #FECFEF 0%, #A7F0BA 100%)' }} />
          <p className="text-lg sm:text-xl lg:text-2xl mb-8 text-slate-700 max-w-3xl mx-auto leading-relaxed">
            {t('contactSubtitle')}
          </p>
        </section>

        {/* Contact Form and Info Section */}
        <section className="max-w-6xl mx-auto mb-12 lg:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Form */}
            <div className="bg-gradient-to-br from-pink-100 via-blue-100 to-white rounded-3xl shadow-xl p-8 lg:p-12 border border-pink-100">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-blue-400" 
                  style={{ fontFamily: 'Fredoka One, cursive' }}>
                {t('sendUsMessage')}
              </h2>
              
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-2xl text-green-700">
                  {t('messageSentSuccess')}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                      {t('name')} *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-2xl border border-blue-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder={t('namePlaceholder')}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                      {t('email')} *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-2xl border border-blue-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder={t('emailPlaceholder')}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-2">
                    {t('subject')} *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-blue-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder={t('subjectPlaceholder')}
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
                    {t('message')} *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-2xl border border-blue-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent resize-none"
                    placeholder={t('messagePlaceholder')}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-8 py-4 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold rounded-2xl shadow-lg hover:from-pink-500 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('sending') : t('sendMessage')}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-100 via-pink-100 to-white rounded-3xl shadow-xl p-8 lg:p-12 border border-blue-100">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-blue-400" 
                    style={{ fontFamily: 'Fredoka One, cursive' }}>
                  {t('getInTouch')}
                </h2>
                
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-pink-200 rounded-2xl flex items-center justify-center text-pink-600">
                        {info.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-700 mb-1">{info.title}</h3>
                        <p className="text-blue-400 font-medium mb-1">{info.value}</p>
                        <p className="text-sm text-slate-600">{info.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-gradient-to-br from-green-100 via-blue-100 to-white rounded-3xl shadow-xl p-8 lg:p-12 border border-green-100">
                <h3 className="text-xl font-bold mb-4 text-green-400" 
                    style={{ fontFamily: 'Fredoka One, cursive' }}>
                  {t('visitUs')}
                </h3>
                <div className="bg-white rounded-2xl shadow-md h-48 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🗺️</div>
                    <p className="text-slate-600">{t('mapPlaceholder')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto mb-12 lg:mb-16">
          <div className="rounded-3xl bg-gradient-to-r from-pink-100 via-blue-100 to-white shadow-xl p-8 lg:p-12 text-center border border-pink-100">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-blue-400" 
                style={{ fontFamily: 'Fredoka One, cursive' }}>
              {t('frequentlyAsked')}
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              {t('faqContactText')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-md">
                <div className="text-2xl mb-2">📧</div>
                <h3 className="font-semibold text-slate-700 mb-1">{t('email')}</h3>
                <p className="text-blue-400 text-sm">support@example.com</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-md">
                <div className="text-2xl mb-2">📞</div>
                <h3 className="font-semibold text-slate-700 mb-1">{t('phone')}</h3>
                <p className="text-blue-400 text-sm">+1 (514) 555-0123</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-md">
                <div className="text-2xl mb-2">⏰</div>
                <h3 className="font-semibold text-slate-700 mb-1">{t('hours')}</h3>
                <p className="text-blue-400 text-sm">{t('hoursText')}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Contact; 