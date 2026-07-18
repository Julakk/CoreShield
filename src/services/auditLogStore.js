const { v4: uuidv4 } = require('uuid');
const { readJson, writeJson } = require('../utils/jsonStore');

const FILE = 'audit-log.json';
const MAX_ENTRIES = 500;

let entries = readJson(FILE, []);

function persist() {
  writeJson(FILE, entries);
}

function record({ actor, action, target, details }) {
  const entry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    actor: actor || 'system',
    action,
    target: target || null,
    details: details || null,
  };

  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.length = MAX_ENTRIES;
  }
  persist();

  return entry;
}

function list({ limit = 100 } = {}) {
  return entries.slice(0, limit);
}

module.exports = { record, list };
