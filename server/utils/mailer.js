const nodemailer = require('nodemailer');
const config = require('../config/env');

const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || 'gmail', // e.g., 'gmail', 'outlook', 'yahoo', or custom
  auth: {
    user: process.env.SMTP_USER || config.SMTP_USER || '',
    pass: process.env.SMTP_PASS || config.SMTP_PASS || '',
  },
});

module.exports = transporter; 