// client/src/pages/Account.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useLang } from '../utils/lang';
import { getProfile, updateProfile, getPreferences, updatePreferences } from '../api/users';

const TOPICS = ['news', 'promotions', 'productUpdates', 'tipsAndTricks'];

const Account = () => {
  const { t } = useLang();
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const profileRes = await getProfile();
        const userData = profileRes.data || profileRes.user || profileRes;
        setUser(userData);
        setEditEmail(userData.email || '');
        setEditName(userData.name || '');
        try {
          const prefRes = await getPreferences();
          setPreferences(prefRes.preferences || prefRes.data || prefRes);
        } catch {
          setPreferences(null);
        }
      } catch (err) {
        setError(err.message || t('failedToLoadAccountData'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Profile edit handlers
  const handleProfileSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await updateProfile({ name: editName, email: editEmail });
      setUser(res.user || res.data || { name: editName, email: editEmail });
      setEditMode(false);
      setSuccess(t('profileUpdated'));
    } catch (err) {
      setError(err.message || t('failedToUpdateProfile'));
    } finally {
      setLoading(false);
    }
  };

  // Newsletter toggle
  const handleNewsletterToggle = async () => {
    if (!preferences) return;
    const updated = { ...preferences, newsletter: !preferences.newsletter };
    setPreferences(updated);
    try {
      await updatePreferences(updated);
      setSuccess('Preferences updated!');
    } catch (err) {
      setError('Failed to update preferences');
    }
  };

  // Frequency change
  const handleFrequencyChange = async (e) => {
    if (!preferences) return;
    const updated = { ...preferences, emailFrequency: e.target.value };
    setPreferences(updated);
    try {
      await updatePreferences(updated);
      setSuccess('Preferences updated!');
    } catch (err) {
      setError('Failed to update preferences');
    }
  };

  // Topic toggle
  const handleTopicToggle = async (topic) => {
    if (!preferences) return;
    const topics = preferences.topics || [];
    const updatedTopics = topics.includes(topic)
      ? topics.filter(t => t !== topic)
      : [...topics, topic];
    const updated = { ...preferences, topics: updatedTopics };
    setPreferences(updated);
    try {
      await updatePreferences(updated);
      setSuccess('Preferences updated!');
    } catch (err) {
      setError('Failed to update preferences');
    }
  };

  // Language change
  const handleLanguageChange = async (e) => {
    if (!preferences) return;
    const updated = { ...preferences, language: e.target.value };
    setPreferences(updated);
    try {
      await updatePreferences(updated);
      setSuccess('Preferences updated!');
    } catch (err) {
      setError('Failed to update preferences');
    }
  };

  // Channel toggle
  const handleChannelToggle = async (channel) => {
    if (!preferences) return;
    const updatedChannels = {
      ...((preferences.channels || { email: true, sms: false, push: false })),
      [channel]: !preferences.channels?.[channel]
    };
    const updated = { ...preferences, channels: updatedChannels };
    setPreferences(updated);
    try {
      await updatePreferences(updated);
      setSuccess('Preferences updated!');
    } catch (err) {
      setError('Failed to update preferences');
    }
  };

  // Account management actions (alerts only)
  const handleUnsubscribe = () => alert('Unsubscribe coming soon!');
  const handleDeleteAccount = () => alert('Delete account coming soon!');
  const handleDataDownload = () => alert('Data download coming soon!');
  const handlePasswordChange = () => alert('Password change coming soon!');

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    // Optionally clear guest cart
    // localStorage.removeItem('guestCart');
    navigate('/login');
  };

  if (loading) {
    return (
      <PageLayout slug="account">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PageLayout>
    );
  }
  if (error) {
    return (
      <PageLayout slug="account">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl mb-4 block">❌</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('error')}</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('backToHome')}
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout slug="account">
      <div className="flex flex-col min-h-screen w-full overflow-hidden bg-gradient-to-br from-green-50 via-yellow-50 to-white">
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-12">
          <section className="text-center max-w-4xl mx-auto mb-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight" 
                 style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
              {t('myAccount')}
            </h1>
            <div className="w-24 h-1 mx-auto mb-6 rounded-full" 
                 style={{ background: 'linear-gradient(90deg, #FECFEF 0%, #A7F0BA 100%)' }} />
            <p className="text-lg sm:text-xl text-slate-700 max-w-2xl mx-auto leading-relaxed">
              {t('manageAccountDesc')}
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {/* Profile Section */}
            <div className="lg:col-span-2 space-y-8">
              {/* Profile Information */}
              <div className="group bg-gradient-to-br from-yellow-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-yellow-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-blue-400" 
                      style={{ fontFamily: 'Fredoka One, cursive' }}>
                    {t('profileInformation')}
                  </h2>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="px-6 py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold rounded-2xl shadow-lg hover:from-pink-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                  >
                    {editMode ? t('cancel') : t('editProfile')}
                  </button>
                </div>
                {editMode ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">{t('name')}</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full px-4 py-3 border border-blue-200 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">{t('email')}</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-blue-200 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      />
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={handleProfileSave}
                        className="px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-bold rounded-2xl shadow-lg hover:from-green-500 hover:to-green-600 transition-all duration-300 transform hover:scale-105"
                      >
                        {t('saveChanges')}
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold rounded-2xl shadow-lg hover:from-gray-500 hover:to-gray-600 transition-all duration-300 transform hover:scale-105"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6">
                      <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-pink-500 rounded-3xl flex items-center justify-center shadow-lg">
                        <span className="text-4xl">👤</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-blue-400 mb-2" 
                            style={{ fontFamily: 'Fredoka One, cursive' }}>
                          {user?.name}
                        </h3>
                        <p className="text-lg text-slate-600">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Newsletter Preferences */}
              <div className="group bg-gradient-to-br from-yellow-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-yellow-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                                  <h2 className="text-2xl md:text-3xl font-bold text-green-400 mb-6" 
                      style={{ fontFamily: 'Fredoka One, cursive' }}>
                    {t('newsletterPreferences')}
                  </h2>
                <div className="space-y-6">
                  {/* Subscription Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-green-400">{t('emailNewsletter')}</h3>
                      <p className="text-sm text-slate-600">{t('receiveUpdatesDesc')}</p>
                    </div>
                    <button
                      onClick={handleNewsletterToggle}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors shadow-lg ${
                        preferences?.newsletter ? 'bg-gradient-to-r from-pink-400 to-pink-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow ${
                          preferences?.newsletter ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {/* Frequency */}
                  {preferences?.newsletter && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">{t('emailFrequency')}</label>
                      <select
                        value={preferences?.emailFrequency || 'weekly'}
                        onChange={handleFrequencyChange}
                        className="w-full px-4 py-3 border border-blue-200 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      >
                        <option value="daily">{t('daily')}</option>
                        <option value="weekly">{t('weekly')}</option>
                        <option value="monthly">{t('monthly')}</option>
                      </select>
                    </div>
                  )}
                  {/* Topics */}
                  {preferences?.newsletter && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">{t('topicsOfInterest')}</label>
                      <div className="flex flex-wrap gap-3">
                        {TOPICS.map((topic) => (
                          <label key={topic} className="flex items-center bg-white rounded-2xl px-4 py-2 shadow-md border border-blue-100 cursor-pointer hover:shadow-lg transition-all duration-300">
                            <input
                              type="checkbox"
                              checked={preferences.topics?.includes(topic) || false}
                              onChange={() => handleTopicToggle(topic)}
                              className="h-4 w-4 text-pink-400 focus:ring-pink-300 border-gray-300 rounded mr-2"
                            />
                            <span className="text-sm text-blue-400 font-semibold" 
                                  style={{ fontFamily: 'Fredoka One, cursive' }}>
                              {topic}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notification Settings */}
              <div className="group bg-gradient-to-br from-yellow-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-yellow-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                                  <h2 className="text-2xl md:text-3xl font-bold text-purple-400 mb-6" 
                      style={{ fontFamily: 'Fredoka One, cursive' }}>
                    {t('notificationSettings')}
                  </h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-400">{t('emailNotifications')}</h3>
                      <p className="text-sm text-slate-600">{t('orderUpdatesDesc')}</p>
                    </div>
                    <button
                      onClick={() => handleChannelToggle('email')}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors shadow-lg ${
                        preferences?.channels?.email ? 'bg-gradient-to-r from-pink-400 to-pink-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow ${
                          preferences?.channels?.email ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-400">{t('smsNotifications')}</h3>
                      <p className="text-sm text-slate-600">{t('deliveryAlertsDesc')}</p>
                    </div>
                    <button
                      onClick={() => handleChannelToggle('sms')}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors shadow-lg ${
                        preferences?.channels?.sms ? 'bg-gradient-to-r from-pink-400 to-pink-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow ${
                          preferences?.channels?.sms ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-400">{t('pushNotifications')}</h3>
                      <p className="text-sm text-slate-600">{t('browserNotificationsDesc')}</p>
                    </div>
                    <button
                      onClick={() => handleChannelToggle('push')}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors shadow-lg ${
                        preferences?.channels?.push ? 'bg-gradient-to-r from-pink-400 to-pink-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow ${
                          preferences?.channels?.push ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* EXTRA for Customer */}
              <div className="group bg-gradient-to-br from-yellow-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-yellow-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                                  <h2 className="text-2xl md:text-3xl font-bold text-pink-400 mb-6" 
                      style={{ fontFamily: 'Fredoka One, cursive' }}>
                    {t('extraForCustomer')}
                  </h2>
                <div className="space-y-4">
                  <Link
                    to="/responsibility"
                    className="block w-full px-6 py-3 bg-gradient-to-r from-blue-100 via-blue-300 to-white text-blue-700 font-bold rounded-2xl shadow-md hover:from-blue-200 hover:to-blue-400 hover:text-blue-800 transition-all duration-300 transform hover:-translate-y-1 text-center"
                    style={{ fontFamily: 'Fredoka One, cursive' }}
                  >
                    {t('socialResponsibility')}
                  </Link>
                  <Link
                    to="/order-tracking"
                    className="block w-full px-6 py-3 bg-gradient-to-r from-blue-100 via-blue-300 to-white text-blue-700 font-bold rounded-2xl shadow-md hover:from-blue-200 hover:to-blue-400 hover:text-blue-800 transition-all duration-300 transform hover:-translate-y-1 text-center"
                    style={{ fontFamily: 'Fredoka One, cursive' }}
                  >
                    {t('trackMyOrder')}
                  </Link>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8 flex flex-col h-full justify-between">
              <div>
                {/* Quick Actions */}
                <div className="group bg-gradient-to-br from-yellow-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-yellow-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <h2 className="text-2xl font-bold text-yellow-400 mb-6" 
                      style={{ fontFamily: 'Fredoka One, cursive' }}>
                    {t('quickActions')}
                  </h2>
                  <div className="space-y-4">
                    <button
                      onClick={handlePasswordChange}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-100 via-blue-300 to-white text-blue-700 font-bold rounded-2xl shadow-md hover:from-blue-200 hover:to-blue-400 hover:text-blue-800 transition-all duration-300 transform hover:-translate-y-1"
                      style={{ fontFamily: 'Fredoka One, cursive' }}
                    >
                      {t('changePassword')}
                    </button>
                    <Link
                      to="/orders"
                      className="block w-full px-6 py-3 bg-gradient-to-r from-green-100 via-green-300 to-white text-green-700 font-bold rounded-2xl shadow-md hover:from-green-200 hover:to-green-400 hover:text-green-800 transition-all duration-300 transform hover:-translate-y-1 text-center"
                      style={{ fontFamily: 'Fredoka One, cursive' }}
                    >
                      {t('viewOrders')}
                    </Link>
                    <Link
                      to="/addresses"
                      className="block w-full px-6 py-3 bg-gradient-to-r from-purple-100 via-purple-300 to-white text-purple-700 font-bold rounded-2xl shadow-md hover:from-purple-200 hover:to-purple-400 hover:text-purple-800 transition-all duration-300 transform hover:-translate-y-1 text-center"
                      style={{ fontFamily: 'Fredoka One, cursive' }}
                    >
                      {t('manageAddresses')}
                    </Link>
                  </div>
                </div>

                {/* Preferences */}
                <div className="group bg-gradient-to-br from-yellow-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-yellow-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <h2 className="text-2xl font-bold text-blue-400 mb-6" 
                      style={{ fontFamily: 'Fredoka One, cursive' }}>
                    {t('preferences')}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">{t('language')}</label>
                      <select
                        value={preferences?.language || 'en'}
                        onChange={handleLanguageChange}
                        className="w-full px-4 py-3 border border-blue-200 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      >
                        <option value="en">{t('english')}</option>
                        <option value="es">{t('spanish')}</option>
                        <option value="fr">{t('french')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Account Management */}
                <div className="group bg-gradient-to-br from-yellow-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-yellow-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <h2 className="text-2xl font-bold text-red-400 mb-6" 
                      style={{ fontFamily: 'Fredoka One, cursive' }}>
                    {t('accountManagement')}
                  </h2>
                  <div className="space-y-4">
                    <button
                      onClick={handleDataDownload}
                      className="w-full px-6 py-3 bg-gradient-to-r from-gray-100 via-gray-300 to-white text-gray-700 font-bold rounded-2xl shadow-md hover:from-gray-200 hover:to-gray-400 hover:text-gray-800 transition-all duration-300 transform hover:-translate-y-1"
                      style={{ fontFamily: 'Fredoka One, cursive' }}
                    >
                      {t('downloadMyData')}
                    </button>
                    <button
                      onClick={handleUnsubscribe}
                      className="w-full px-6 py-3 bg-gradient-to-r from-yellow-100 via-yellow-300 to-white text-yellow-700 font-bold rounded-2xl shadow-md hover:from-yellow-200 hover:to-yellow-400 hover:text-yellow-800 transition-all duration-300 transform hover:-translate-y-1"
                      style={{ fontFamily: 'Fredoka One, cursive' }}
                    >
                      {t('unsubscribeFromAll')}
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      className="w-full px-6 py-3 bg-gradient-to-r from-pink-100 via-red-200 to-white text-red-600 font-bold rounded-2xl shadow-md hover:from-pink-200 hover:to-red-300 hover:text-red-700 transition-all duration-300 transform hover:-translate-y-1"
                      style={{ fontFamily: 'Fredoka One, cursive' }}
                    >
                      {t('deleteAccount')}
                    </button>
                  </div>
                </div>
              </div>
              {/* Disconnect Button at the bottom */}
              <div className="mt-8">
                <button
                  onClick={handleLogout}
                  className="w-full px-6 py-3 bg-gradient-to-r from-red-200 via-red-300 to-white text-red-700 font-bold rounded-2xl shadow-md hover:from-red-300 hover:to-red-400 hover:text-red-800 transition-all duration-300 transform hover:-translate-y-1 text-center"
                  style={{ fontFamily: 'Fredoka One, cursive', boxShadow: '0 4px 24px 0 rgba(255,0,0,0.08)' }}
                >
                  {t('disconnect')}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageLayout>
  );
};

export default Account;

