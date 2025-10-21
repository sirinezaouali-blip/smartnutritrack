const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  countryCode: {
    type: String,
    default: '+1'
  },

  // Account Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: String,
  verificationCodeExpires: Date,
  verificationMethod: {
    type: String,
    enum: ['email', 'sms'],
    default: 'email'
  },

  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  // User Preferences
  preferences: {
    language: {
      type: String,
      enum: ['EN', 'FR', 'AR', 'DE', 'IT'],
      default: 'EN'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  },

  // Onboarding Data
  onboarding: {
    completed: {
      type: Boolean,
      default: false
    },
    currentStep: {
      type: Number,
      default: 0
    },
    basicInfo: {
      age: Number,
      height: Number, // in cm
      weight: Number, // in kg
      gender: {
        type: String,
        enum: ['male', 'female', 'other']
      },
      goal: {
        type: String,
        enum: ['maintain', 'gain_muscle', 'lose_weight']
      }
    },
    medical: {
      conditions: [String],
      allergies: [String],
      hasNone: Boolean
    },
    preferences: {
      dietType: {
        type: String,
        enum: ['vegetarian', 'vegan', 'gluten-free', 'keto', 'paleo', 'mediterranean', 'none']
      },
      dislikedFoods: [String],
      favoriteCuisine: [String]
    },
    lifestyle: {
      activityLevel: {
        type: String,
        enum: ['sedentary', 'light', 'moderate', 'active', 'very_active']
      },
      sports: [String],
      budget: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    },
    healthMetrics: {
      bmi: Number,
      bmr: Number,
      tdee: Number,
      dailyCalories: Number,
      proteinTarget: Number,
      carbsTarget: Number,
      fatsTarget: Number
    }
  },

  // Social Features
  social: {
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    profilePicture: String,
    bio: {
      type: String,
      maxlength: 500
    },
    location: String,
    website: String,
    isPrivate: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const { calculateHealthMetrics } = require('../utils/healthCalculations');

userSchema.methods.calculateHealthMetrics = function() {
  const { age, height, weight, gender, goal } = this.onboarding.basicInfo;
  const { activityLevel } = this.onboarding.lifestyle;

  // Use the SAME function as frontend
  return calculateHealthMetrics({
    weight,
    height,
    age,
    gender,
    goal,
    activityLevel
  });
};

module.exports = mongoose.model('User', userSchema);
