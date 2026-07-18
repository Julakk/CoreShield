const { readJson, writeJson } = require('../utils/jsonStore');

const FILE = 'ip-blocks.json';

let blocks = new Map(Object.entries(readJson(FILE, {})));

function persist() {
  writeJson(FILE, Object.fromEntries(blocks));
}

function add(ip, meta = {}) {
  const record = {
    ip,
    reason: meta.reason || null,
    blockedAt: new Date().toISOString(),
  };
  blocks.set(ip, record);
  persist();
  return record;
}

function remove(ip) {
  const existed = blocks.delete(ip);
  if (existed) persist();
  return existed;
}

function list() {
  return Array.from(blocks.values());
}

module.exports = { add, remove, list };
