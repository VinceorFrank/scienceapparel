require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // ✅ added
const uploadRoutes = require('./routes/upload'); // ✅ added
const helmet = require('helmet'); // Security middleware
// const fileUpload = require('express-fileupload');
console.log('Loaded PORT:', process.env.PORT);

const app = express();

// Middlewares
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(helmet()); // Set security-related HTTP headers
// app.use(fileUpload({
//   limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
//   useTempFiles: true,
//   tempFileDir: '/tmp/'
// }));

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/support', require('./routes/support'));
app.use('/api/upload', uploadRoutes); // ✅ added
app.use('/api/admin/dashboard', require('./routes/dashboard')); // Add dashboard routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // ✅ added
app.use('/api/categories', require('./routes/categories'));

// Global error handler (should be last)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});





