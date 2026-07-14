const logger = require('../utils/logger');
const config = require('../config');

// Custom error class for expected/operational errors
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  logger.error('Request error', {
    message: err.message,
    stack: config.env === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  // Never leak stack traces or internal details to the client in production
  res.status(statusCode).json({
    error: err.isOperational ? err.message : 'Internal server error',
    ...(config.env === 'development' && !err.isOperational ? { stack: err.stack } : {}),
  });
}

module.exports = { AppError, notFoundHandler, errorHandler };
