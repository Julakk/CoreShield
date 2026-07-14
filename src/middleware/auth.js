const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Verifies a Bearer JWT on protected routes.
 * Expects: Authorization: Bearer <token>
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = payload; // { sub, role, ... }
    next();
  } catch (err) {
    logger.warn('JWT verification failed', { error: err.message, ip: req.ip });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Restricts a route to specific roles, e.g. authorize('admin')
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      logger.warn('Authorization denied', {
        user: req.user?.sub,
        role: req.user?.role,
        required: allowedRoles,
        path: req.originalUrl,
      });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
