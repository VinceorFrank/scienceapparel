const NewsletterSubscriber = require('../models/NewsletterSubscriber');
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
    const { subject, message, html } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required.' });
    }
    // Get all subscribed emails
    const subscribers = await NewsletterSubscriber.find({ status: 'subscribed' });
    const emails = subscribers.map(sub => sub.email);
    if (emails.length === 0) {
      return res.status(400).json({ message: 'No subscribers to send to.' });
    }
    // Prepare email options
    const mailOptions = {
      from: process.env.SMTP_USER || 'no-reply@example.com',
      bcc: emails, // Use BCC for privacy
      subject,
      text: message,
      html: html || `<p>${message}</p>`
    };
    // Send email
    await transporter.sendMail(mailOptions);
    res.json({ message: `Newsletter sent to ${emails.length} subscribers.` });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    res.status(500).json({ message: 'Error sending newsletter.' });
  }
};

module.exports = {
  subscribe,
  unsubscribe,
  listSubscribers,
  sendNewsletter,
}; 