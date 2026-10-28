const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { CLIENT_URL } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const ApiError = require('./utils/ApiError');

const app = express();

// --------------- Security Middleware ---------------
app.use(helmet());
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(generalLimiter);

// --------------- Body Parsing ---------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --------------- Health Check ---------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// --------------- API Routes ---------------
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/listings', require('./routes/listing.routes'));
app.use('/api/listings', require('./routes/bid.routes'));
app.use('/api/listings', require('./routes/question.routes'));
app.use('/api/bids', require('./routes/bid.routes'));
app.use('/api/questions', require('./routes/question.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/saved-searches', require('./routes/search.routes'));
// app.use('/api/ai', require('./routes/ai.routes'));

// --------------- 404 Handler ---------------
app.use('/api/*', (req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
});

// --------------- Error Handler ---------------
app.use(errorHandler);

module.exports = app;
