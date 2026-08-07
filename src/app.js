const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const logger = require('./utils/logger');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { responseTimeTracker } = require('./middleware/responseTime');

const app = express();
app.set('trust proxy', 1);

// Security headers
app.use(helmet());
app.use(responseTimeTracker);

// Restrict CORS to known dashboard origin(s) only
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  })
);

// Body parsing with a sane size limit (this API never needs large payloads)
app.use(express.json({ limit: '100kb' }));

// Global rate limiting — mitigates brute force / abuse against this
// security-control API itself
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Request logging
app.use((req, res, next) => {
  logger.debug('Incoming request', { method: req.method, path: req.originalUrl, ip: req.ip });
  next();
});

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
