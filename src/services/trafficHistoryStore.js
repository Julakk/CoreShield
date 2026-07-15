const HOURS_TO_KEEP = 24;
const buckets = new Map();

function hourKey(date) {
  return date.toISOString().slice(0, 13);
}

function pruneOldBuckets() {
  const cutoff = Date.now() - HOURS_TO_KEEP * 60 * 60 * 1000;
  for (const key of buckets.keys()) {
    const bucketTime = new Date(`${key}:00:00.000Z`).getTime();
    if (bucketTime < cutoff) {
      buckets.delete(key);
    }
  }
}

function recordRequest(durationMs) {
  const key = hourKey(new Date());
  const bucket = buckets.get(key) || { requests: 0, totalDurationMs: 0 };
  bucket.requests += 1;
  bucket.totalDurationMs += durationMs;
  buckets.set(key, bucket);
  pruneOldBuckets();
}

function getHistory() {
  pruneOldBuckets();
  const now = new Date();
  const result = [];

  for (let i = HOURS_TO_KEEP - 1; i >= 0; i--) {
    const hourDate = new Date(now.getTime() - i * 60 * 60 * 1000);
    const key = hourKey(hourDate);
    const bucket = buckets.get(key);

    result.push({
      hour: `${String(hourDate.getUTCHours()).padStart(2, '0')}:00`,
      requests: bucket ? bucket.requests : 0,
      avgResponseTimeMs: bucket
        ? Math.round((bucket.totalDurationMs / bucket.requests) * 10) / 10
        : null,
    });
  }

  return result;
}

module.exports = { recordRequest, getHistory };
