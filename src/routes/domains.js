const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const domainsController = require('../controllers/domainsController');

const router = express.Router();

router.get('/', authenticate, domainsController.listDomains);

router.post('/', authenticate, authorize('admin', 'operator'), [
  body('domain').isString().trim().isLength({ min: 3, max: 253 })
    .matches(/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/),
  body('upstream').optional().isString().trim().matches(/^[a-zA-Z0-9.-]+:\d{1,5}$/),
  body('rateLimit').optional().isFloat({ min: 0.1, max: 10000 }),
  body('enableSsl').optional().isBoolean(),
  body('enableProtection').optional().isBoolean(),
  body('maxConnections').optional().isInt({ min: 1, max: 100000 }),
], domainsController.addDomain);

router.post('/protect-existing', authenticate, authorize('admin', 'operator'), [
  body('domain').isString().trim().isLength({ min: 3, max: 253 })
    .matches(/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/),
  body('rateLimit').optional().isFloat({ min: 0.1, max: 10000 }),
  body('enableProtection').optional().isBoolean(),
  body('maxConnections').optional().isInt({ min: 1, max: 100000 }),
], domainsController.protectExistingDomain);

router.delete('/:domain', authenticate, authorize('admin'), domainsController.removeDomain);

module.exports = router;
