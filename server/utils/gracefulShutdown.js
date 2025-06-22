const mongoose = require('mongoose');

const setupGracefulShutdown = (server) => {
  const shutdown = (signal) => {
    console.log(`\n🚨 ${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('✅ HTTP server closed.');
      mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed.');
        process.exit(0);
      });
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

module.exports = {
  setupGracefulShutdown,
}; 