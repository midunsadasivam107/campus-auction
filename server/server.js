const { PORT, NODE_ENV } = require('./config/env');
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const { startAuctionCloser } = require('./jobs/auctionCloser');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server, app);

// --------------- Start Server ---------------
const start = async () => {
  // Connect to MongoDB
  await connectDB();

  // Start background cron jobs
  startAuctionCloser(app);

  server.listen(PORT, () => {
    console.log(`\n🎓 Campus Auction Server`);
    console.log(`   Environment: ${NODE_ENV}`);
    console.log(`   Port:        ${PORT}`);
    console.log(`   URL:         http://localhost:${PORT}`);
    console.log(`   Health:      http://localhost:${PORT}/api/health\n`);
  });
};

start().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

module.exports = server;
