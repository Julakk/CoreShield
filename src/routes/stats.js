const express = require('express');
const { authenticate } = require('../middleware/auth');
const statsController = require('../controllers/statsController');

const router = express.Router();

router.get('/', authenticate, statsController.getStats);

module.exports = router;
