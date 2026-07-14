const express = require('express');
const domainsRouter = require('./domains');
const securityRouter = require('./security');
const statsRouter = require('./stats');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));

router.use('/domains', domainsRouter);
router.use('/security', securityRouter);
router.use('/stats', statsRouter);

module.exports = router;
