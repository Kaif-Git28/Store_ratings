const { User, Store, Rating } = require('../models');
const { ROLES } = require('../models/User');
const { sequelize } = require('../config/db');

// @desc    Get dashboard stats (admin only)
// @route   GET /api/dashboard/stats
// @access  Private (admin only)
exports.getDashboardStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access dashboard statistics'
      });
    }

    // Get counts in parallel
    const [userCount, storeCount, ratingCount] = await Promise.all([
      User.count(),
      Store.count(),
      Rating.count()
    ]);

    // Get user counts by role
    const adminCount = await User.count({ where: { role: ROLES.ADMIN } });
    const storeOwnerCount = await User.count({ where: { role: ROLES.STORE_OWNER } });
    const normalUserCount = await User.count({ where: { role: ROLES.NORMAL_USER } });

    // Get top rated stores (limit to 5)
    const topRatedStores = await Store.findAll({
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
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM "Ratings" AS "Rating"
              WHERE "Rating"."storeId" = "Store"."id"
            )`),
            'ratingCount'
          ]
        ]
      },
      order: [[sequelize.literal('"averageRating"'), 'DESC']],
      limit: 5
    });

    // Get recent ratings (limit to 5)
    const recentRatings = await Rating.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
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
        counts: {
          users: userCount,
          stores: storeCount,
          ratings: ratingCount,
          usersByRole: {
            admin: adminCount,
            storeOwner: storeOwnerCount,
            normalUser: normalUserCount
          }
        },
        topRatedStores,
        recentRatings
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 