const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membership.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Membership routes
router.get('/packages', membershipController.getPackages);
router.post('/purchase', membershipController.purchaseMembership);
router.get('/status', membershipController.getMembershipStatus);

module.exports = router;