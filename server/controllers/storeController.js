const { Store, Rating, User } = require('../models');
const { ROLES } = require('../models/User');
const { sequelize } = require('../config/db');

// @desc    Get all stores
// @route   GET /api/stores
// @access  Public
exports.getStores = async (req, res) => {
  try {
    const stores = await Store.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        },
        {
          model: Rating,
          attributes: ['id', 'score', 'comment']
        }
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT AVG(score)
              FROM "Ratings" AS "Rating"
              WHERE "Rating"."storeId" = "Store"."id"
            )`),
            'averageRating'
          ]
        ]
      }
    });

    res.status(200).json({
      success: true,
      count: stores.length,
      data: stores
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single store
// @route   GET /api/stores/:id
// @access  Public
exports.getStore = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        },
        {
          model: Rating,
          include: {
            model: User,
            attributes: ['id', 'name']
          }
        }
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT AVG(score)
              FROM "Ratings" AS "Rating"
              WHERE "Rating"."storeId" = "Store"."id"
            )`),
            'averageRating'
          ]
        ]
      }
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    res.status(200).json({
      success: true,
      data: store
    });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create store
// @route   POST /api/stores
// @access  Private (store owners only)
exports.createStore = async (req, res) => {
  try {
    // Check if user is a store owner or admin
    if (![ROLES.STORE_OWNER, ROLES.ADMIN].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only store owners can create stores'
      });
    }

    // Add owner ID from authenticated user
    req.body.ownerId = req.user.id;

    const store = await Store.create(req.body);

    res.status(201).json({
      success: true,
      data: store
    });
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update store
// @route   PUT /api/stores/:id
// @access  Private (store owners only)
exports.updateStore = async (req, res) => {
  try {
    let store = await Store.findByPk(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if user is owner of the store or admin
    if (store.ownerId !== req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this store'
      });
    }

    // Update store
    store = await store.update(req.body);

    res.status(200).json({
      success: true,
      data: store
    });
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete store
// @route   DELETE /api/stores/:id
// @access  Private (store owners and admin only)
exports.deleteStore = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if user is owner of the store or admin
    if (store.ownerId !== req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this store'
      });
    }

    await store.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get store statistics (admin only)
// @route   GET /api/stores/stats
// @access  Private (admin only)
exports.getStoreStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view store statistics'
      });
    }

    const count = await Store.count();
    const topRated = await Store.findAll({
      attributes: [
        'id', 
        'name', 
        'address',
        [sequelize.fn('AVG', sequelize.col('Ratings.score')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('Ratings.id')), 'ratingCount']
      ],
      include: [
        {
          model: Rating,
          attributes: []
        }
      ],
      group: ['Store.id'],
      order: [[sequelize.fn('AVG', sequelize.col('Ratings.score')), 'DESC']],
      limit: 5
    });

    res.status(200).json({
      success: true,
      data: {
        count,
        topRated
      }
    });
  } catch (error) {
    console.error('Get store stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get stores owned by current user
// @route   GET /api/stores/owned
// @access  Private (store owners only)
exports.getOwnedStores = async (req, res) => {
  try {
    // Check if user is a store owner
    if (req.user.role !== ROLES.STORE_OWNER) {
      return res.status(403).json({
        success: false,
        message: 'Only store owners can access owned stores'
      });
    }

    // Get stores owned by current user
    const stores = await Store.findAll({
      where: { ownerId: req.user.id },
      include: [
        {
          model: Rating,
          attributes: ['id', 'score', 'comment', 'userId', 'createdAt']
        }
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT AVG(score)
              FROM "Ratings" AS "Rating"
              WHERE "Rating"."storeId" = "Store"."id"
            )`),
            'averageRating'
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM "Ratings" AS "Rating"
              WHERE "Rating"."storeId" = "Store"."id"
            )`),
            'ratingsCount'
          ]
        ]
      }
    });

    res.status(200).json({
      success: true,
      count: stores.length,
      data: stores
    });
  } catch (error) {
    console.error('Get owned stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get stats for a specific store
// @route   GET /api/stores/:id/stats
// @access  Private (store owner of the store or admin)
exports.getStoreStatsById = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if user is owner of the store or admin
    if (store.ownerId !== req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access stats for this store'
      });
    }

    // Get ratings count
    const ratingsCount = await Rating.count({ where: { storeId: store.id } });

    // Get average rating
    const avgRating = await Rating.findOne({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('score')), 'averageScore']
      ],
      where: { storeId: store.id }
    });

    // Get rating distribution
    const ratingDistribution = await Rating.findAll({
      attributes: [
        'score',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { storeId: store.id },
      group: ['score'],
      order: [['score', 'DESC']]
    });

    // Get recent ratings
    const recentRatings = await Rating.findAll({
      where: { storeId: store.id },
      include: {
        model: User,
        attributes: ['id', 'name']
      },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      success: true,
      data: {
        store: {
          id: store.id,
          name: store.name,
          address: store.address,
          description: store.description
        },
        stats: {
          ratingsCount,
          averageRating: parseFloat(avgRating.dataValues.averageScore) || 0,
          ratingDistribution,
          recentRatings
        }
      }
    });
  } catch (error) {
    console.error('Get store stats by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 