const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const domainsController = require('../controllers/domainsController');

const router = express.Router();

router.get('/', authenticate, domainsController.listDomains);

router.post(
  '/',
  authenticate,
  authorize('admin', 'operator'),
  [
    body('domain')
      .isString()
      .trim()
      .isLength({ min: 3, max: 253 })
      .matches(/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/)
      .withMessage('domain must be a valid hostname (e.g. app.example.com)'),
    body('upstream')
      .optional()
      .isString()
      .trim()
      .matches(/^[a-zA-Z0-9.-]+:\d{1,5}$/)
      .withMessage('upstream must be host:port'),
    body('rateLimit')
      .optional()
      .isFloat({ min: 0.1, max: 10000 })
      .withMessage('rateLimit must be a positive number (requests/sec)'),
    body('enableSsl')
      .optional()
      .isBoolean()
      .withMessage('enableSsl must be a boolean'),
  ],
  domainsController.addDomain
);

router.delete(
  '/:domain',
  authenticate,
  authorize('admin'),
  domainsController.removeDomain
);

module.exports = router;
