const { validationResult } = require('express-validator');
const blockService = require('../services/blockService');
const logger = require('../utils/logger');

async function listBlockedIps(req, res, next) {
  try {
    const blocked = await blockService.listBlockedIps();
    res.json({ blocked });
  } catch (err) {
    next(err);
  }
}

async function blockIp(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ip, duration, reason } = req.body;

    const result = await blockService.blockIp(ip, {
      duration,
      reason,
      actor: req.user?.sub,
    });

    logger.info('IP block requested', { ip, actor: req.user?.sub });
    res.status(201).json({ blocked: result });
  } catch (err) {
    next(err);
  }
}

async function unblockIp(req, res, next) {
  try {
    const { ip } = req.params;
    const result = await blockService.unblockIp(ip);

    logger.info('IP unblock requested', { ip, actor: req.user?.sub });
    res.json({ result });
  } catch (err) {
    next(err);
  }
}

module.exports = { listBlockedIps, blockIp, unblockIp };
