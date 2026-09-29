const config = require('../config');
const logger = require('../utils/logger');
const domainStore = require('./domainStore');
const trafficService = require('./trafficService');
const { getAverageResponseTimeMs } = require('../middleware/responseTime');

async function getStats() {
  let activeBlocks = 0;

  try {
    const res = await fetch(`${config.crowdsec.apiUrl}/v1/decisions`, {
      headers: { 'X-Api-Key': config.crowdsec.apiKey },
    });

    if (res.ok) {
      const decisions = await res.json();
      activeBlocks = Array.isArray(decisions) ? decisions.length : 0;
    } else {
      logger.warn('CrowdSec API returned non-OK status for stats', { status: res.status });
    }
  } catch (err) {
    logger.warn('CrowdSec unreachable, returning partial stats', { error: err.message });
  }

  let traffic = null;
  try {
    traffic = await trafficService.getTraffic();
  } catch (err) {
    logger.warn('Traffic aggregation failed', { error: err.message });
  }

  return {
    generatedAt: new Date().toISOString(),
    activeBlocks,
    attacksBlockedLast24h: activeBlocks,
    protectedDomains: domainStore.list().length,
    avgResponseTimeMs: getAverageResponseTimeMs(),
    traffic: {
      requestsLast24h: traffic ? traffic.requestsLast24h : null,
      note: traffic
        ? 'Aggregated from Nginx access logs of managed domains (includes requests blocked by WAF-lite).'
        : 'No Nginx access logs found yet for any managed domain.',
    },
    cacheRate: null,
  };
}

module.exports = { getStats };
