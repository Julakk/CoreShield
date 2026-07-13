const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const securityController = require('../controllers/securityController');

const router = express.Router();

router.post(
  '/block-ip',
  authenticate,
  authorize('admin', 'operator'),
  [
    body('ip')
      .isString()
      .trim()
      .isIP()
      .withMessage('ip must be a valid IPv4 or IPv6 address'),
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
