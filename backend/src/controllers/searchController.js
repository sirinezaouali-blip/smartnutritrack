const SocialPost = require('../models/SocialPost');
const User = require('../models/User');

// @desc    Search posts
// @route   GET /api/search/posts
// @access  Private
const searchPosts = async (req, res) => {
  try {
    const {
      q: query = '',
      categories,
      tags,
      types,
      userId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const searchParams = {
      query: query.trim(),
      categories: categories ? categories.split(',') : [],
      tags: tags ? tags.split(',') : [],
      types: types ? types.split(',') : [],
      userId,
      sortBy,
      sortOrder,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await SocialPost.searchPosts(searchParams);

    res.json({
      success: true,
      data: {
        posts: result.posts,
        pagination: {
          page: result.page,
          limit: parseInt(limit),
          total: result.total,
          totalPages: result.totalPages,
          hasMore: result.hasMore
        },
        searchParams
      }
    });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching posts',
      error: error.message
    });
  }
};

// @desc    Get trending hashtags
// @route   GET /api/search/trending-hashtags
// @access  Private
const getTrendingHashtags = async (req, res) => {
  try {
    const { limit = 10, timeframe = 'week' } = req.query;

    const trendingHashtags = await SocialPost.getTrendingHashtags(
      parseInt(limit),
      timeframe
    );

    res.json({
      success: true,
      data: {
        hashtags: trendingHashtags,
        timeframe
      }
    });
  } catch (error) {
    console.error('Get trending hashtags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching trending hashtags',
      error: error.message
    });
  }
};

// @desc    Get posts by hashtag
// @route   GET /api/search/hashtag/:hashtag
// @access  Private
const getPostsByHashtag = async (req, res) => {
  try {
    const { hashtag } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const result = await SocialPost.getPostsByHashtag(hashtag, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      data: {
        posts: result.posts,
        hashtag,
        pagination: {
          page: result.page,
          limit: parseInt(limit),
          total: result.total,
          totalPages: result.totalPages,
          hasMore: result.hasMore
        }
      }
    });
  } catch (error) {
    console.error('Get posts by hashtag error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching posts by hashtag',
      error: error.message
    });
  }
};

// @desc    Search users
// @route   GET /api/search/users
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { q: query = '', page = 1, limit = 10 } = req.query;

    const searchQuery = {
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    };

    const skip = (page - 1) * limit;

    const users = await User.find(searchQuery)
      .select('firstName lastName email social.profilePicture social.bio')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(searchQuery);

    res.json({
      success: true,
      data: {
        users,
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
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching users',
      error: error.message
    });
  }
};

module.exports = {
  searchPosts,
  getTrendingHashtags,
  getPostsByHashtag,
  searchUsers
};