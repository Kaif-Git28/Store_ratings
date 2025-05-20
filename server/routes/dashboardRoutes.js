const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../models/User');

const router = express.Router();

// Dashboard routes (admin only)
router.get('/stats', protect, authorize(ROLES.ADMIN), getDashboardStats);

module.exports = router;