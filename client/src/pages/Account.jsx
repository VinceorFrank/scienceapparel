// client/src/pages/Account.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useLang } from '../utils/lang';

const Account = () => {
  const { t } = useLang();
  const [user, setUser] = useState({
    name: 'Jane Doe',
    email: 'jane@example.com',
    profilePicture: '',
    newsletterSubscribed: true,
    emailFrequency: 'weekly',
    topics: ['News', 'Promotions'],
    language: 'en',
    channels: { email: true, sms: false, push: false },
  });
  const [editMode, setEditMode] = useState(false);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editName, setEditName] = useState(user.name);
  const [editPassword, setEditPassword] = useState('');

  const handleProfileSave = () => {
    setUser({ ...user, name: editName, email: editEmail });
    setEditMode(false);
  };

  const handlePasswordChange = () => {
    alert('Password change coming soon!');
  };

  const handleNewsletterToggle = () => {
    setUser({ ...user, newsletterSubscribed: !user.newsletterSubscribed });
  };

  const handleFrequencyChange = (e) => {
    setUser({ ...user, emailFrequency: e.target.value });
  };

  const handleTopicToggle = (topic) => {
    setUser({
      ...user,
      topics: user.topics.includes(topic)
        ? user.topics.filter(t => t !== topic)
        : [...user.topics, topic],
    });
  };

  const handleLanguageChange = (e) => {
    setUser({ ...user, language: e.target.value });
  };

  const handleChannelToggle = (channel) => {
    setUser({
      ...user,
      channels: { ...user.channels, [channel]: !user.channels[channel] },
    });
  };

  const handleUnsubscribe = () => {
    alert('Unsubscribe coming soon!');
  };

  const handleDeleteAccount = () => {
    alert('Delete account coming soon!');
  };

  const handleDataDownload = () => {
    alert('Data download coming soon!');
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-screen w-full overflow-hidden bg-gradient-to-br from-green-50 via-yellow-50 to-white">
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-12">
          <section className="text-center max-w-4xl mx-auto mb-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight" 
                 style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
              My Account
            </h1>
            <div className="w-24 h-1 mx-auto mb-6 rounded-full" 
                 style={{ background: 'linear-gradient(90deg, #FECFEF 0%, #A7F0BA 100%)' }} />
            <p className="text-lg sm:text-xl text-slate-700 max-w-2xl mx-auto leading-relaxed">
              Manage your profile, preferences, and account settings
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
                    Profile Information
                  </h2>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="px-6 py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold rounded-2xl shadow-lg hover:from-pink-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                  >
                    {editMode ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {editMode ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-4 py-3 border border-blue-200 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-blue-200 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      />
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={handleProfileSave}
                        className="px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-bold rounded-2xl shadow-lg hover:from-green-500 hover:to-green-600 transition-all duration-300 transform hover:scale-105"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold rounded-2xl shadow-lg hover:from-gray-500 hover:to-gray-600 transition-all duration-300 transform hover:scale-105"
                      >
                        Cancel
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
                          {user.name}
                        </h3>
                        <p className="text-lg text-slate-600">{user.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Newsletter Preferences */}
              <div className="group bg-gradient-to-br from-yellow-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-yellow-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-green-400 mb-6" 
                    style={{ fontFamily: 'Fredoka One, cursive' }}>
                  Newsletter Preferences
                </h2>
                <div className="space-y-6">
                  {/* Subscription Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-green-400">Email Newsletter</h3>
                      <p className="text-sm text-slate-600">Receive updates about new products and promotions</p>
                    </div>
                    <button
                      onClick={handleNewsletterToggle}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors shadow-lg ${
                        user.newsletterSubscribed ? 'bg-gradient-to-r from-pink-400 to-pink-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow ${
                          user.newsletterSubscribed ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {user.newsletterSubscribed && (
                    <>
                      {/* Frequency */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email Frequency</label>
                        <select
                          value={user.emailFrequency}
                          onChange={handleFrequencyChange}
                          className="w-full px-4 py-3 border border-blue-200 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      {/* Topics */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Topics of Interest</label>
                        <div className="flex flex-wrap gap-3">
                          {['News', 'Promotions', 'Product Updates', 'Tips & Tricks'].map((topic) => (
                            <label key={topic} className="flex items-center bg-white rounded-2xl px-4 py-2 shadow-md border border-blue-100 cursor-pointer hover:shadow-lg transition-all duration-300">
                              <input
                                type="checkbox"
                                checked={user.topics.includes(topic)}
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
                    </>
                  )}
                </div>
              </div>

              {/* Notification Settings */}
              <div className="group bg-gradient-to-br from-yellow-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-yellow-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-purple-400 mb-6" 
                    style={{ fontFamily: 'Fredoka One, cursive' }}>
                  Notification Settings
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-400">Email Notifications</h3>
                      <p className="text-sm text-slate-600">Order updates, shipping notifications</p>
                    </div>
                    <button
                      onClick={() => handleChannelToggle('email')}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors shadow-lg ${
                        user.channels.email ? 'bg-gradient-to-r from-pink-400 to-pink-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow ${
                          user.channels.email ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-400">SMS Notifications</h3>
                      <p className="text-sm text-slate-600">Order updates, delivery alerts</p>
                    </div>
                    <button
                      onClick={() => handleChannelToggle('sms')}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors shadow-lg ${
                        user.channels.sms ? 'bg-gradient-to-r from-pink-400 to-pink-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow ${
                          user.channels.sms ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-400">Push Notifications</h3>
                      <p className="text-sm text-slate-600">Browser notifications for updates</p>
                    </div>
                    <button
                      onClick={() => handleChannelToggle('push')}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors shadow-lg ${
                        user.channels.push ? 'bg-gradient-to-r from-pink-400 to-pink-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow ${
                          user.channels.push ? 'translate-x-8' : 'translate-x-1'
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
                  EXTRA for Customer
                </h2>
                <div className="space-y-4">
                  <Link
                    to="/responsibility"
                    className="block w-full px-6 py-3 bg-gradient-to-r from-blue-100 via-blue-300 to-white text-blue-700 font-bold rounded-2xl shadow-md hover:from-blue-200 hover:to-blue-400 hover:text-blue-800 transition-all duration-300 transform hover:-translate-y-1 text-center"
                    style={{ fontFamily: 'Fredoka One, cursive' }}
                  >
                    Social Responsibility
                  </Link>
                  {/* Add more links here in the future */}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="group bg-gradient-to-br from-yellow-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-yellow-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <h2 className="text-2xl font-bold text-yellow-400 mb-6" 
                    style={{ fontFamily: 'Fredoka One, cursive' }}>
                  Quick Actions
                </h2>
                <div className="space-y-4">
                  <button
                    onClick={handlePasswordChange}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-100 via-blue-300 to-white text-blue-700 font-bold rounded-2xl shadow-md hover:from-blue-200 hover:to-blue-400 hover:text-blue-800 transition-all duration-300 transform hover:-translate-y-1"
                    style={{ fontFamily: 'Fredoka One, cursive' }}
                  >
                    Change Password
                  </button>
                  <Link
                    to="/orders"
                    className="block w-full px-6 py-3 bg-gradient-to-r from-green-100 via-green-300 to-white text-green-700 font-bold rounded-2xl shadow-md hover:from-green-200 hover:to-green-400 hover:text-green-800 transition-all duration-300 transform hover:-translate-y-1 text-center"
                    style={{ fontFamily: 'Fredoka One, cursive' }}
                  >
                    View Orders
                  </Link>
                  <Link
                    to="/addresses"
                    className="block w-full px-6 py-3 bg-gradient-to-r from-purple-100 via-purple-300 to-white text-purple-700 font-bold rounded-2xl shadow-md hover:from-purple-200 hover:to-purple-400 hover:text-purple-800 transition-all duration-300 transform hover:-translate-y-1 text-center"
                    style={{ fontFamily: 'Fredoka One, cursive' }}
                  >
                    Manage Addresses
                  </Link>
                </div>
              </div>

              {/* Preferences */}
              <div className="group bg-gradient-to-br from-yellow-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-yellow-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <h2 className="text-2xl font-bold text-blue-400 mb-6" 
                    style={{ fontFamily: 'Fredoka One, cursive' }}>
                  Preferences
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Language</label>
                    <select
                      value={user.language}
                      onChange={handleLanguageChange}
                      className="w-full px-4 py-3 border border-blue-200 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Account Management */}
              <div className="group bg-gradient-to-br from-yellow-100 via-blue-100 to-white rounded-3xl shadow-xl p-6 lg:p-8 border border-yellow-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <h2 className="text-2xl font-bold text-red-400 mb-6" 
                    style={{ fontFamily: 'Fredoka One, cursive' }}>
                  Account Management
                </h2>
                <div className="space-y-4">
                  <button
                    onClick={handleDataDownload}
                    className="w-full px-6 py-3 bg-gradient-to-r from-gray-100 via-gray-300 to-white text-gray-700 font-bold rounded-2xl shadow-md hover:from-gray-200 hover:to-gray-400 hover:text-gray-800 transition-all duration-300 transform hover:-translate-y-1"
                    style={{ fontFamily: 'Fredoka One, cursive' }}
                  >
                    Download My Data
                  </button>
                  <button
                    onClick={handleUnsubscribe}
                    className="w-full px-6 py-3 bg-gradient-to-r from-yellow-100 via-yellow-300 to-white text-yellow-700 font-bold rounded-2xl shadow-md hover:from-yellow-200 hover:to-yellow-400 hover:text-yellow-800 transition-all duration-300 transform hover:-translate-y-1"
                    style={{ fontFamily: 'Fredoka One, cursive' }}
                  >
                    Unsubscribe from All
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full px-6 py-3 bg-gradient-to-r from-pink-100 via-red-200 to-white text-red-600 font-bold rounded-2xl shadow-md hover:from-pink-200 hover:to-red-300 hover:text-red-700 transition-all duration-300 transform hover:-translate-y-1"
                    style={{ fontFamily: 'Fredoka One, cursive' }}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default Account;

