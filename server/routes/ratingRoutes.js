const express = require('express');
const { getAllRatings, getStoreRatings, addRating, updateRating, deleteRating, getRatingStats, getUserRatings } = require('../controllers/ratingController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../models/User');

const router = express.Router({ mergeParams: true });

// Specific routes first (must come before the general routes)
router.get('/stats', protect, authorize(ROLES.ADMIN), getRatingStats);
router.get('/user', protect, getUserRatings);

// Admin routes
router.get('/', protect, authorize(ROLES.ADMIN), getAllRatings);

// Get ratings for a store and add a new rating
router.route('/')
  .get(getStoreRatings)
  .post(protect, addRating);

// Update and delete rating
router.route('/:id')
  .put(protect, updateRating)
  .delete(protect, deleteRating);

module.exports = router; 