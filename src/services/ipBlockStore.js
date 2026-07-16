const blocks = new Map();

function add(ip, meta = {}) {
  const record = {
    ip,
    reason: meta.reason || null,
    blockedAt: new Date().toISOString(),
  };
  blocks.set(ip, record);
  return record;
}

function remove(ip) {
  return blocks.delete(ip);
}

function list() {
  return Array.from(blocks.values());
}

module.exports = { add, remove, list };
