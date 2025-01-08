const express = require('express');
const subController = require('../controllers/subscriptionController');
const router = express.Router();
router.post('/subscribe', subController.subscribe);
router.post('/unsubscribe', subController.unsubscribe);
module.exports = router;