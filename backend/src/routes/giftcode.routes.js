const express = require('express');
const router = express.Router();
const giftcodeController = require('../controllers/giftcode.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Gift code routes
router.post('/redeem', giftcodeController.redeemCode);
router.get('/history', giftcodeController.getRedeemHistory);

module.exports = router;