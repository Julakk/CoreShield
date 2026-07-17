const { validationResult } = require('express-validator');
const domainStore = require('../services/domainStore');
const nginxService = require('../services/nginxService');
const auditLogStore = require('../services/auditLogStore');
const discordNotifier = require('../services/discordNotifier');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

async function listDomains(req, res, next) {
  try {
    res.json({ domains: domainStore.list() });
  } catch (err) {
    next(err);
  }
}

async function addDomain(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { domain, upstream, rateLimit, enableSsl } = req.body;

    if (domainStore.exists(domain)) {
      throw new AppError(`Domain already registered: ${domain}`, 409);
    }

    const result = await nginxService.addDomain(domain, {
      upstream,
      rateLimit,
      enableSsl,
    });

    const record = domainStore.add(domain, {
      upstream,
      rateLimit: result.rateLimit,
      sslIssued: result.sslIssued,
    });

    const actor = req.user?.sub;
    logger.info('Domain added', { domain, actor, sslIssued: result.sslIssued });
    auditLogStore.record({
      actor,
      action: 'domain.add',
      target: domain,
      details: { upstream: record.upstream, rateLimit: result.rateLimit, sslIssued: result.sslIssued },
    });
    discordNotifier.notify({
      title: '🌐 Domain added',
      description: `**${domain}** is now protected.`,
      color: 'success',
      fields: [
        { name: 'Upstream', value: record.upstream },
        { name: 'SSL', value: result.sslIssued ? 'Issued' : 'Not issued' },
        { name: 'By', value: actor || 'unknown' },
      ],
    });

    res.status(201).json({ domain: record });
  } catch (err) {
    next(err);
  }
}

async function removeDomain(req, res, next) {
  try {
    const { domain } = req.params;

    if (!domainStore.exists(domain)) {
      throw new AppError(`Domain not found: ${domain}`, 404);
    }

    await nginxService.removeDomain(domain);
    domainStore.remove(domain);

    const actor = req.user?.sub;
    logger.info('Domain removed', { domain, actor });
    auditLogStore.record({ actor, action: 'domain.remove', target: domain });
    discordNotifier.notify({
      title: '🗑️ Domain removed',
      description: `**${domain}** is no longer protected.`,
      color: 'warning',
      fields: [{ name: 'By', value: actor || 'unknown' }],
    });

    res.json({ domain, removed: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listDomains, addDomain, removeDomain };
