const mongoose = require('mongoose');

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
  replies: [{
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
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
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
    value: mongoose.Schema.Types.Mixed, // Can be number, string, etc.
    unit: String,
    duration: String, // e.g., "30 days", "6 months"
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
    fat: Number,
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
socialPostSchema.index({ 'likes': 1 });
socialPostSchema.index({ engagementScore: -1 });
socialPostSchema.index({ trendingScore: -1 });
socialPostSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate engagement scores
socialPostSchema.pre('save', function(next) {
  // Calculate engagement score based on interactions
  const likeScore = this.likes.length * 2;
  const commentScore = this.comments.length * 3;
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
    }
  } else {
    // Add new comment
    this.comments.push({
      userId,
      text
    });
  }
  return this.save();
};

// Method to toggle like on post
socialPostSchema.methods.toggleLike = function(userId) {
  const likeIndex = this.likes.indexOf(userId);
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
    const likeIndex = comment.likes.indexOf(userId);
    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(userId);
    }
    return this.save();
  }
  return Promise.reject(new Error('Comment not found'));
};

// Method to share post
socialPostSchema.methods.sharePost = function(userId) {
  this.shares.push({ userId });
  return this.save();
};

// Method to report post
socialPostSchema.methods.reportPost = function(userId, reason, details = '') {
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
};

// Static method to get feed posts with advanced filtering
socialPostSchema.statics.getFeed = function(userId, options = {}) {
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
    isHidden: false
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
  
  return this.find(query)
    .populate('userId', 'firstName lastName profilePicture')
    .populate('comments.userId', 'firstName lastName profilePicture')
    .populate('comments.replies.userId', 'firstName lastName profilePicture')
    .populate('likes', 'firstName lastName profilePicture')
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);
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
  
  let query = { userId };
  
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
    isHidden: false
  })
  .populate('userId', 'firstName lastName profilePicture')
  .sort({ engagementScore: -1 })
  .limit(limit);
};

module.exports = mongoose.model('SocialPost', socialPostSchema);