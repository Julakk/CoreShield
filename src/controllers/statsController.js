const statsService = require('../services/statsService');

async function getStats(req, res, next) {
  try {
    const stats = await statsService.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats };
