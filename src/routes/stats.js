const express = require('express');
const { authenticate } = require('../middleware/auth');
const statsController = require('../controllers/statsController');

const router = express.Router();

router.get('/', authenticate, statsController.getStats);
router.get('/history', authenticate, statsController.getHistory);

module.exports = router;
