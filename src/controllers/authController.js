const { validationResult } = require('express-validator');
const authService = require('../services/authService');
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

module.exports = { login };
