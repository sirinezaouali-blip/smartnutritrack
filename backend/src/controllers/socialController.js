const SocialPost = require('../models/SocialPost');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create social post
// @route   POST /api/social/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const {
      type,
      title,
      content,
      mediaUrls = [],
      tags = [],
      categories = [],
      progressData,
      achievement,
      challenge,
      mealData,
      visibility = 'public',
      allowComments = true,
      allowSharing = true,
      location
    } = req.body;
    
    const userId = req.userId;

    if (!content || !type) {
      return res.status(400).json({
        success: false,
        message: 'Post content and type are required'
      });
    }

    // Create post with all provided data
    const post = await SocialPost.create({
      userId,
      type,
      title,
      content,
      mediaUrls,
      tags: tags.map(tag => tag.toLowerCase().trim()),
      categories,
      progressData,
      achievement,
      challenge,
      mealData,
      visibility,
      allowComments,
      allowSharing,
      location
    });

    await post.populate('userId', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating post',
      error: error.message
    });
  }
};

// @desc    Get social feed with advanced filtering
// @route   GET /api/social/feed
// @access  Private
const getFeed = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      page = 1,
      limit = 10,
      types,
      categories,
      tags,
      sortBy = 'trendingScore',
      sortOrder = 'desc'
    } = req.query;

    // Parse array parameters
    const typeArray = types ? types.split(',') : [];
    const categoryArray = categories ? categories.split(',') : [];
    const tagArray = tags ? tags.split(',') : [];

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      types: typeArray,
      categories: categoryArray,
      tags: tagArray,
      sortBy,
      sortOrder
    };

    const posts = await SocialPost.getFeed(userId, options);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: posts.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching feed',
      error: error.message
    });
  }
};

// @desc    Get user's posts
// @route   GET /api/social/posts/my
// @access  Private
const getMyPosts = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      page = 1,
      limit = 10,
      types,
      visibility
    } = req.query;

    const typeArray = types ? types.split(',') : [];
    const visibilityArray = visibility ? visibility.split(',') : [];

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      types: typeArray,
      visibility: visibilityArray
    };

    const posts = await SocialPost.getUserPosts(userId, options);
    const totalPosts = await SocialPost.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalPosts,
          totalPages: Math.ceil(totalPosts / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching posts',
      error: error.message
    });
  }
};

// @desc    Get post by ID
// @route   GET /api/social/posts/:id
// @access  Private
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Increment view count
    await SocialPost.findByIdAndUpdate(id, { $inc: { views: 1 } });

    const post = await SocialPost.findById(id)
      .populate('userId', 'firstName lastName profilePicture')
      .populate('comments.userId', 'firstName lastName profilePicture')
      .populate('comments.replies.userId', 'firstName lastName profilePicture')
      .populate('likes', 'firstName lastName profilePicture')
      .populate('shares.userId', 'firstName lastName profilePicture');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check visibility
    if (post.visibility === 'private' && post.userId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - private post'
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Get post by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching post',
      error: error.message
    });
  }
};

// @desc    Like/unlike a post
// @route   POST /api/social/posts/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const post = await SocialPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await post.toggleLike(userId);
    await post.populate('likes', 'firstName lastName profilePicture');

    res.json({
      success: true,
      message: post.likes.includes(userId) ? 'Post liked' : 'Post unliked',
      data: {
        likes: post.likes,
        likesCount: post.likes.length
      }
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling like',
      error: error.message
    });
  }
};

// @desc    Add comment to post
// @route   POST /api/social/posts/:id/comment
// @access  Private
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, parentCommentId } = req.body;
    const userId = req.userId;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const post = await SocialPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (!post.allowComments) {
      return res.status(400).json({
        success: false,
        message: 'Comments are disabled for this post'
      });
    }

    await post.addComment(userId, text, parentCommentId);
    await post.populate('comments.userId', 'firstName lastName profilePicture');
    await post.populate('comments.replies.userId', 'firstName lastName profilePicture');

    const newComment = parentCommentId 
      ? post.comments.id(parentCommentId).replies.slice(-1)[0]
      : post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      message: parentCommentId ? 'Reply added successfully' : 'Comment added successfully',
      data: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding comment',
      error: error.message
    });
  }
};

