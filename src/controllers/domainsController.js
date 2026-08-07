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
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { domain, upstream, rateLimit, enableSsl, enableProtection, maxConnections } = req.body;
    if (domainStore.exists(domain)) throw new AppError(`Domain already registered: ${domain}`, 409);

    const result = await nginxService.addDomain(domain, { upstream, rateLimit, enableSsl, enableProtection, maxConnections });
    const record = domainStore.add(domain, {
      mode: 'managed',
      upstream,
      rateLimit: result.rateLimit,
      sslIssued: result.sslIssued,
      protectionEnabled: result.protectionEnabled,
    });

    const actor = req.user?.sub;
    logger.info('Domain added', { domain, actor, sslIssued: result.sslIssued, protectionEnabled: result.protectionEnabled });
    auditLogStore.record({
      actor, action: 'domain.add', target: domain,
      details: { upstream: record.upstream, rateLimit: result.rateLimit, sslIssued: result.sslIssued, protection: result.protectionEnabled },
    });
    discordNotifier.notify({
      title: '🌐 Domain added', description: `**${domain}** is now protected.`, color: 'success',
      fields: [
        { name: 'Upstream', value: record.upstream },
        { name: 'SSL', value: result.sslIssued ? 'Issued' : 'Not issued' },
        { name: 'WAF Protection', value: result.protectionEnabled ? 'Enabled' : 'Off' },
        { name: 'By', value: actor || 'unknown' },
      ],
    });

    res.status(201).json({ domain: record });
  } catch (err) {
    next(err);
  }
}

async function protectExistingDomain(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { domain, rateLimit, enableProtection, maxConnections } = req.body;
    if (domainStore.exists(domain)) throw new AppError(`Domain already registered: ${domain}`, 409);

    const result = await nginxService.protectExistingDomain(domain, { rateLimit, enableProtection, maxConnections });
    const record = domainStore.add(domain, {
      mode: 'existing',
      rateLimit: result.rateLimit,
      protectionEnabled: result.protectionEnabled,
      snippetPath: result.snippetPath,
    });

    const actor = req.user?.sub;
    logger.info('Existing domain protection snippet generated', { domain, actor });
    auditLogStore.record({
      actor, action: 'domain.protect_existing', target: domain,
      details: { rateLimit: result.rateLimit, protection: result.protectionEnabled, snippetPath: result.snippetPath },
    });
    discordNotifier.notify({
      title: '🛡️ Protection snippet generated',
      description: `A protection snippet for **${domain}** was generated. Manual Nginx wiring is required.`,
      color: 'warning',
      fields: [{ name: 'By', value: actor || 'unknown' }],
    });

    res.status(201).json({ domain: record, snippetPath: result.snippetPath, zoneSnippetPath: result.zoneSnippetPath, instructions: result.instructions });
  } catch (err) {
    next(err);
  }
}

async function removeDomain(req, res, next) {
  try {
    const { domain } = req.params;
    if (!domainStore.exists(domain)) throw new AppError(`Domain not found: ${domain}`, 404);

    const record = domainStore.list().find((d) => d.domain === domain);
    const actor = req.user?.sub;

    if (record?.mode === 'existing') {
      const result = await nginxService.removeProtectionSnippet(domain);
      domainStore.remove(domain);
      logger.info('Protection snippet removed', { domain, actor });
      auditLogStore.record({ actor, action: 'domain.remove', target: domain, details: { mode: 'existing' } });
      return res.json({ domain, removed: true, warning: result.warning });
    }

    await nginxService.removeDomain(domain);
    domainStore.remove(domain);

    logger.info('Domain removed', { domain, actor });
    auditLogStore.record({ actor, action: 'domain.remove', target: domain });
    discordNotifier.notify({
      title: '🗑️ Domain removed', description: `**${domain}** is no longer protected.`, color: 'warning',
      fields: [{ name: 'By', value: actor || 'unknown' }],
    });

    res.json({ domain, removed: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listDomains, addDomain, removeDomain, protectExistingDomain };
