const UserMeal = require('../models/UserMeal');
const Meal = require('../models/Meal');

// @desc    Add meal to user's diary
// @route   POST /api/user-meals
// @access  Private
const addUserMeal = async (req, res) => {
  try {
    const { mealId, date, mealType, quantity, notes } = req.body;
    const userId = req.userId;

    // Validate required fields
    if (!mealId || !date || !mealType) {
      return res.status(400).json({
        success: false,
        message: 'Meal ID, date, and meal type are required'
      });
    }

    // Check if meal exists
    const meal = await Meal.findById(mealId);
    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }

    // Create user meal entry
    const userMeal = await UserMeal.create({
      userId,
      mealId,
      date: new Date(date),
      mealType,
      quantity: quantity || 1,
      notes,
      calories: meal.calories * (quantity || 1),
      protein: meal.protein * (quantity || 1),
      carbs: meal.carbs * (quantity || 1),
      fats: meal.fats * (quantity || 1)
    });

    // Populate meal details for response
    await userMeal.populate('mealId');

    res.status(201).json({
      success: true,
      message: 'Meal added successfully',
      data: userMeal
    });
  } catch (error) {
    console.error('Add user meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user meals for specific date
// @route   GET /api/user-meals/:date
// @access  Private
const getUserMealsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.userId;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const userMeals = await UserMeal.find({
      userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).populate('mealId').sort({ mealType: 1, createdAt: 1 });

    // Calculate daily totals
    const dailyTotals = userMeals.reduce((totals, meal) => {
      if (meal.consumed) {
        totals.calories += meal.calories;
        totals.protein += meal.protein;
        totals.carbs += meal.carbs;
        totals.fats += meal.fats;
      }
      return totals;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    res.json({
      success: true,
      data: {
        meals: userMeals,
        totals: dailyTotals,
        date: startOfDay.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Get user meals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user meal
// @route   PUT /api/user-meals/:id
// @access  Private
const updateUserMeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, mealType, notes, consumed } = req.body;
    const userId = req.userId;

    const userMeal = await UserMeal.findOne({ _id: id, userId });
    if (!userMeal) {
      return res.status(404).json({
        success: false,
        message: 'Meal entry not found'
      });
    }

    // Update fields
    if (quantity !== undefined) userMeal.quantity = quantity;
    if (mealType !== undefined) userMeal.mealType = mealType;
    if (notes !== undefined) userMeal.notes = notes;
    if (consumed !== undefined) userMeal.consumed = consumed;

    await userMeal.save();
    await userMeal.populate('mealId');

    res.json({
      success: true,
      message: 'Meal updated successfully',
      data: userMeal
    });
  } catch (error) {
    console.error('Update user meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete user meal
// @route   DELETE /api/user-meals/:id
// @access  Private
const deleteUserMeal = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const userMeal = await UserMeal.findOneAndDelete({ _id: id, userId });
    if (!userMeal) {
      return res.status(404).json({
        success: false,
        message: 'Meal entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Meal deleted successfully'
    });
  } catch (error) {
    console.error('Delete user meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user meal history (last 7 days)
// @route   GET /api/user-meals/history/recent
// @access  Private
const getRecentMealHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMeals = await UserMeal.find({
      userId,
      date: { $gte: sevenDaysAgo },
      consumed: true
    })
    .populate('mealId')
    .sort({ date: -1, mealType: 1 })
    .limit(50);

    res.json({
      success: true,
      data: recentMeals
    });
  } catch (error) {
    console.error('Get recent meal history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single user meal by ID
// @route   GET /api/user-meals/single/:id
// @access  Private
const getUserMealById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const userMeal = await UserMeal.findOne({ _id: id, userId }).populate('mealId');
    if (!userMeal) {
      return res.status(404).json({
        success: false,
        message: 'Meal entry not found'
      });
    }

    res.json({
      success: true,
      data: userMeal
    });
  } catch (error) {
    console.error('Get user meal by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  addUserMeal,
  getUserMealsByDate,
  updateUserMeal,
  deleteUserMeal,
  getRecentMealHistory,
  getUserMealById
};
