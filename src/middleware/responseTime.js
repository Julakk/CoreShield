const trafficHistoryStore = require('../services/trafficHistoryStore');

const WINDOW_SIZE = 500;
const durations = [];

function responseTimeTracker(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    durations.push(durationMs);
    if (durations.length > WINDOW_SIZE) {
      durations.shift();
    }

    trafficHistoryStore.recordRequest(durationMs);
  });

  next();
}

function getAverageResponseTimeMs() {
  if (durations.length === 0) return null;
  const sum = durations.reduce((acc, d) => acc + d, 0);
  return Math.round((sum / durations.length) * 10) / 10;
}

module.exports = { responseTimeTracker, getAverageResponseTimeMs };
