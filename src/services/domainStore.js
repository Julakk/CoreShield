const { v4: uuidv4 } = require('uuid');
const { readJson, writeJson } = require('../utils/jsonStore');

const FILE = 'domains.json';

let domains = new Map(Object.entries(readJson(FILE, {})));

function persist() {
  writeJson(FILE, Object.fromEntries(domains));
}

function list() {
  return Array.from(domains.values());
}

function add(domain, meta = {}) {
  const record = {
    id: uuidv4(),
    domain,
    upstream: meta.upstream || '127.0.0.1:8080',
    rateLimit: meta.rateLimit || null,
    sslIssued: meta.sslIssued || false,
    createdAt: new Date().toISOString(),
    status: 'active',
  };
  domains.set(domain, record);
  persist();
  return record;
}

function remove(domain) {
  const existed = domains.delete(domain);
  if (existed) persist();
  return existed;
}

function exists(domain) {
  return domains.has(domain);
}

module.exports = { list, add, remove, exists };
