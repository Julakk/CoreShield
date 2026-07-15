/**
 * In-memory store for IPs blocked via iptables mode (used only when
 * BLOCK_METHOD=iptables, since iptables itself has no simple "list what
 * CoreShield added" query — CrowdSec mode reads directly from its own
 * decisions API instead, which is the real source of truth there).
 */
const blocked = new Map();

function add(ip, meta = {}) {
  blocked.set(ip, {
    ip,
    reason: meta.reason || null,
    blockedAt: new Date().toISOString(),
  });
}

function remove(ip) {
  return blocked.delete(ip);
}

function list() {
  return Array.from(blocked.values());
}

module.exports = { add, remove, list };
