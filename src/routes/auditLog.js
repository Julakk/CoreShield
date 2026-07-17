const express = require('express');
const { authenticate } = require('../middleware/auth');
const auditLogController = require('../controllers/auditLogController');

const router = express.Router();

router.get('/', authenticate, auditLogController.getAuditLog);

module.exports = router;
