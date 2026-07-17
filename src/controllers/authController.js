const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const adminStore = require('../services/adminStore');
const config = require('../config');
const logger = require('../utils/logger');
const auditLogStore = require('../services/auditLogStore');
const discordNotifier = require('../services/discordNotifier');

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const result = authService.login(username, password);

    logger.info('Admin login succeeded', { username, ip: req.ip });
    auditLogStore.record({ actor: username, action: 'auth.login', details: { ip: req.ip } });
    res.json(result);
  } catch (err) {
    if (err.statusCode === 401) {
      logger.warn('Admin login failed', { ip: req.ip });
      auditLogStore.record({
        actor: req.body?.username || 'unknown',
        action: 'auth.login_failed',
        details: { ip: req.ip },
      });
      discordNotifier.notify({
        title: '⚠️ Failed login attempt',
        description: `A login attempt failed for username **${req.body?.username || 'unknown'}**.`,
        color: 'warning',
        fields: [{ name: 'IP', value: req.ip }],
      });
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

    const actor = req.user?.sub;
    logger.info('Admin password changed', { username: actor, ip: req.ip });
    auditLogStore.record({ actor, action: 'auth.password_changed', details: { ip: req.ip } });
    discordNotifier.notify({
      title: '🔑 Admin password changed',
      description: `The dashboard admin password was changed.`,
      color: 'warning',
      fields: [{ name: 'By', value: actor || 'unknown' }, { name: 'IP', value: req.ip }],
    });

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
