const fs = require('fs/promises');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');
const domainStore = require('./domainStore');

const WINDOW_MS = 24 * 60 * 60 * 1000;
const CHUNK = 64 * 1024;
const MAX_BYTES_PER_FILE = 64 * 1024 * 1024;
const CACHE_TTL_MS = 30 * 1000;

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
// Format "combined": 1.2.3.4 - - [29/Sep/2026:11:37:43 +0700] "GET / ..."
const LINE_RE = /^\S+ \S+ \S+ \[(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-])(\d{2})(\d{2})\]/;

let cache = null;

function parseTimestamp(line) {
  const m = LINE_RE.exec(line);
  if (!m || MONTHS[m[2]] === undefined) return null;
  const utc = Date.UTC(+m[3], MONTHS[m[2]], +m[1], +m[4], +m[5], +m[6]);
  const offset = (Number(m[8]) * 60 + Number(m[9])) * 60 * 1000 * (m[7] === '-' ? -1 : 1);
  return utc - offset;
}

// Hitung baris dengan timestamp >= cutoff, membaca dari akhir file.
// Mengembalikan null kalau file tidak ada / tidak bisa dibuka.
async function countRecent(file, cutoff) {
  let handle;
  try {
    handle = await fs.open(file, 'r');
  } catch (err) {
    if (err.code !== 'ENOENT') logger.warn('Cannot read access log', { file, error: err.code });
    return null;
  }

  let count = 0;
  let finished = false;

  const tally = (line) => {
    if (!line) return;
    const ts = parseTimestamp(line);
    if (ts === null) return; // baris rusak dilewati
    if (ts < cutoff) finished = true;
    else count += 1;
  };

  try {
    const { size } = await handle.stat();
    const floor = Math.max(0, size - MAX_BYTES_PER_FILE);
    let pos = size;
    let carry = '';

    while (pos > floor && !finished) {
      const len = Math.min(CHUNK, pos - floor);
      pos -= len;
      const buf = Buffer.alloc(len);
      const { bytesRead } = await handle.read(buf, 0, len, pos);
      const lines = (buf.toString('latin1', 0, bytesRead) + carry).split('\n');
      carry = lines.shift(); // potongan pertama mungkin baris yang terpotong
      for (let i = lines.length - 1; i >= 0 && !finished; i -= 1) tally(lines[i]);
    }
    if (!finished && pos === 0) tally(carry); // baris pertama file
  } finally {
    await handle.close();
  }
  return count;
}

// { requestsLast24h, perDomain, logsRead } atau null kalau belum ada log sama sekali.
async function getTraffic({ force = false } = {}) {
  const now = Date.now();
  if (!force && cache && now - cache.at < CACHE_TTL_MS) return cache.value;

  const dir = path.resolve(config.nginx.logDir);
  const cutoff = now - WINDOW_MS;
  const perDomain = {};
  let total = 0;
  let logsRead = 0;

  for (const d of domainStore.list()) {
    if (d.mode !== 'managed') continue; // mode existing/snippet tidak punya access_log dari CoreShield
    const file = path.join(dir, `${d.domain}.access.log`);
    if (!file.startsWith(`${dir}${path.sep}`)) continue;

    let domainCount = null;
    for (const f of [file, `${file}.1`]) {
      try {
        const n = await countRecent(f, cutoff);
        if (n !== null) domainCount = (domainCount || 0) + n;
      } catch (err) {
        logger.warn('Failed to parse access log', { file: f, error: err.message });
      }
    }
    if (domainCount !== null) {
      perDomain[d.domain] = domainCount;
      total += domainCount;
      logsRead += 1;
    }
  }

  const value = logsRead > 0 ? { requestsLast24h: total, perDomain, logsRead } : null;
  cache = { at: now, value };
  return value;
}

module.exports = { getTraffic };
