const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Meal name is required'],
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true
  },
  
  // Nutritional Information
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
  
  // Additional Details
  ingredients: [String],
  cuisine: {
    type: String,
    trim: true
  },
  dietType: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'gluten-free', 'keto', 'paleo', 'mediterranean', 'dairy-free', 'nut-free']
  }],
  
  // Identification
  barcode: {
    type: String,
    sparse: true
  },
  externalId: {
    type: String,
    sparse: true
  },
  
  // Media
  imageUrl: String,
  
  // Metadata
  isCustom: {
    type: Boolean,
    default: false
  },
  source: {
    type: String,
    default: 'database'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better search performance
mealSchema.index({ name: 'text', ingredients: 'text' });
mealSchema.index({ type: 1, calories: 1 });
mealSchema.index({ dietType: 1 });

module.exports = mongoose.model('Meal', mealSchema);