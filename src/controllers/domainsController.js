const { validationResult } = require('express-validator');
const domainStore = require('../services/domainStore');
const nginxService = require('../services/nginxService');
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

    logger.info('Domain added', { domain, actor: req.user?.sub, sslIssued: result.sslIssued });
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

    logger.info('Domain removed', { domain, actor: req.user?.sub });
    res.json({ domain, removed: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listDomains, addDomain, removeDomain };
