const User = require('../models/User');
const SocialPost = require('../models/SocialPost');
const Achievement = require('../models/Achievement');

// @desc    Get user profile
// @route   GET /api/profile/:userId
// @access  Private
const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    const user = await User.findById(userId)
      .select('-password -verificationCode -resetPasswordToken')
      .populate('achievements.badges.badgeId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check privacy settings
    if (user.privacy.profile === 'private' && userId !== currentUserId) {
      const isFollowing = user.social.followers.includes(currentUserId);
      if (!isFollowing) {
        return res.status(403).json({
          success: false,
          message: 'This profile is private'
        });
      }
    }

    // Get user's recent posts
    const recentPosts = await SocialPost.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'firstName lastName profile.profilePicture');

    // Calculate additional stats
    const totalPosts = await SocialPost.countDocuments({ userId });
    const totalLikes = await SocialPost.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, total: { $sum: { $size: '$likes' } } } }
    ]);

    const profileData = {
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profile: user.profile,
        stats: {
          ...user.stats,
          postsCount: totalPosts,
          totalLikes: totalLikes[0]?.total || 0
        },
        achievements: user.achievements,
        privacy: user.privacy,
        joinedAt: user.createdAt
      },
      recentPosts: recentPosts.map(post => ({
        _id: post._id,
        content: post.content,
        type: post.type,
        likes: post.likes.length,
        comments: post.comments.length,
        createdAt: post.createdAt,
        mediaUrls: post.mediaUrls
      })),
      isFollowing: user.social.followers.includes(currentUserId),
      isOwnProfile: userId === currentUserId
    };

    res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const updateData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Allowed fields to update
    const allowedUpdates = [
      'profile.bio',
      'profile.location',
      'profile.website',
      'profile.coverPhoto',
      'profile.profilePicture',
      'profile.socialLinks',
      'privacy.profile',
      'privacy.activity',
      'privacy.showOnlineStatus'
    ];

    // Apply updates
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        const keys = key.split('.');
        if (keys.length === 2) {
          user[keys[0]][keys[1]] = updateData[key];
        }
      }
    });

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
      error: error.message
    });
  }
};

// @desc    Get user achievements
// @route   GET /api/profile/:userId/achievements
// @access  Private
const getAchievements = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate('achievements.badges.badgeId')
      .select('achievements firstName lastName');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get all available achievements to show progress
    const allAchievements = await Achievement.find({ isActive: true });
    
    const achievementsWithProgress = allAchievements.map(achievement => {
      const userBadge = user.achievements.badges.find(
        badge => badge.badgeId._id.toString() === achievement._id.toString()
      );

      return {
        ...achievement.toObject(),
        isUnlocked: !!userBadge,
        progress: userBadge?.progress || 0,
        earnedAt: userBadge?.earnedAt
      };
    });

    // Group by category
    const achievementsByCategory = achievementsWithProgress.reduce((acc, achievement) => {
      const category = achievement.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(achievement);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        achievements: achievementsByCategory,
        totalPoints: user.achievements.points,
        level: user.achievements.level,
        unlockedCount: user.achievements.badges.length,
        totalCount: allAchievements.length
      }
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching achievements',
      error: error.message
    });
  }
};

// @desc    Get user's posts with filters
// @route   GET /api/profile/:userId/posts
// @access  Private
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      type,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { userId };
    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const posts = await SocialPost.find(query)
      .populate('userId', 'firstName lastName profile.profilePicture')
      .populate('comments.userId', 'firstName lastName profilePicture')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SocialPost.countDocuments(query);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total
        }
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user posts',
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAchievements,
  getUserPosts
};