// @desc    Like/unlike a comment
// @route   POST /api/social/posts/:postId/comments/:commentId/like
// @access  Private
const toggleCommentLike = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.userId;

    const post = await SocialPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await post.toggleCommentLike(commentId, userId);

    const comment = post.comments.id(commentId);
    await comment.populate('likes', 'firstName lastName profilePicture');

    res.json({
      success: true,
      message: comment.likes.includes(userId) ? 'Comment liked' : 'Comment unliked',
      data: {
        likes: comment.likes,
        likesCount: comment.likes.length
      }
    });
  } catch (error) {
    console.error('Toggle comment like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling comment like',
      error: error.message
    });
  }
};

// @desc    Share a post
// @route   POST /api/social/posts/:id/share
// @access  Private
const sharePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const post = await SocialPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (!post.allowSharing) {
      return res.status(400).json({
        success: false,
        message: 'Sharing is disabled for this post'
      });
    }

    await post.sharePost(userId);
    await post.populate('shares.userId', 'firstName lastName profilePicture');

    res.json({
      success: true,
      message: 'Post shared successfully',
      data: {
        shares: post.shares,
        sharesCount: post.shares.length
      }
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sharing post',
      error: error.message
    });
  }
};

// @desc    Report a post
// @route   POST /api/social/posts/:id/report
// @access  Private
const reportPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, details } = req.body;
    const userId = req.userId;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Report reason is required'
      });
    }

    const post = await SocialPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user already reported this post
    const alreadyReported = post.reported.some(report => 
      report.userId.toString() === userId
    );

    if (alreadyReported) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this post'
      });
    }

    await post.reportPost(userId, reason, details);

    res.json({
      success: true,
      message: 'Post reported successfully',
      data: {
        isFlagged: post.isFlagged,
        reportCount: post.reported.length
      }
    });
  } catch (error) {
    console.error('Report post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error reporting post',
      error: error.message
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/social/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const post = await SocialPost.findOne({ _id: id, userId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or access denied'
      });
    }

    await SocialPost.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting post',
      error: error.message
    });
  }
};

// @desc    Get trending posts
// @route   GET /api/social/trending
// @access  Private
const getTrendingPosts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const posts = await SocialPost.getTrendingPosts(parseInt(limit));

    res.json({
      success: true,
      data: {
        posts,
        count: posts.length
      }
    });
  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching trending posts',
      error: error.message
    });
  }
};

// @desc    Get most engaged posts
// @route   GET /api/social/most-engaged
// @access  Private
const getMostEngagedPosts = async (req, res) => {
  try {
    const { limit = 10, timeframe = 'week' } = req.query;

    const posts = await SocialPost.getMostEngagedPosts(parseInt(limit), timeframe);

    res.json({
      success: true,
      data: {
        posts,
        count: posts.length,
        timeframe
      }
    });
  } catch (error) {
    console.error('Get most engaged posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching most engaged posts',
      error: error.message
    });
  }
};

// @desc    Update post
// @route   PUT /api/social/posts/:id
// @access  Private
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const updateData = req.body;

    const post = await SocialPost.findOne({ _id: id, userId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or access denied'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'content', 'mediaUrls', 'tags', 'categories',
      'visibility', 'allowComments', 'allowSharing', 'location'
    ];

    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        post[field] = updateData[field];
      }
    });

    // Handle tags formatting
    if (updateData.tags) {
      post.tags = updateData.tags.map(tag => tag.toLowerCase().trim());
    }

    await post.save();
    await post.populate('userId', 'firstName lastName profilePicture');

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating post',
      error: error.message
    });
  }
};

module.exports = {
  createPost,
  getFeed,
  getMyPosts,
  getPostById,
  toggleLike,
  addComment,
  toggleCommentLike,
  sharePost,
  reportPost,
  deletePost,
  getTrendingPosts,
  getMostEngagedPosts,
  updatePost
};
