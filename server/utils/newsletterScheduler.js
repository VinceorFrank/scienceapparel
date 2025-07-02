/**
 * Newsletter Scheduler Utility
 * Handles scheduled newsletter sending with proper error handling and monitoring
 */

const NewsletterCampaign = require('../models/NewsletterCampaign');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const transporter = require('./mailer');
const { logger } = require('./logger');

class NewsletterScheduler {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.errorCount = 0;
    this.successCount = 0;
    this.interval = null;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Start the newsletter scheduler
   * @param {number} intervalMinutes - Interval in minutes (default: 1)
   */
  start(intervalMinutes = 1) {
    if (this.interval) {
      logger.warn('Newsletter scheduler is already running');
      return;
    }

    logger.info('Starting newsletter scheduler', {
      intervalMinutes,
      maxRetries: this.maxRetries
    });

    // Run immediately on startup
    this.processScheduledNewsletters();

    // Schedule regular runs
    this.interval = setInterval(() => {
      this.processScheduledNewsletters();
    }, intervalMinutes * 60 * 1000);

    logger.info('Newsletter scheduler started successfully');
  }

  /**
   * Stop the newsletter scheduler
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.isRunning = false;
      logger.info('Newsletter scheduler stopped');
    }
  }

  /**
   * Process scheduled newsletters with error handling and rate limiting
   */
  async processScheduledNewsletters() {
    if (this.isRunning) {
      logger.warn('Newsletter processing already in progress, skipping');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Starting newsletter processing cycle');

      // Get campaigns ready to send
      const now = new Date();
      const scheduledCampaigns = await NewsletterCampaign.find({
        status: 'scheduled',
        scheduledAt: { $lte: now }
      }).limit(10); // Limit to prevent overwhelming the system

      if (scheduledCampaigns.length === 0) {
        logger.debug('No scheduled campaigns to process');
        return;
      }

      logger.info('Processing scheduled campaigns', {
        count: scheduledCampaigns.length
      });

      // Process each campaign
      for (const campaign of scheduledCampaigns) {
        await this.processCampaign(campaign);
        
        // Add delay between campaigns to prevent rate limiting
        await this.delay(1000);
      }

      this.successCount++;
      this.lastRun = new Date();

      logger.info('Newsletter processing cycle completed', {
        duration: Date.now() - startTime,
        campaignsProcessed: scheduledCampaigns.length
      });

    } catch (error) {
      this.errorCount++;
      logger.error('Error in newsletter processing cycle', {
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process a single newsletter campaign
   * @param {Object} campaign - Newsletter campaign object
   */
  async processCampaign(campaign) {
    let retries = 0;

    while (retries < this.maxRetries) {
      try {
        logger.info('Processing campaign', {
          campaignId: campaign._id,
          subject: campaign.subject,
          retry: retries
        });

        // Get current subscribers
        const subscribers = await NewsletterSubscriber.find({ 
          status: 'subscribed' 
        }).limit(1000); // Limit to prevent memory issues

        const emails = subscribers.map(sub => sub.email);

        if (emails.length === 0) {
          // No subscribers, mark as failed
          campaign.status = 'failed';
          campaign.errorMessage = 'No subscribers to send to';
          await campaign.save();
          
          logger.warn('Campaign failed - no subscribers', {
            campaignId: campaign._id,
            subject: campaign.subject
          });
          return;
        }

        // Send the email
        const mailOptions = {
          from: process.env.SMTP_USER || 'no-reply@example.com',
          bcc: emails,
          subject: campaign.subject,
          text: campaign.message,
          html: campaign.html
        };

        await transporter.sendMail(mailOptions);

        // Update campaign status
        campaign.status = 'sent';
        campaign.sentAt = new Date();
        campaign.recipientCount = emails.length;
        await campaign.save();

        logger.info('Campaign sent successfully', {
          campaignId: campaign._id,
          subject: campaign.subject,
          recipientCount: emails.length
        });

        return; // Success, exit retry loop

      } catch (error) {
        retries++;
        logger.error('Error processing campaign', {
          campaignId: campaign._id,
          subject: campaign.subject,
          error: error.message,
          retry: retries,
          maxRetries: this.maxRetries
        });

        if (retries >= this.maxRetries) {
          // Mark as failed after max retries
          campaign.status = 'failed';
          campaign.errorMessage = `Failed after ${retries} retries: ${error.message}`;
          await campaign.save();
          
          logger.error('Campaign failed after max retries', {
            campaignId: campaign._id,
            subject: campaign.subject,
            finalError: error.message
          });
        } else {
          // Wait before retry
          await this.delay(this.retryDelay * retries);
        }
      }
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      errorCount: this.errorCount,
      successCount: this.successCount,
      hasInterval: !!this.interval
    };
  }

  /**
   * Utility function to add delay
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
const newsletterScheduler = new NewsletterScheduler();

module.exports = newsletterScheduler; 