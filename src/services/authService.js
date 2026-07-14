const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');

function safeCompare(a, b) {
  const bufA = crypto.createHash('sha256').update(String(a)).digest();
  const bufB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(bufA, bufB);
}

function login(username, password) {
  if (!config.admin.password) {
    throw new AppError('Admin login is not configured on this server', 503);
  }

  const usernameMatches = safeCompare(username, config.admin.username);
  const passwordMatches = safeCompare(password, config.admin.password);

  if (!usernameMatches || !passwordMatches) {
    throw new AppError('Invalid username or password', 401);
  }

  const token = jwt.sign(
    { sub: username, role: 'admin' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return { token, expiresIn: config.jwt.expiresIn };
}

module.exports = { login };
