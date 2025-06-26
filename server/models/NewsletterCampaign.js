const mongoose = require('mongoose');

const newsletterCampaignSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  html: {
    type: String,
    required: true
  },
  recipientCount: {
    type: Number,
    required: true,
    default: 0
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'partial', 'scheduled'],
    default: 'sent'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient querying
newsletterCampaignSchema.index({ sentAt: -1 });
newsletterCampaignSchema.index({ sentBy: 1 });
newsletterCampaignSchema.index({ status: 1 });
newsletterCampaignSchema.index({ scheduledAt: 1, status: 1 }); // For finding scheduled campaigns

module.exports = mongoose.model('NewsletterCampaign', newsletterCampaignSchema); 