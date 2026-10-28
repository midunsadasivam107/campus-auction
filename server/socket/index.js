const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { CLIENT_URL, JWT_SECRET } = require('../config/env');
const { registerAuctionHandlers } = require('./auctionHandlers');

let ioInstance = null;

const initSocket = (httpServer, app) => {
  const io = new Server(httpServer, {
    cors: {
      origin: CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Socket middleware: optional user authentication
  io.use((socket, next) => {
    try {
      let token = null;

      // Extract from handshake auth or query or cookie
      if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      } else if (socket.handshake.query && socket.handshake.query.token) {
        token = socket.handshake.query.token;
      } else if (socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie
          .split(';')
          .reduce((res, c) => {
            const [key, val] = c.trim().split('=');
            res[key] = val;
            return res;
          }, {});
        token = cookies.token;
      }

      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          socket.userId = decoded.id;
        } catch {
          // Token invalid or expired - proceed as guest
          socket.userId = null;
        }
      } else {
        socket.userId = null;
      }

      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket) => {
    // If authenticated, join user's private notification room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Register handlers
    registerAuctionHandlers(io, socket);

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  ioInstance = io;
  if (app) {
    app.set('io', io);
  }

  console.log('✅ Socket.IO initialized');
  return io;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized');
  }
  return ioInstance;
};

module.exports = {
  initSocket,
  getIO,
};
