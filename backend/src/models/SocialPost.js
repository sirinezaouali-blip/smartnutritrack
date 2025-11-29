const mongoose = require('mongoose');

// Separate comment schema definition
const replySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [replySchema]
}, {
  timestamps: true
});

const socialPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'progress',        // Weight loss, fitness progress
      'achievement',     // Goals reached, milestones
      'challenge',       // Fitness/nutrition challenges
      'meal_share',      // Meal photos and recipes
      'workout',         // Exercise routines
      'question',        // Ask community for advice
      'tip',             // Share tips and tricks
      'review',          // Product/service reviews
      'motivation'       // Inspirational content
    ],
    required: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  // Media attachments
  mediaUrls: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'video'],
      default: 'image'
    },
    thumbnail: String,
    caption: String
  }],
  
  // Tags and categories
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  categories: [{
    type: String,
    enum: [
      'weight_loss', 'muscle_gain', 'healthy_eating', 'fitness',
      'recipes', 'nutrition', 'wellness', 'mental_health',
      'community', 'challenges', 'qna'
    ]
  }],
  
  // Progress posts data
  progressData: {
    currentWeight: Number,
    weightChange: Number,
    progressPhotos: [String],
    measurements: {
      chest: Number,
      waist: Number,
      hips: Number,
      arms: Number
    },
    fitnessStats: {
      workoutsThisWeek: Number,
      activeMinutes: Number,
      steps: Number
    }
  },
  
  // Achievement posts data
  achievement: {
    type: {
      type: String,
      enum: [
        'weight_loss', 'streak', 'goal_reached', 'fitness_milestone',
        'personal_best', 'diet_success', 'transformation'
      ]
    },
    value: mongoose.Schema.Types.Mixed,
    unit: String,
    duration: String,
    beforeAfterPhotos: [String]
  },
  
  // Challenge posts data
  challenge: {
    title: String,
    description: String,
    startDate: Date,
    endDate: Date,
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    goals: [String],
    rules: [String],
    prize: String
  },
  
  // Meal share posts data
  mealData: {
    mealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meal'
    },
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
    ingredients: [String],
    recipe: String,
    cookingTime: Number,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Engagement metrics
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  shares: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  
  // Privacy and visibility
  visibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  allowSharing: {
    type: Boolean,
    default: true
  },
  
  // Location data
  location: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    city: String,
    country: String
  },
  
  // Moderation and reporting
  reported: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    details: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isFlagged: {
    type: Boolean,
    default: false
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  
  // Analytics
  engagementScore: {
    type: Number,
    default: 0
  },
  trendingScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
socialPostSchema.index({ userId: 1, createdAt: -1 });
socialPostSchema.index({ type: 1, createdAt: -1 });
socialPostSchema.index({ tags: 1 });
socialPostSchema.index({ categories: 1 });
socialPostSchema.index({ visibility: 1 });
socialPostSchema.index({ likes: 1 });
socialPostSchema.index({ engagementScore: -1 });
socialPostSchema.index({ trendingScore: -1 });
socialPostSchema.index({ createdAt: -1 });

// Add to your existing SocialPost model

// Pre-save middleware to extract hashtags
socialPostSchema.pre('save', function(next) {
  // Extract hashtags from content
  const hashtagRegex = /#(\w+)/g;
  const matches = this.content.match(hashtagRegex);
  
  if (matches) {
    // Add hashtags to tags array (remove the # symbol and convert to lowercase)
    const newHashtags = matches.map(tag => tag.slice(1).toLowerCase());
    
    // Merge with existing tags, remove duplicates
    this.tags = [...new Set([...this.tags, ...newHashtags])];
  }
  
  // Calculate engagement score
  const likeScore = this.likes.length * 2;
  const commentScore = this.comments.length * 3;
  const shareScore = this.shares.length * 5;
  const viewScore = Math.min(this.views * 0.1, 10);
  
  this.engagementScore = likeScore + commentScore + shareScore + viewScore;
  
  // Calculate trending score
  const now = new Date();
  const postAge = (now - this.createdAt) / (1000 * 60 * 60); // hours
  const timeDecay = Math.max(0.1, 1 - (postAge / 168)); // decay over 1 week
  
  this.trendingScore = this.engagementScore * timeDecay;
  
  next();
});

// Static method to search posts
socialPostSchema.statics.searchPosts = async function(searchParams) {
  const {
    query = '',
    categories = [],
    tags = [],
    types = [],
    userId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = searchParams;

  const skip = (page - 1) * limit;
  const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  // Build search query
  let searchQuery = {
    visibility: 'public',
    isHidden: false
  };

  // Text search across multiple fields
  if (query.trim()) {
    searchQuery.$or = [
      { content: { $regex: query, $options: 'i' } },
      { title: { $regex: query, $options: 'i' } },
      { tags: { $in: [query.toLowerCase()] } }
    ];
  }

  // Filter by categories
  if (categories.length > 0) {
    searchQuery.categories = { $in: categories };
  }

  // Filter by tags
  if (tags.length > 0) {
    searchQuery.tags = { $in: tags.map(tag => tag.toLowerCase()) };
  }

  // Filter by post types
  if (types.length > 0) {
    searchQuery.type = { $in: types };
  }

  // Filter by user
  if (userId) {
    searchQuery.userId = userId;
  }

  const posts = await this.find(searchQuery)
    .populate('userId', 'firstName lastName social.profilePicture')
    .populate('comments.userId', 'firstName lastName profilePicture')
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  const total = await this.countDocuments(searchQuery);

  return {
    posts,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total
  };
};

// Static method to get trending hashtags
socialPostSchema.statics.getTrendingHashtags = async function(limit = 10, timeframe = 'week') {
  let timeFilter = {};
  const now = new Date();
  
  switch (timeframe) {
    case 'day':
      timeFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 1)) } };
      break;
    case 'week':
      timeFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) } };
      break;
    case 'month':
      timeFilter = { createdAt: { $gte: new Date(now.setMonth(now.getMonth() - 1)) } };
      break;
  }

  const hashtagStats = await this.aggregate([
    { $match: { ...timeFilter, tags: { $exists: true, $ne: [] } } },
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 },
        totalEngagement: { $sum: '$engagementScore' },
        recentPosts: { $push: '$$ROOT' }
      }
    },
    { $sort: { count: -1, totalEngagement: -1 } },
    { $limit: limit }
  ]);

  return hashtagStats.map(stat => ({
    tag: stat._id,
    count: stat.count,
    engagement: stat.totalEngagement
  }));
};

