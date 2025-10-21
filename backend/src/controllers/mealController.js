const Meal = require('../models/Meal');

// @desc    Create a new meal
// @route   POST /api/meals
// @access  Private
const createMeal = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      calories,
      protein,
      carbs,
      fats,
      ingredients,
      servingSize,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !type || !calories) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, and calories are required'
      });
    }

    // Create the meal
    const meal = await Meal.create({
      name,
      description,
      type,
      calories: parseInt(calories),
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fats) || 0,
      ingredients: ingredients || [],
      isCustom: true,
      createdBy: req.userId
    });

    res.status(201).json({
      success: true,
      message: 'Meal created successfully',
      data: meal
    });
  } catch (error) {
    console.error('Create meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all meals
// @route   GET /api/meals
// @access  Public
const getMeals = async (req, res) => {
  try {
    const meals = await Meal.find().limit(10);

    res.json({
      success: true,
      count: meals.length,
      data: meals
    });
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single meal by ID
// @route   GET /api/meals/:id
// @access  Public
const getMealById = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    
    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }

    res.json({
      success: true,
      data: meal
    });
  } catch (error) {
    console.error('Get meal by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Search meals by name
// @route   GET /api/meals/search
// @access  Public
const searchMeals = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const meals = await Meal.find({
      name: { $regex: q, $options: 'i' }
    }).limit(20);

    res.json({
      success: true,
      count: meals.length,
      data: meals
    });
  } catch (error) {
    console.error('Search meals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update a meal
// @route   PUT /api/meals/:id
// @access  Private
const updateMeal = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      calories,
      protein,
      carbs,
      fats,
      ingredients,
      servingSize
    } = req.body;

    // Find meal and check ownership
    const meal = await Meal.findById(req.params.id);
    
    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }

    // Check if user owns the meal (for custom meals)
    if (meal.isCustom && meal.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this meal'
      });
    }

    // Update meal
    const updatedMeal = await Meal.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        type,
        calories: parseInt(calories),
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fats) || 0,
        ingredients: ingredients || []
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Meal updated successfully',
      data: updatedMeal
    });
  } catch (error) {
    console.error('Update meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete a meal
// @route   DELETE /api/meals/:id
// @access  Private
const deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    
    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }

    // Check if user owns the meal (for custom meals)
    if (meal.isCustom && meal.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this meal'
      });
    }

    await Meal.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Meal deleted successfully'
    });
  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  createMeal,
  getMeals,
  getMealById,
  searchMeals,
  updateMeal,
  deleteMeal
};