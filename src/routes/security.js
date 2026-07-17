const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const securityController = require('../controllers/securityController');
const { isValidIpOrCidr } = require('../utils/validators');

const router = express.Router();

router.get('/block-ip', authenticate, securityController.listBlockedIps);

router.post(
  '/block-ip',
  authenticate,
  authorize('admin', 'operator'),
  [
    body('ip')
      .isString()
      .trim()
      .custom((value) => isValidIpOrCidr(value))
      .withMessage('ip must be a valid IPv4/IPv6 address or CIDR range (e.g. 203.0.113.0/24)'),
    body('duration').optional().isString().trim(),
    body('reason').optional().isString().trim().isLength({ max: 500 }),
  ],
  securityController.blockIp
);

router.delete(
  '/block-ip/:ip',
  authenticate,
  authorize('admin', 'operator'),
  securityController.unblockIp
);

module.exports = router;
