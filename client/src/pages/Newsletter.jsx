import React, { useState } from "react";
import { useLang } from "../utils/lang";

const Newsletter = () => {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [preferences, setPreferences] = useState({
    newProducts: true,
    promotions: true,
    events: false,
    tips: true
  });
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Connect to backend newsletter API
    console.log("Newsletter subscription:", { email, name, preferences });
    setIsSubscribed(true);
    setEmail("");
    setName("");
  };

  const handlePreferenceChange = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 text-center" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
          {t('stayConnected')}
        </h1>

        {!isSubscribed ? (
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Subscription Form */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-pink-100">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {t('subscribeToNewsletter')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('newsletterDescription')}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('fullName')}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('yourName')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('emailAddress')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('emailPlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('communicationPreferences')}
                  </label>
                  <div className="space-y-3">
                    {[
                      { key: 'newProducts', label: t('newProducts'), icon: '🆕' },
                      { key: 'promotions', label: t('offersAndPromotions'), icon: '💰' },
                      { key: 'events', label: t('eventsAndLaunches'), icon: '🎉' },
                      { key: 'tips', label: t('fashionTips'), icon: '💡' }
                    ].map(pref => (
                      <label key={pref.key} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences[pref.key]}
                          onChange={() => handlePreferenceChange(pref.key)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {pref.icon} {pref.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-400 to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-blue-500 hover:to-purple-600 transition-all duration-200 shadow-lg"
                >
                  {t('subscribeFree')}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  {t('privacyConsent')}{' '}
                  <a href="/privacy" className="text-blue-600 hover:underline">{t('privacyPolicy')}</a>
                  {' '}{t('marketingEmails')}
                </p>
              </form>
            </div>

            {/* Benefits Section */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-pink-100">
                <h3 className="text-xl font-bold mb-6 text-gray-800">
                  {t('whySubscribe')}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">🎁</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{t('exclusiveOffers')}</h4>
                      <p className="text-sm text-gray-600">
                        {t('exclusiveOffersDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">🆕</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{t('newProductsFirst')}</h4>
                      <p className="text-sm text-gray-600">
                        {t('newProductsFirstDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">💡</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{t('fashionTips')}</h4>
                      <p className="text-sm text-gray-600">
                        {t('fashionTipsDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">⚡</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{t('fastDelivery')}</h4>
                      <p className="text-sm text-gray-600">
                        {t('fastDeliveryDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-pink-100">
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  {t('communityStats')}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">5,000+</div>
                    <div className="text-sm text-gray-600">{t('activeSubscribers')}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">98%</div>
                    <div className="text-sm text-gray-600">{t('openRate')}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">2x</div>
                    <div className="text-sm text-gray-600">{t('moreOffers')}</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-600">24h</div>
                    <div className="text-sm text-gray-600">{t('earlyAccess')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Success Message */
          <div className="bg-white rounded-2xl p-12 shadow-lg border border-pink-100 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold mb-4 text-green-600">
              {t('congratulations')}
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              {t('newsletterSuccess')}
            </p>
            <div className="bg-green-50 rounded-lg p-6 mb-6">
                              <h3 className="font-semibold mb-2 text-green-800">{t('nextSteps')}:</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✓ {t('checkEmailConfirmation')}</li>
                  <li>✓ {t('addToContacts')}</li>
                  <li>✓ {t('firstEmail24h')}</li>
                </ul>
            </div>
            <button
              onClick={() => setIsSubscribed(false)}
              className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-500 hover:to-purple-600 transition-all duration-200 shadow-lg"
            >
                              {t('subscribeAnotherEmail')}
            </button>
          </div>
        )}

        {/* Privacy & Trust Section */}
        <div className="mt-12 bg-white rounded-2xl p-8 shadow-lg border border-pink-100">
          <h3 className="text-xl font-bold mb-6 text-center text-gray-800">
            {t('privacyImportant')}
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl mb-4">🔒</div>
              <h4 className="font-semibold mb-2">{t('privacy')}</h4>
              <p className="text-sm text-gray-600">
                {t('privacyDesc')}
              </p>
            </div>
            <div>
              <div className="text-3xl mb-4">📧</div>
              <h4 className="font-semibold mb-2">{t('easyUnsubscribe')}</h4>
              <p className="text-sm text-gray-600">
                {t('easyUnsubscribeDesc')}
              </p>
            </div>
            <div>
              <div className="text-3xl mb-4">🎯</div>
              <h4 className="font-semibold mb-2">{t('personalizedContent')}</h4>
              <p className="text-sm text-gray-600">
                {t('personalizedContentDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Newsletter;
