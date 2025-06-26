import React, { useState } from 'react';
import { useNewsletterManagement } from '../../hooks/useNewsletterManagement';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useLang } from '../../utils/lang';

const NewsletterAdmin = () => {
  const {
    subject,
    setSubject,
    message,
    setMessage,
    html,
    setHtml,
    scheduledAt,
    setScheduledAt,
    subscribers,
    loadingSubscribers,
    subscribersError,
    campaigns,
    campaignPagination,
    loadingCampaigns,
    campaignsError,
    scheduledCampaigns,
    loadingScheduled,
    scheduledError,
    campaignStats,
    loadingStats,
    statsError,
    handleSendNewsletter,
    handleCancelScheduled,
    handleUnsubscribe,
    sending,
    cancelling,
    unsubscribing
  } = useNewsletterManagement();

  const [sendMode, setSendMode] = useState('immediate'); // 'immediate' or 'scheduled'

  const { t } = useLang();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // Minimum 1 minute from now
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="min-h-screen bg-[#FCFAF6] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
          {t('newsletterManagement')}
        </h1>

        {/* Statistics Overview */}
        {!loadingStats && campaignStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('totalCampaigns')}</h3>
              <p className="text-3xl font-bold" style={{ color: '#6DD5ED' }}>
                {campaignStats.totalCampaigns || 0}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('totalRecipients')}</h3>
              <p className="text-3xl font-bold" style={{ color: '#6DD5ED' }}>
                {campaignStats.totalRecipients || 0}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('successRate')}</h3>
              <p className="text-3xl font-bold text-green-600">
                {campaignStats.totalCampaigns > 0 
                  ? Math.round((campaignStats.successfulCampaigns / campaignStats.totalCampaigns) * 100)
                  : 0}%
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('last30Days')}</h3>
              <p className="text-3xl font-bold" style={{ color: '#6DD5ED' }}>
                {campaignStats.recentActivity?.recentCampaigns || 0}
              </p>
            </div>
          </div>
        )}

        {/* Compose Newsletter */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-8 border border-blue-100">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#6DD5ED' }}>{t('sendNewsletter')}</h2>
          <form onSubmit={e => handleSendNewsletter(e, html)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('subject')}</label>
              <input
                type="text"
                className="w-full border border-gray-300 p-3 rounded-lg"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('messageRichText')}</label>
              <ReactQuill
                theme="snow"
                value={html}
                onChange={setHtml}
                className="bg-white"
                style={{ minHeight: 180 }}
              />
            </div>
            
            {/* Send Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('sendMode') || 'Send Mode'}</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="sendMode"
                    value="immediate"
                    checked={sendMode === 'immediate'}
                    onChange={(e) => setSendMode(e.target.value)}
                    className="mr-2"
                  />
                  {t('sendImmediately')}
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="sendMode"
                    value="scheduled"
                    checked={sendMode === 'scheduled'}
                    onChange={(e) => setSendMode(e.target.value)}
                    className="mr-2"
                  />
                  {t('scheduleForLater')}
                </label>
              </div>
            </div>

            {/* Schedule DateTime Picker */}
            {sendMode === 'scheduled' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-300 p-3 rounded-lg"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  min={getMinDateTime()}
                  required={sendMode === 'scheduled'}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Minimum: 1 minute from now
                </p>
              </div>
            )}

            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-full font-bold shadow hover:bg-blue-600 transition"
              disabled={sending}
            >
              {sending ? 'Sending...' : sendMode === 'scheduled' ? 'Schedule Newsletter' : 'Send Newsletter'}
            </button>
          </form>
        </div>

        {/* Scheduled Newsletters */}
        {scheduledCampaigns.length > 0 && (
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8 border border-blue-100">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#6DD5ED' }}>{t('scheduledNewsletters')}</h2>
            {loadingScheduled ? (
              <div className="text-gray-500">Loading scheduled newsletters...</div>
            ) : scheduledError ? (
              <div className="text-red-500">Error loading scheduled newsletters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">{t('subject')}</th>
                      <th className="text-left py-3 px-4 font-semibold">{t('scheduledFor')}</th>
                      <th className="text-left py-3 px-4 font-semibold">{t('recipients')}</th>
                      <th className="text-left py-3 px-4 font-semibold">{t('sentBy')}</th>
                      <th className="text-left py-3 px-4 font-semibold">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledCampaigns.map((campaign) => (
                      <tr key={campaign._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{campaign.subject}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {campaign.message.substring(0, 100)}...
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(campaign.scheduledAt)}
                        </td>
                        <td className="py-3 px-4">{campaign.recipientCount}</td>
                        <td className="py-3 px-4">
                          {campaign.sentBy?.name || campaign.sentBy?.email || 'Unknown'}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleCancelScheduled(campaign._id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                            disabled={cancelling}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Campaign History */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-8 border border-blue-100">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#6DD5ED' }}>Campaign History</h2>
          {loadingCampaigns ? (
            <div className="text-gray-500">Loading campaigns...</div>
          ) : campaignsError ? (
            <div className="text-red-500">Error loading campaigns.</div>
          ) : campaigns.length === 0 ? (
            <div className="text-gray-500">No campaigns sent yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Subject</th>
                    <th className="text-left py-3 px-4 font-semibold">Recipients</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Sent By</th>
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{campaign.subject}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {campaign.message.substring(0, 100)}...
                        </div>
                      </td>
                      <td className="py-3 px-4">{campaign.recipientCount}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {campaign.sentBy?.name || campaign.sentBy?.email || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(campaign.sentAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Subscribers List */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-blue-100">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#6DD5ED' }}>Subscribers</h2>
          {loadingSubscribers ? (
            <div className="text-gray-500">Loading subscribers...</div>
          ) : subscribersError ? (
            <div className="text-red-500">Error loading subscribers.</div>
          ) : subscribers.length === 0 ? (
            <div className="text-gray-500">No subscribers yet.</div>
          ) : (
            <ul>
              {subscribers.map((sub, idx) => (
                <li key={sub._id || idx} className="border-b py-2 flex items-center justify-between">
                  <span>{sub.email}</span>
                  <button
                    onClick={() => handleUnsubscribe(sub.email)}
                    className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                    disabled={unsubscribing}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsletterAdmin; 