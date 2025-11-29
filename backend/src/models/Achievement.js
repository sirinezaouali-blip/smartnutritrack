const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      'nutrition',
      'fitness',
      'consistency',
      'community',
      'milestone',
      'expertise'
    ],
    required: true
  },
  type: {
    type: String,
    enum: ['one_time', 'progressive', 'tiered'],
    default: 'one_time'
  },
  requirement: {
    type: {
      type: String,
      required: true
    },
    target: {
      type: Number,
      required: true
    },
    metric: String // e.g., 'posts', 'likes', 'streak_days'
  },
  points: {
    type: Number,
    default: 10
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tier: {
    type: Number,
    default: 1
  },
  nextTier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement'
  }
}, {
  timestamps: true
});

// Predefined achievements
achievementSchema.statics.getDefaultAchievements = function() {
  return [
    {
      name: 'First Post',
      description: 'Share your first post with the community',
      icon: '📝',
      category: 'community',
      type: 'one_time',
      requirement: { type: 'post_count', target: 1, metric: 'posts' },
      points: 10,
      rarity: 'common'
    },
    {
      name: 'Social Butterfly',
      description: 'Reach 10 followers',
      icon: '🦋',
      category: 'community',
      type: 'one_time',
      requirement: { type: 'follower_count', target: 10, metric: 'followers' },
      points: 20,
      rarity: 'common'
    },
    {
      name: 'Meal Prep Master',
      description: 'Share 25 meal posts',
      icon: '🍽️',
      category: 'nutrition',
      type: 'progressive',
      requirement: { type: 'meal_posts', target: 25, metric: 'meal_posts' },
      points: 50,
      rarity: 'rare'
    },
    {
      name: 'Fitness Fanatic',
      description: 'Share 15 workout posts',
      icon: '💪',
      category: 'fitness',
      type: 'progressive',
      requirement: { type: 'workout_posts', target: 15, metric: 'workout_posts' },
      points: 40,
      rarity: 'rare'
    },
    {
      name: 'Consistency King',
      description: 'Maintain a 7-day posting streak',
      icon: '🔥',
      category: 'consistency',
      type: 'one_time',
      requirement: { type: 'streak', target: 7, metric: 'streak_days' },
      points: 30,
      rarity: 'epic'
    },
    {
      name: 'Helpful Helper',
      description: 'Receive 50 likes on your posts',
      icon: '❤️',
      category: 'community',
      type: 'progressive',
      requirement: { type: 'total_likes', target: 50, metric: 'likes' },
      points: 25,
      rarity: 'common'
    },
    {
      name: 'Nutrition Expert',
      description: 'Share 10 nutrition tips',
      icon: '🧠',
      category: 'expertise',
      type: 'progressive',
      requirement: { type: 'tip_posts', target: 10, metric: 'tip_posts' },
      points: 35,
      rarity: 'rare'
    },
    {
      name: 'Goal Crusher',
      description: 'Share 5 achievement posts',
      icon: '🏆',
      category: 'milestone',
      type: 'progressive',
      requirement: { type: 'achievement_posts', target: 5, metric: 'achievement_posts' },
      points: 45,
      rarity: 'epic'
    }
  ];
};

// Method to check and award achievements
achievementSchema.statics.checkAchievements = async function(userId, action) {
  const User = require('./User');
  const user = await User.findById(userId);
  
  if (!user) return [];

  const achievements = await this.find({ isActive: true });
  const unlockedAchievements = [];

  for (const achievement of achievements) {
    const hasAchievement = user.achievements.badges.some(
      badge => badge.badgeId.toString() === achievement._id.toString()
    );

    if (!hasAchievement) {
      const progress = await calculateProgress(user, achievement, action);
      
      if (progress >= 100) {
        // Award achievement
        user.achievements.badges.push({
          badgeId: achievement._id,
          progress: 100,
          isUnlocked: true
        });
        
        user.achievements.points += achievement.points;
        unlockedAchievements.push(achievement);
      }
    }
  }

  if (unlockedAchievements.length > 0) {
    await user.save();
  }

  return unlockedAchievements;
};

// Helper function to calculate achievement progress
async function calculateProgress(user, achievement, action) {
  const SocialPost = require('./SocialPost');
  
  switch (achievement.requirement.type) {
    case 'post_count':
      return (user.stats.postsCount / achievement.requirement.target) * 100;
    
    case 'follower_count':
      return (user.stats.followersCount / achievement.requirement.target) * 100;
    
    case 'meal_posts':
      const mealPosts = await SocialPost.countDocuments({
        userId: user._id,
        type: 'meal_share'
      });
      return (mealPosts / achievement.requirement.target) * 100;
    
    case 'workout_posts':
      const workoutPosts = await SocialPost.countDocuments({
        userId: user._id,
        type: 'workout'
      });
      return (workoutPosts / achievement.requirement.target) * 100;
    
    case 'streak':
      return (user.stats.streak / achievement.requirement.target) * 100;
    
    case 'total_likes':
      return (user.stats.totalLikes / achievement.requirement.target) * 100;
    
    case 'tip_posts':
      const tipPosts = await SocialPost.countDocuments({
        userId: user._id,
        type: 'tip'
      });
      return (tipPosts / achievement.requirement.target) * 100;
    
    case 'achievement_posts':
      const achievementPosts = await SocialPost.countDocuments({
        userId: user._id,
        type: 'achievement'
      });
      return (achievementPosts / achievement.requirement.target) * 100;
    
    default:
      return 0;
  }
}

module.exports = mongoose.model('Achievement', achievementSchema);