const jwt = require('jsonwebtoken');
const config = require('../config');
const adminStore = require('./adminStore');
const { AppError } = require('../middleware/errorHandler');

function login(username, password) {
  const storedUsername = adminStore.getUsername();

  const a = Buffer.from(String(username));
  const b = Buffer.from(String(storedUsername));
  const usernameMatches =
    a.length === b.length && require('crypto').timingSafeEqual(a, b);

  const passwordMatches = adminStore.verifyPassword(password);

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

function changePassword(currentPassword, newPassword) {
  if (!adminStore.verifyPassword(currentPassword)) {
    throw new AppError('Current password is incorrect', 401);
  }
  if (!newPassword || newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 400);
  }
  adminStore.setPassword(newPassword);
}

module.exports = { login, changePassword };
