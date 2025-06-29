const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/database');
const config = require('./config/env');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const rateLimiter = require('./middlewares/rateLimiter');
const sanitizer = require('./middlewares/sanitizer-simple');
const { requestLogger, errorLogger, logger } = require('./utils/logger');
const logCleanup = require('./utils/logCleanup');
const compression = require('compression');
const hpp = require('hpp');

const app = express();

// Connect to database
connectDB();

// Schedule log cleanup (run every 24 hours)
logCleanup.scheduleCleanup(24);

// Scheduled Newsletter Sender
const NewsletterCampaign = require('./models/NewsletterCampaign');
const NewsletterSubscriber = require('./models/NewsletterSubscriber');
const transporter = require('./utils/mailer');

// Function to send scheduled newsletters
const sendScheduledNewsletters = async () => {
  try {
    const now = new Date();
    const scheduledCampaigns = await NewsletterCampaign.find({
      status: 'scheduled',
      scheduledAt: { $lte: now }
    });

    for (const campaign of scheduledCampaigns) {
      try {
        // Get current subscribers
        const subscribers = await NewsletterSubscriber.find({ status: 'subscribed' });
        const emails = subscribers.map(sub => sub.email);

        if (emails.length > 0) {
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

          logger.info('Scheduled newsletter sent', {
            campaignId: campaign._id,
            subject: campaign.subject,
            recipientCount: emails.length
          });
        } else {
          // No subscribers, mark as failed
          campaign.status = 'failed';
          campaign.errorMessage = 'No subscribers to send to';
          await campaign.save();
          
          logger.warn('Scheduled newsletter failed - no subscribers', {
            campaignId: campaign._id,
            subject: campaign.subject
          });
        }
      } catch (error) {
        logger.error('Error sending scheduled newsletter', {
          campaignId: campaign._id,
          subject: campaign.subject,
          error: error.message
        });
        
        // Mark as failed
        campaign.status = 'failed';
        campaign.errorMessage = error.message;
        await campaign.save();
      }
    }
  } catch (error) {
    logger.error('Error in scheduled newsletter sender', {
      error: error.message,
      stack: error.stack
    });
  }
};

// Run scheduled newsletter sender every minute
setInterval(sendScheduledNewsletters, 60000);

// Also run once on startup to catch any missed newsletters
sendScheduledNewsletters();

// --- START OF CRITICAL CONFIGURATION ---

// 0. Upload route BEFORE body parsers
app.use('/api/upload', require('./routes/upload'));

// 1. JSON and URL-encoded parser middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply performance and security middleware
app.use(compression());
app.use(hpp());

// 2. CORS Middleware
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));

// 3. Helmet Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// 4. Static File Serving Middleware
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));

// --- END OF CRITICAL CONFIGURATION ---

// Health check endpoint (move here, before other middleware)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV 
  });
});

// Other Middlewares
app.use(rateLimiter);
app.use(sanitizer);
app.use(requestLogger);

// API Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/support', require('./routes/support'));
app.use('/api/admin/activity-logs', require('./routes/activityLog'));
app.use('/api/admin/csv-import', require('./routes/csvImport'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/monitoring', require('./routes/monitoring'));

// Error Handling Middleware (must be last)
app.use(notFound);
app.use(errorLogger);
app.use(errorHandler);

const PORT = config.PORT;
app.listen(PORT, () => {
  logger.info('Server started successfully', {
    port: PORT,
    environment: config.NODE_ENV,
    corsOrigin: config.CORS_ORIGIN
  });
});

module.exports = app;





