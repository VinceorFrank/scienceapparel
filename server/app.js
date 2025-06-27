const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/database');
const config = require('./config/env');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const rateLimiter = require('./middlewares/rateLimiter');
const sanitizer = require('./middlewares/sanitizer-simple');
const { morganRequestLogger } = require('./middlewares/requestLogger');
const compression = require('compression');
const hpp = require('hpp');

const app = express();

// Connect to database
connectDB();

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

          console.log(`Scheduled newsletter "${campaign.subject}" sent to ${emails.length} subscribers.`);
        } else {
          // No subscribers, mark as failed
          campaign.status = 'failed';
          campaign.errorMessage = 'No subscribers to send to';
          await campaign.save();
        }
      } catch (error) {
        console.error(`Error sending scheduled newsletter "${campaign.subject}":`, error);
        
        // Mark as failed
        campaign.status = 'failed';
        campaign.errorMessage = error.message;
        await campaign.save();
      }
    }
  } catch (error) {
    console.error('Error in scheduled newsletter sender:', error);
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

// Other Middlewares
app.use(rateLimiter);
app.use(sanitizer);
app.use(morganRequestLogger);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV 
  });
});

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

// Error Handling Middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
  console.log(`🔗 CORS Origin: ${config.CORS_ORIGIN}`);
});

module.exports = app;





