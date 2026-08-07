const logger = require('../utils/logger');

const cache = new Map();
const CACHE_MAX_SIZE = 5000;

function isPrivateOrInvalid(ip) {
  const base = ip.split('/')[0];
  return (
    /^127\./.test(base) ||
    /^10\./.test(base) ||
    /^192\.168\./.test(base) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(base) ||
    base === '::1'
  );
}

async function lookupCountry(ip) {
  const base = ip.split('/')[0];

  if (isPrivateOrInvalid(ip)) {
    return { country: null, countryCode: null };
  }

  if (cache.has(base)) {
    return cache.get(base);
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(base)}?fields=status,country,countryCode`,
      { signal: AbortSignal.timeout(3000) }
    );

    if (!res.ok) {
      return { country: null, countryCode: null };
    }

    const data = await res.json();
    const result =
      data.status === 'success'
        ? { country: data.country, countryCode: data.countryCode }
        : { country: null, countryCode: null };

    if (cache.size >= CACHE_MAX_SIZE) {
      cache.clear();
    }
    cache.set(base, result);
    return result;
  } catch (err) {
    logger.warn('GeoIP lookup failed', { ip: base, error: err.message });
    return { country: null, countryCode: null };
  }
}

async function enrichWithCountry(records, ipField = 'ip') {
  return Promise.all(
    records.map(async (record) => {
      const geo = await lookupCountry(record[ipField]);
      return { ...record, country: geo.country, countryCode: geo.countryCode };
    })
  );
}

module.exports = { lookupCountry, enrichWithCountry };
