const express = require('express');
const statsService = require('../services/statsService');

const router = express.Router();

router.get('/status', async (req, res, next) => {
  try {
    const stats = await statsService.getStats();

    res.json({
      status: 'operational',
      protectedDomains: stats.protectedDomains,
      attacksBlockedLast24h: stats.attacksBlockedLast24h,
      activeIpBlocks: stats.activeBlocks,
      avgResponseTimeMs: stats.avgResponseTimeMs,
      generatedAt: stats.generatedAt,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
