const mongoose = require('mongoose');

const userMealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meal',
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 0.1
  },
  consumed: {
    type: Boolean,
    default: true
  },
  // Cached nutritional values for performance
  calories: {
    type: Number,
    required: true,
    min: 0
  },
  protein: {
    type: Number,
    required: true,
    min: 0
  },
  carbs: {
    type: Number,
    required: true,
    min: 0
  },
  fats: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
userMealSchema.index({ userId: 1, date: 1 });
userMealSchema.index({ userId: 1, mealType: 1 });

// Pre-save middleware to calculate nutritional values based on quantity
userMealSchema.pre('save', async function(next) {
  if (this.isModified('quantity') || !this.calories) {
    try {
      const Meal = mongoose.model('Meal');
      const meal = await Meal.findById(this.mealId);
      
      if (meal) {
        this.calories = Math.round(meal.calories * this.quantity);
        this.protein = Math.round(meal.protein * this.quantity * 10) / 10;
        this.carbs = Math.round(meal.carbs * this.quantity * 10) / 10;
        this.fats = Math.round(meal.fat * this.quantity * 10) / 10;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('UserMeal', userMealSchema);