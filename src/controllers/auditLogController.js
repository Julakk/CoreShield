const auditLogStore = require('../services/auditLogStore');

function getAuditLog(req, res) {
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
  res.json({ entries: auditLogStore.list({ limit }) });
}

module.exports = { getAuditLog };
