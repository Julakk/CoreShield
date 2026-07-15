const statsService = require('../services/statsService');
const trafficHistoryStore = require('../services/trafficHistoryStore');

async function getStats(req, res, next) {
  try {
    const stats = await statsService.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

function getHistory(req, res, next) {
  try {
    res.json({ history: trafficHistoryStore.getHistory() });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats, getHistory };
