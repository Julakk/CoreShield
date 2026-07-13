const config = require('../config');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

/**
 * Pulls stats from CrowdSec's local API. In a real deployment you might also
 * merge in Nginx access-log aggregates (e.g. via GoAccess JSON export) or a
 * metrics store like Prometheus. This is intentionally a thin adapter layer
 * so the data source can be swapped without touching the route/controller.
 */
async function getStats() {
  try {
    const res = await fetch(`${config.crowdsec.apiUrl}/v1/decisions`, {
      headers: { 'X-Api-Key': config.crowdsec.apiKey },
    });

    if (!res.ok) {
      throw new AppError(`CrowdSec API error (${res.status})`, 502);
    }

    const decisions = await res.json();
    const activeBlocks = Array.isArray(decisions) ? decisions.length : 0;

    return {
      generatedAt: new Date().toISOString(),
      activeBlocks,
      // Placeholder aggregates — wire these to your real traffic source
      // (e.g. Nginx log aggregation, Prometheus query, etc.)
      traffic: {
        requestsLast24h: null,
        note: 'Wire this field to your traffic metrics source (e.g. Prometheus/GoAccess).',
      },
      attacksBlockedLast24h: activeBlocks,
    };
  } catch (err) {
    logger.error('Failed to fetch stats', { error: err.message });
    throw err instanceof AppError ? err : new AppError('Failed to retrieve statistics', 502);
  }
}

module.exports = { getStats };
