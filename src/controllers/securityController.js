const { validationResult } = require('express-validator');
const blockService = require('../services/blockService');
const auditLogStore = require('../services/auditLogStore');
const discordNotifier = require('../services/discordNotifier');
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
    const actor = req.user?.sub;

    const result = await blockService.blockIp(ip, {
      duration,
      reason,
      actor,
    });

    logger.info('IP block requested', { ip, actor });
    auditLogStore.record({
      actor,
      action: 'security.block_ip',
      target: ip,
      details: { reason: reason || null, method: result.method },
    });
    discordNotifier.notify({
      title: '🚫 IP blocked',
      description: `**${ip}** has been blocked.`,
      color: 'danger',
      fields: [
        { name: 'Reason', value: reason || 'Not specified' },
        { name: 'Method', value: result.method },
        { name: 'By', value: actor || 'unknown' },
      ],
    });

    res.status(201).json({ blocked: result });
  } catch (err) {
    next(err);
  }
}

async function unblockIp(req, res, next) {
  try {
    const { ip } = req.params;
    const actor = req.user?.sub;
    const result = await blockService.unblockIp(ip);

    logger.info('IP unblock requested', { ip, actor });
    auditLogStore.record({ actor, action: 'security.unblock_ip', target: ip });
    discordNotifier.notify({
      title: '✅ IP unblocked',
      description: `**${ip}** has been unblocked.`,
      color: 'success',
      fields: [{ name: 'By', value: actor || 'unknown' }],
    });

    res.json({ result });
  } catch (err) {
    next(err);
  }
}

module.exports = { listBlockedIps, blockIp, unblockIp };
