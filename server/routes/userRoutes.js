const express = require('express');
const { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser,
  getUserStats
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../models/User');

const router = express.Router();

// All routes require admin role
router.use(protect);

// Stats route
router.get('/stats', authorize(ROLES.ADMIN), getUserStats);

// Standard user CRUD routes
router.route('/')
  .get(authorize(ROLES.ADMIN), getAllUsers)
  .post(authorize(ROLES.ADMIN), createUser);

router.route('/:id')
  .get(authorize(ROLES.ADMIN), getUserById)
  .put(authorize(ROLES.ADMIN), updateUser)
  .delete(authorize(ROLES.ADMIN), deleteUser);

module.exports = router; 