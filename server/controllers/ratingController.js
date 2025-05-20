const { Rating, Store, User } = require('../models');
const { ROLES } = require('../models/User');
const { sequelize } = require('../config/db');

// @desc    Get all ratings
// @route   GET /api/ratings
// @access  Private (admin only)
exports.getAllRatings = async (req, res) => {
  try {
    // Only admin can view all ratings
    if (req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view all ratings'
      });
    }

    const ratings = await Rating.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        },
        {
          model: Store,
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: ratings.length,
      data: ratings
    });
  } catch (error) {
    console.error('Get all ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get ratings for a store
// @route   GET /api/stores/:storeId/ratings
// @access  Public
exports.getStoreRatings = async (req, res) => {
  try {
    const { storeId } = req.params;
    
    // Check if store exists
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    const ratings = await Rating.findAll({
      where: { storeId },
      include: {
        model: User,
        attributes: ['id', 'name']
      }
    });

    res.status(200).json({
      success: true,
      count: ratings.length,
      data: ratings
    });
  } catch (error) {
    console.error('Get store ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add rating to store
// @route   POST /api/stores/:storeId/ratings
// @access  Private (normal users only)
exports.addRating = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { score, comment } = req.body;

    // Check if store exists
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if user is a normal user (store owners and admins can't rate)
    if (req.user.role !== ROLES.NORMAL_USER) {
      return res.status(403).json({
        success: false,
        message: 'Only normal users can rate stores'
      });
    }

    // Check if user has already rated this store
    const existingRating = await Rating.findOne({
      where: {
        userId: req.user.id,
        storeId
      }
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this store'
      });
    }

    // Create rating
    const rating = await Rating.create({
      score,
      comment,
      userId: req.user.id,
      storeId
    });

    res.status(201).json({
      success: true,
      data: rating
    });
  } catch (error) {
    console.error('Add rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update rating
// @route   PUT /api/ratings/:id
// @access  Private (owner of the rating or admin)
exports.updateRating = async (req, res) => {
  try {
    let rating = await Rating.findByPk(req.params.id);

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Check if user is owner of the rating or admin
    if (rating.userId !== req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this rating'
      });
    }

    // Update rating
    rating = await rating.update(req.body);

    res.status(200).json({
      success: true,
      data: rating
    });
  } catch (error) {
    console.error('Update rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete rating
// @route   DELETE /api/ratings/:id
// @access  Private (owner of the rating or admin)
exports.deleteRating = async (req, res) => {
  try {
    const rating = await Rating.findByPk(req.params.id);

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Check if user is owner of the rating or admin
    if (rating.userId !== req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this rating'
      });
    }

    await rating.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get ratings statistics (admin only)
// @route   GET /api/ratings/stats
// @access  Private (admin only)
exports.getRatingStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view rating statistics'
      });
    }

    const count = await Rating.count();
    const averageRating = await Rating.findOne({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('score')), 'averageScore']
      ]
    });
    
    const ratingDistribution = await Rating.findAll({
      attributes: [
        'score',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['score'],
      order: [['score', 'DESC']]
    });

    const recentRatings = await Rating.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name']
        },
        {
          model: Store,
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      success: true,
      data: {
        count,
        averageRating: parseFloat(averageRating.dataValues.averageScore) || 0,
        ratingDistribution,
        recentRatings
      }
    });
  } catch (error) {
    console.error('Get rating stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's ratings
// @route   GET /api/ratings/user
// @access  Private
exports.getUserRatings = async (req, res) => {
  try {
    const ratings = await Rating.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Store,
          attributes: ['id', 'name', 'address'],
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: ratings.length,
      data: ratings
    });
  } catch (error) {
    console.error('Get user ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 