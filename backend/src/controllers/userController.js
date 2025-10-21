const User = require('../models/User');

// @desc    Update user onboarding data
// @route   PATCH /api/users/onboarding
// @access  Private
const updateOnboarding = async (req, res) => {
  try {
    const { step, data } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update current step
    if (step !== undefined) {
      user.onboarding.currentStep = step;
    }

    // Update specific onboarding data based on step
    if (data) {
      switch (step) {
        case 2: // Basic Info
          user.onboarding.basicInfo = {
            ...user.onboarding.basicInfo,
            ...data
          };
          break;
        case 3: // Medical
          user.onboarding.medical = {
            ...user.onboarding.medical,
            ...data
          };
          break;
        case 4: // Preferences
          user.onboarding.preferences = {
            ...user.onboarding.preferences,
            ...data
          };
          break;
        case 5: // Lifestyle
          user.onboarding.lifestyle = {
            ...user.onboarding.lifestyle,
            ...data
          };
          break;
        case 6: // Review - Store calculated health metrics
          if (data && user.onboarding.basicInfo) {
            // Use the data sent from frontend (already calculated)
            user.onboarding.healthMetrics = data;
          } else if (user.onboarding.basicInfo) {
            // Fallback: calculate on server if no data provided
            const healthMetrics = user.calculateHealthMetrics();
            user.onboarding.healthMetrics = healthMetrics;
          }
          user.onboarding.completed = true;
          break;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'Onboarding data updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Onboarding update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Calculate health metrics
// @route   POST /api/users/calculate-metrics
// @access  Private
const calculateHealthMetrics = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.onboarding.basicInfo) {
      return res.status(400).json({
        success: false,
        message: 'Basic information required to calculate metrics'
      });
    }

    const healthMetrics = user.calculateHealthMetrics();

    // Save to user profile
    user.onboarding.healthMetrics = healthMetrics;
    await user.save();

    res.json({
      success: true,
      message: 'Health metrics calculated successfully',
      data: healthMetrics
    });
  } catch (error) {
    console.error('Calculate metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    console.log('🔍 getProfile called with userId:', req.userId);
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      console.log('❌ User not found for userId:', req.userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ User found:', user._id, 'onboarding completed:', user.onboarding?.completed);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update basic info
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;

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
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Follow a user
// @route   POST /api/users/follow/:userId
// @access  Private
const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
    }

    const userToFollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already following
    if (currentUser.social.following.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user'
      });
    }

    // Add to following list
    currentUser.social.following.push(userId);
    await currentUser.save();

    // Add to followers list
    userToFollow.social.followers.push(currentUserId);
    await userToFollow.save();

    res.json({
      success: true,
      message: 'User followed successfully',
      data: {
        followingCount: currentUser.social.following.length,
        followersCount: userToFollow.social.followers.length
      }
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/users/follow/:userId
// @access  Private
const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    const userToUnfollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove from following list
    currentUser.social.following = currentUser.social.following.filter(
      id => id.toString() !== userId
    );
    await currentUser.save();

    // Remove from followers list
    userToUnfollow.social.followers = userToUnfollow.social.followers.filter(
      id => id.toString() !== currentUserId
    );
    await userToUnfollow.save();

    res.json({
      success: true,
      message: 'User unfollowed successfully',
      data: {
        followingCount: currentUser.social.following.length,
        followersCount: userToUnfollow.social.followers.length
      }
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user's followers
// @route   GET /api/users/:userId/followers
// @access  Private
const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if profile is private and user is not following
    if (user.social.isPrivate && userId !== currentUserId) {
      const isFollowing = user.social.followers.includes(currentUserId);
      if (!isFollowing) {
        return res.status(403).json({
          success: false,
          message: 'This profile is private'
        });
      }
    }

    const followers = await User.find({
      _id: { $in: user.social.followers }
    }).select('firstName lastName social.profilePicture social.bio');

    res.json({
      success: true,
      data: {
        followers,
        count: followers.length
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get users that a user is following
// @route   GET /api/users/:userId/following
// @access  Private
const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if profile is private and user is not following
    if (user.social.isPrivate && userId !== currentUserId) {
      const isFollowing = user.social.followers.includes(currentUserId);
      if (!isFollowing) {
        return res.status(403).json({
          success: false,
          message: 'This profile is private'
        });
      }
    }

    const following = await User.find({
      _id: { $in: user.social.following }
    }).select('firstName lastName social.profilePicture social.bio');

    res.json({
      success: true,
      data: {
        following,
        count: following.length
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get follow suggestions
// @route   GET /api/users/follow-suggestions
// @access  Private
const getFollowSuggestions = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { limit = 10 } = req.query;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get users not followed by current user and not the current user
    const followingIds = currentUser.social.following.map(id => id.toString());
    followingIds.push(currentUserId);

    const suggestions = await User.find({
      _id: { $nin: followingIds },
      'social.isPrivate': false // Only suggest public profiles
    })
    .select('firstName lastName social.profilePicture social.bio')
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        suggestions,
        count: suggestions.length
      }
    });
  } catch (error) {
    console.error('Get follow suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  updateOnboarding,
  calculateHealthMetrics,
  getProfile,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowSuggestions
};
