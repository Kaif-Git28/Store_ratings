const express = require('express');
const { 
  getStores, 
  getStore, 
  createStore, 
  updateStore, 
  deleteStore, 
  getStoreStats, 
  getOwnedStores,
  getStoreStatsById
} = require('../controllers/storeController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../models/User');

const router = express.Router();

// Public routes
router.get('/', getStores);

// Protected routes - specific routes first
router.get('/stats', protect, authorize(ROLES.ADMIN), getStoreStats);
router.get('/owned', protect, authorize(ROLES.STORE_OWNER), getOwnedStores);
router.post('/', protect, authorize([ROLES.ADMIN, ROLES.STORE_OWNER]), createStore);

// Parameterized routes last
router.get('/:id', getStore);
router.get('/:id/stats', protect, getStoreStatsById);
router.put('/:id', protect, updateStore);
router.delete('/:id', protect, deleteStore);

module.exports = router; 