const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const adminStore = require('../services/adminStore');
const config = require('../config');
const logger = require('../utils/logger');

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const result = authService.login(username, password);

    logger.info('Admin login succeeded', { username, ip: req.ip });
    res.json(result);
  } catch (err) {
    if (err.statusCode === 401) {
      logger.warn('Admin login failed', { ip: req.ip });
    }
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    authService.changePassword(currentPassword, newPassword);

    logger.info('Admin password changed', { username: req.user?.sub, ip: req.ip });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

function getSystemInfo(req, res) {
  res.json({
    username: adminStore.getUsername(),
    env: config.env,
    blockMethod: config.blockMethod,
    corsOrigins: config.corsOrigins,
    jwtExpiresIn: config.jwt.expiresIn,
  });
}

module.exports = { login, changePassword, getSystemInfo };
