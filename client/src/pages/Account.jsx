// client/src/pages/Account.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import PastelCard from '../components/PastelCard';
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
      <div className="flex flex-col min-h-screen w-full overflow-hidden bg-[#FCFAF6]">
        <main className="flex-1 px-2 sm:px-4 md:px-8 py-12">
          <section className="text-center max-w-4xl mx-auto mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
              My Account
            </h1>
            <div className="w-24 h-1 mx-auto mb-6 rounded-full" style={{ background: 'linear-gradient(90deg, #FECFEF 0%, #A7F0BA 100%)' }} />
            <p className="text-lg text-slate-700">
              Manage your profile, preferences, and account settings
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {/* Profile Section */}
            <div className="lg:col-span-2 space-y-8">
              {/* Profile Information */}
              <PastelCard className="rounded-3xl bg-gradient-to-r from-blue-100 via-pink-100 to-white shadow-md border border-blue-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-blue-400" style={{ fontFamily: 'Fredoka One, cursive' }}>Profile Information</h2>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="px-4 py-2 bg-pink-300 text-white font-bold rounded-full shadow hover:bg-pink-400 transition"
                  >
                    {editMode ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleProfileSave}
                        className="px-4 py-2 bg-green-400 text-white font-bold rounded-full shadow hover:bg-green-500 transition"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 bg-gray-400 text-white font-bold rounded-full shadow hover:bg-gray-500 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-blue-100 shadow">
                        <span className="text-3xl text-blue-300">👤</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-blue-400" style={{ fontFamily: 'Fredoka One, cursive' }}>{user.name}</h3>
                        <p className="text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </PastelCard>

              {/* Newsletter Preferences */}
              <PastelCard className="rounded-3xl bg-gradient-to-r from-green-100 via-pink-100 to-white shadow-md border border-green-100 p-8">
                <h2 className="text-2xl font-bold text-green-400 mb-6" style={{ fontFamily: 'Fredoka One, cursive' }}>Newsletter Preferences</h2>
                <div className="space-y-6">
                  {/* Subscription Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-green-400">Email Newsletter</h3>
                      <p className="text-sm text-gray-600">Receive updates about new products and promotions</p>
                    </div>
                    <button
                      onClick={handleNewsletterToggle}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors shadow ${
                        user.newsletterSubscribed ? 'bg-blue-400' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${
                          user.newsletterSubscribed ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {user.newsletterSubscribed && (
                    <>
                      {/* Frequency */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Frequency</label>
                        <select
                          value={user.emailFrequency}
                          onChange={handleFrequencyChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      {/* Topics */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Topics of Interest</label>
                        <div className="flex flex-wrap gap-4">
                          {['News', 'Promotions', 'Product Updates', 'Tips & Tricks'].map((topic) => (
                            <label key={topic} className="flex items-center bg-white rounded-full px-4 py-1 shadow border border-blue-100 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={user.topics.includes(topic)}
                                onChange={() => handleTopicToggle(topic)}
                                className="h-4 w-4 text-blue-400 focus:ring-blue-400 border-gray-300 rounded mr-2"
                              />
                              <span className="text-sm text-blue-400 font-semibold" style={{ fontFamily: 'Fredoka One, cursive' }}>{topic}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </PastelCard>

              {/* Notification Settings */}
              <PastelCard className="rounded-3xl bg-gradient-to-r from-purple-100 via-pink-100 to-white shadow-md border border-purple-100 p-8">
                <h2 className="text-2xl font-bold text-purple-400 mb-6" style={{ fontFamily: 'Fredoka One, cursive' }}>Notification Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-400">Email Notifications</h3>
                      <p className="text-sm text-gray-600">Order updates, shipping notifications</p>
                    </div>
                    <button
                      onClick={() => handleChannelToggle('email')}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors shadow ${
                        user.channels.email ? 'bg-blue-400' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${
                          user.channels.email ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-400">SMS Notifications</h3>
                      <p className="text-sm text-gray-600">Order updates, delivery alerts</p>
                    </div>
                    <button
                      onClick={() => handleChannelToggle('sms')}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors shadow ${
                        user.channels.sms ? 'bg-blue-400' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${
                          user.channels.sms ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-400">Push Notifications</h3>
                      <p className="text-sm text-gray-600">Browser notifications for updates</p>
                    </div>
                    <button
                      onClick={() => handleChannelToggle('push')}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors shadow ${
                        user.channels.push ? 'bg-blue-400' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${
                          user.channels.push ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </PastelCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <PastelCard className="rounded-3xl bg-gradient-to-r from-yellow-100 via-pink-100 to-white shadow-md border border-yellow-100 p-8">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4" style={{ fontFamily: 'Fredoka One, cursive' }}>Quick Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={handlePasswordChange}
                    className="w-full px-4 py-2 bg-blue-400 text-white font-bold rounded-full shadow hover:bg-blue-500 transition"
                  >
                    Change Password
                  </button>
                  <Link
                    to="/orders"
                    className="block w-full px-4 py-2 bg-green-400 text-white font-bold rounded-full shadow hover:bg-green-500 transition text-center"
                  >
                    View Orders
                  </Link>
                  <Link
                    to="/addresses"
                    className="block w-full px-4 py-2 bg-purple-400 text-white font-bold rounded-full shadow hover:bg-purple-500 transition text-center"
                  >
                    Manage Addresses
                  </Link>
                </div>
              </PastelCard>

              {/* Preferences */}
              <PastelCard className="rounded-3xl bg-gradient-to-r from-indigo-100 via-blue-100 to-white shadow-md border border-blue-100 p-8">
                <h2 className="text-2xl font-bold text-blue-400 mb-4" style={{ fontFamily: 'Fredoka One, cursive' }}>Preferences</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select
                      value={user.language}
                      onChange={handleLanguageChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                </div>
              </PastelCard>

              {/* Account Management */}
              <PastelCard className="rounded-3xl bg-gradient-to-r from-red-100 via-pink-100 to-white shadow-md border border-red-100 p-8">
                <h2 className="text-2xl font-bold text-red-400 mb-4" style={{ fontFamily: 'Fredoka One, cursive' }}>Account Management</h2>
                <div className="space-y-3">
                  <button
                    onClick={handleDataDownload}
                    className="w-full px-4 py-2 bg-gray-400 text-white font-bold rounded-full shadow hover:bg-gray-500 transition"
                  >
                    Download My Data
                  </button>
                  <button
                    onClick={handleUnsubscribe}
                    className="w-full px-4 py-2 bg-yellow-400 text-white font-bold rounded-full shadow hover:bg-yellow-500 transition"
                  >
                    Unsubscribe from All
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full px-4 py-2 bg-red-400 text-white font-bold rounded-full shadow hover:bg-red-500 transition"
                  >
                    Delete Account
                  </button>
                </div>
              </PastelCard>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default Account;

