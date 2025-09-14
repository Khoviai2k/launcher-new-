const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Payment routes
router.post('/generate', paymentController.generateTransferContent);
router.get('/status/:transactionId', paymentController.getTransactionStatus);
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;