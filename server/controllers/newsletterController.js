const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const NewsletterCampaign = require('../models/NewsletterCampaign');
const transporter = require('../utils/mailer');

// Subscribe a new email
const subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    let subscriber = await NewsletterSubscriber.findOne({ email });
    if (subscriber && subscriber.status === 'subscribed') {
      return res.status(200).json({ message: 'Already subscribed.' });
    }
    if (subscriber && subscriber.status === 'unsubscribed') {
      subscriber.status = 'subscribed';
      subscriber.subscribedAt = new Date();
      subscriber.unsubscribedAt = undefined;
      await subscriber.save();
      return res.status(200).json({ message: 'Resubscribed successfully.' });
    }
    // New subscriber
    await NewsletterSubscriber.create({ email });
    res.status(201).json({ message: 'Subscribed successfully.' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists.' });
    }
    res.status(500).json({ message: 'Error subscribing to newsletter.' });
  }
};

// Unsubscribe an email
const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;
    const subscriber = await NewsletterSubscriber.findOne({ email });
    if (!subscriber || subscriber.status === 'unsubscribed') {
      return res.status(404).json({ message: 'Email not found or already unsubscribed.' });
    }
    subscriber.status = 'unsubscribed';
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();
    res.json({ message: 'Unsubscribed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error unsubscribing from newsletter.' });
  }
};

// List all subscribers (admin only)
const listSubscribers = async (req, res) => {
  try {
    const subscribers = await NewsletterSubscriber.find({ status: 'subscribed' }).sort({ subscribedAt: -1 });
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscribers.' });
  }
};

// Send newsletter to all subscribers
const sendNewsletter = async (req, res) => {
  try {
    const { subject, message, html, scheduledAt } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required.' });
    }
    
    // Get all subscribed emails
    const subscribers = await NewsletterSubscriber.find({ status: 'subscribed' });
    const emails = subscribers.map(sub => sub.email);
    
    if (emails.length === 0) {
      return res.status(400).json({ message: 'No subscribers to send to.' });
    }
    
    // If scheduled, create campaign record but don't send yet
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate <= new Date()) {
        return res.status(400).json({ message: 'Scheduled date must be in the future.' });
      }
      
      await NewsletterCampaign.create({
        subject,
        message,
        html: html || `<p>${message}</p>`,
        recipientCount: emails.length,
        sentBy: req.user._id,
        status: 'scheduled',
        scheduledAt: scheduledDate,
        isScheduled: true
      });
      
      return res.json({ 
        message: `Newsletter scheduled for ${scheduledDate.toLocaleString()}.` 
      });
    }
    
    // Send immediately
    const mailOptions = {
      from: process.env.SMTP_USER || 'no-reply@example.com',
      bcc: emails,
      subject,
      text: message,
      html: html || `<p>${message}</p>`
    };
    
    await transporter.sendMail(mailOptions);
    
    // Log the campaign
    await NewsletterCampaign.create({
      subject,
      message,
      html: html || `<p>${message}</p>`,
      recipientCount: emails.length,
      sentBy: req.user._id,
      status: 'sent',
      sentAt: new Date()
    });
    
    res.json({ message: `Newsletter sent to ${emails.length} subscribers.` });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    
    // Log failed campaign
    try {
      await NewsletterCampaign.create({
        subject: req.body.subject || 'Unknown',
        message: req.body.message || '',
        html: req.body.html || '',
        recipientCount: 0,
        sentBy: req.user._id,
        status: 'failed',
        errorMessage: error.message
      });
    } catch (logError) {
      console.error('Error logging failed campaign:', logError);
    }
    
    res.status(500).json({ message: 'Error sending newsletter.' });
  }
};

// Cancel scheduled newsletter
const cancelScheduledNewsletter = async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const campaign = await NewsletterCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found.' });
    }
    
    if (campaign.status !== 'scheduled') {
      return res.status(400).json({ message: 'Only scheduled campaigns can be cancelled.' });
    }
    
    campaign.status = 'cancelled';
    await campaign.save();
    
    res.json({ message: 'Scheduled newsletter cancelled successfully.' });
  } catch (error) {
    console.error('Error cancelling scheduled newsletter:', error);
    res.status(500).json({ message: 'Error cancelling scheduled newsletter.' });
  }
};

// Get scheduled newsletters
const getScheduledNewsletters = async (req, res) => {
  try {
    const scheduledCampaigns = await NewsletterCampaign.find({
      status: 'scheduled',
      scheduledAt: { $gt: new Date() }
    })
    .populate('sentBy', 'name email')
    .sort({ scheduledAt: 1 });
    
    res.json(scheduledCampaigns);
  } catch (error) {
    console.error('Error fetching scheduled newsletters:', error);
    res.status(500).json({ message: 'Error fetching scheduled newsletters.' });
  }
};

// Get campaign history (admin only)
const getCampaignHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    
    // Get campaigns with pagination
    const campaigns = await NewsletterCampaign.find(query)
      .populate('sentBy', 'name email')
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await NewsletterCampaign.countDocuments(query);
    
    res.json({
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching campaign history:', error);
    res.status(500).json({ message: 'Error fetching campaign history.' });
  }
};

// Get campaign statistics
const getCampaignStats = async (req, res) => {
  try {
    const stats = await NewsletterCampaign.aggregate([
      {
        $group: {
          _id: null,
          totalCampaigns: { $sum: 1 },
          totalRecipients: { $sum: '$recipientCount' },
          successfulCampaigns: {
            $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
          },
          failedCampaigns: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);
    
    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentStats = await NewsletterCampaign.aggregate([
      {
        $match: { sentAt: { $gte: thirtyDaysAgo } }
      },
      {
        $group: {
          _id: null,
          recentCampaigns: { $sum: 1 },
          recentRecipients: { $sum: '$recipientCount' }
        }
      }
    ]);
    
    const result = {
      ...stats[0],
      recentActivity: recentStats[0] || { recentCampaigns: 0, recentRecipients: 0 }
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    res.status(500).json({ message: 'Error fetching campaign statistics.' });
  }
};

module.exports = {
  subscribe,
  unsubscribe,
  listSubscribers,
  sendNewsletter,
  cancelScheduledNewsletter,
  getScheduledNewsletters,
  getCampaignHistory,
  getCampaignStats,
}; 