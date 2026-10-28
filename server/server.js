const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { PORT, NODE_ENV } = require('./config/env');

// Create HTTP server (needed for Socket.IO later)
const server = http.createServer(app);

// --------------- Socket.IO Setup (Placeholder) ---------------
// Will be initialized in the real-time milestone:
// const { initSocket } = require('./socket');
// initSocket(server);

// --------------- Start Server ---------------
const start = async () => {
  // Connect to MongoDB
  await connectDB();

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