// Static method to get posts by hashtag
socialPostSchema.statics.getPostsByHashtag = async function(hashtag, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const skip = (page - 1) * limit;
  const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const posts = await this.find({
    tags: hashtag.toLowerCase(),
    visibility: 'public',
    isHidden: false
  })
    .populate('userId', 'firstName lastName social.profilePicture')
    .populate('comments.userId', 'firstName lastName profilePicture')
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  const total = await this.countDocuments({
    tags: hashtag.toLowerCase(),
    visibility: 'public',
    isHidden: false
  });

  return {
    posts,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total
  };
};

// Pre-save middleware to calculate engagement scores
socialPostSchema.pre('save', function(next) {
  // Calculate engagement score based on interactions
  const likeScore = this.likes.length * 2;
  const commentScore = this.comments.reduce((total, comment) => {
    return total + 3 + (comment.replies.length * 2);
  }, 0);
  const shareScore = this.shares.length * 5;
  const viewScore = Math.min(this.views * 0.1, 10);
  
  this.engagementScore = likeScore + commentScore + shareScore + viewScore;
  
  // Calculate trending score (recent engagement weighted higher)
  const now = new Date();
  const postAge = (now - this.createdAt) / (1000 * 60 * 60); // hours
  const timeDecay = Math.max(0.1, 1 - (postAge / 168)); // decay over 1 week
  
  this.trendingScore = this.engagementScore * timeDecay;
  
  next();
});

// Method to add a comment
socialPostSchema.methods.addComment = function(userId, text, parentCommentId = null) {
  if (parentCommentId) {
    // Add reply to existing comment
    const parentComment = this.comments.id(parentCommentId);
    if (parentComment) {
      parentComment.replies.push({
        userId,
        text
      });
      return this.save();
    }
    throw new Error('Parent comment not found');
  } else {
    // Add new comment
    this.comments.push({
      userId,
      text
    });
    return this.save();
  }
};

