const { v4: uuidv4 } = require('uuid');

/**
 * PLACEHOLDER persistence layer.
 * Replace with a real database (Postgres, MySQL, etc.) before production use.
 * Kept in-memory here purely to keep this example runnable standalone.
 */
const domains = new Map();

function list() {
  return Array.from(domains.values());
}

function add(domain, meta = {}) {
  const record = {
    id: uuidv4(),
    domain,
    upstream: meta.upstream || '127.0.0.1:8080',
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
