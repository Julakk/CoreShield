const { v4: uuidv4 } = require('uuid');

const domains = new Map();

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
  return record;
}

function remove(domain) {
  return domains.delete(domain);
}

function exists(domain) {
  return domains.has(domain);
}

module.exports = { list, add, remove, exists };