// Method to toggle like on post
socialPostSchema.methods.toggleLike = function(userId) {
  const likeIndex = this.likes.findIndex(likeId => likeId.toString() === userId.toString());
  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
  } else {
    this.likes.push(userId);
  }
  return this.save();
};

// Method to toggle like on comment
socialPostSchema.methods.toggleCommentLike = function(commentId, userId) {
  const comment = this.comments.id(commentId);
  if (comment) {
    const likeIndex = comment.likes.findIndex(likeId => likeId.toString() === userId.toString());
    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(userId);
    }
    return this.save();
  }
  throw new Error('Comment not found');
};

// Method to share post
socialPostSchema.methods.sharePost = function(userId) {
  // Check if user already shared this post
  const alreadyShared = this.shares.some(share => share.userId.toString() === userId.toString());
  if (!alreadyShared) {
    this.shares.push({ userId });
    return this.save();
  }
  return Promise.resolve(this); // Already shared, no action needed
};

// Method to report post
socialPostSchema.methods.reportPost = function(userId, reason, details = '') {
  // Check if user already reported this post
  const alreadyReported = this.reported.some(report => report.userId.toString() === userId.toString());
  if (!alreadyReported) {
    this.reported.push({
      userId,
      reason,
      details
    });
    
    // Auto-flag if multiple reports
    if (this.reported.length >= 3) {
      this.isFlagged = true;
    }
    
    return this.save();
  }
  throw new Error('User already reported this post');
};

// Static method to get feed posts with advanced filtering
socialPostSchema.statics.getFeed = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 10,
    types = [],
    categories = [],
    tags = [],
    sortBy = 'trendingScore',
    sortOrder = 'desc'
  } = options;
  
  const skip = (page - 1) * limit;
  const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
  
  // Build query for public posts or posts from followed users
  let query = {
    $or: [
      { visibility: 'public' },
      { userId: userId } // User's own posts
    ],
    isHidden: false,
    isFlagged: false
  };
  
  // Add filters
  if (types.length > 0) {
    query.type = { $in: types };
  }
  
  if (categories.length > 0) {
    query.categories = { $in: categories };
  }
  
  if (tags.length > 0) {
    query.tags = { $in: tags };
  }
  
  const posts = await this.find(query)
    .populate('userId', 'firstName lastName profilePicture social')
    .populate('comments.userId', 'firstName lastName profilePicture')
    .populate('comments.replies.userId', 'firstName lastName profilePicture')
    .populate('likes', 'firstName lastName profilePicture')
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .lean(); // Use lean for better performance

  return posts;
};

// Static method to get user's posts
socialPostSchema.statics.getUserPosts = function(userId, options = {}) {
  const {
    page = 1,
    limit = 10,
    types = [],
    visibility = []
  } = options;
  
  const skip = (page - 1) * limit;
  
  let query = { userId, isHidden: false };
  
  if (types.length > 0) {
    query.type = { $in: types };
  }
  
  if (visibility.length > 0) {
    query.visibility = { $in: visibility };
  }
  
  return this.find(query)
    .populate('userId', 'firstName lastName profilePicture')
    .populate('comments.userId', 'firstName lastName profilePicture')
    .populate('likes', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get trending posts
socialPostSchema.statics.getTrendingPosts = function(limit = 10) {
  return this.find({
    visibility: 'public',
    isHidden: false,
    isFlagged: false,
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
  })
  .populate('userId', 'firstName lastName profilePicture')
  .sort({ trendingScore: -1 })
  .limit(limit);
};

// Static method to get posts by engagement
socialPostSchema.statics.getMostEngagedPosts = function(limit = 10, timeframe = 'week') {
  let timeFilter = {};
  const now = new Date();
  
  switch (timeframe) {
    case 'day':
      timeFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 1)) } };
      break;
    case 'week':
      timeFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) } };
      break;
    case 'month':
      timeFilter = { createdAt: { $gte: new Date(now.setMonth(now.getMonth() - 1)) } };
      break;
  }
  
  return this.find({
    ...timeFilter,
    visibility: 'public',
    isHidden: false,
    isFlagged: false
  })
  .populate('userId', 'firstName lastName profilePicture')
  .sort({ engagementScore: -1 })
  .limit(limit);
};

module.exports = mongoose.model('SocialPost', socialPostSchema);