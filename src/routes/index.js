const express = require('express');
const domainsRouter = require('./domains');
const securityRouter = require('./security');
const statsRouter = require('./stats');
const authRouter = require('./auth');
const publicRouter = require('./public');
const auditLogRouter = require('./auditLog');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));

router.use('/public', publicRouter);
router.use('/auth', authRouter);
router.use('/domains', domainsRouter);
router.use('/security', securityRouter);
router.use('/stats', statsRouter);
router.use('/audit-log', auditLogRouter);

module.exports = router;
