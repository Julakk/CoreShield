const config = require('../config');
const logger = require('../utils/logger');
const domainStore = require('./domainStore');
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

  return {
    generatedAt: new Date().toISOString(),
    activeBlocks,
    attacksBlockedLast24h: activeBlocks,
    protectedDomains: domainStore.list().length,
    avgResponseTimeMs: getAverageResponseTimeMs(),
    traffic: {
      requestsLast24h: null,
      note: 'Not wired to a real traffic source yet (e.g. Nginx access-log aggregation or Prometheus).',
    },
    cacheRate: null,
  };
}

module.exports = { getStats };
