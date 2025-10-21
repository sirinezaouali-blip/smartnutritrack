const User = require('../models/User');
const Meal = require('../models/Meal');
const { spawn } = require('child_process');
const path = require('path');

// @desc    Generate daily meal plan
// @route   POST /api/planner/daily
// @access  Private
const generateDailyPlan = async (req, res) => {
  try {
    const { userInput, preferences } = req.body;
    const userId = req.userId;

    if (!userInput) {
      return res.status(400).json({
        success: false,
        message: 'User input is required'
      });
    }

    // Get user data for context
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare data for Python RAG model
    const plannerData = {
      user_input: userInput,
      user_profile: {
        target_calories: user.onboarding.healthMetrics?.dailyCalories || 2000,
        preferences: preferences || user.onboarding.preferences,
        dietary_restrictions: user.onboarding.medical?.allergies || []
      }
    };

    // Call Python RAG model
    const plan = await callRAGModel(plannerData, 'daily');

    res.json({
      success: true,
      message: 'Daily meal plan generated successfully',
      data: plan
    });
  } catch (error) {
    console.error('Generate daily plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating meal plan',
      error: error.message
    });
  }
};

// @desc    Generate multiple meal plans
// @route   POST /api/planner/multiple
// @access  Private
const generateMultiplePlans = async (req, res) => {
  try {
    const { userInput, numberOfPlans = 3 } = req.body;
    const userId = req.userId;

    if (!userInput) {
      return res.status(400).json({
        success: false,
        message: 'User input is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const plannerData = {
      user_input: userInput,
      user_profile: {
        target_calories: user.onboarding.healthMetrics?.dailyCalories || 2000,
        preferences: user.onboarding.preferences,
        dietary_restrictions: user.onboarding.medical?.allergies || []
      },
      number_of_plans: numberOfPlans
    };

    const plans = await callRAGModel(plannerData, 'multiple');

    res.json({
      success: true,
      message: 'Multiple meal plans generated successfully',
      data: plans
    });
  } catch (error) {
    console.error('Generate multiple plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating meal plans',
      error: error.message
    });
  }
};

// @desc    Find similar meals
// @route   POST /api/planner/similar
// @access  Private
const findSimilarMeals = async (req, res) => {
  try {
    const { mealName, targetCalories, mealType, limit = 20 } = req.body;
    const userId = req.userId;

    if (!mealName) {
      return res.status(400).json({
        success: false,
        message: 'Meal name is required'
      });
    }

    const user = await User.findById(userId);
    const userTargetCalories = targetCalories || user.onboarding.healthMetrics?.dailyCalories || 2000;

    // First try to find similar meals in our database
    let similarMeals = await Meal.find({
      name: { $regex: mealName, $options: 'i' },
      ...(mealType && { type: mealType }),
      calories: { $lte: userTargetCalories }
    }).limit(limit);

    // If not enough results, use broader search
    if (similarMeals.length < 5) {
      const keywords = mealName.split(' ').filter(word => word.length > 3);
      const regexPattern = keywords.map(word => `(?=.*${word})`).join('');
      
      similarMeals = await Meal.find({
        name: { $regex: regexPattern, $options: 'i' },
        ...(mealType && { type: mealType }),
        calories: { $lte: userTargetCalories }
      }).limit(limit);
    }

    // If still not enough, get any meals of the same type
    if (similarMeals.length < 3 && mealType) {
      const additionalMeals = await Meal.find({
        type: mealType,
        calories: { $lte: userTargetCalories },
        _id: { $nin: similarMeals.map(m => m._id) }
      }).limit(limit - similarMeals.length);
      
      similarMeals = [...similarMeals, ...additionalMeals];
    }

    res.json({
      success: true,
      message: 'Similar meals found successfully',
      data: {
        originalMeal: mealName,
        targetCalories: userTargetCalories,
        similarMeals,
        count: similarMeals.length
      }
    });
  } catch (error) {
    console.error('Find similar meals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error finding similar meals',
      error: error.message
    });
  }
};

// @desc    Get meal suggestions based on nutrition goals
// @route   POST /api/planner/suggestions
// @access  Private
const getMealSuggestions = async (req, res) => {
  try {
    const { mealType, maxCalories, preferences } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    const userMaxCalories = maxCalories || 
      (user.onboarding.healthMetrics?.dailyCalories || 2000) * getMealPercentage(mealType);

    // Build query based on preferences
    let query = {
      type: mealType,
      calories: { $lte: userMaxCalories }
    };

    // Add dietary preferences if provided
    if (preferences?.dietType) {
      query.dietType = { $in: [preferences.dietType] };
    }

    if (preferences?.dislikedFoods && preferences.dislikedFoods.length > 0) {
      query.name = { $not: { $in: preferences.dislikedFoods.map(food => new RegExp(food, 'i')) } };
    }

    const suggestions = await Meal.find(query)
      .limit(15)
      .sort({ calories: -1 }); // Show higher calorie options first

    res.json({
      success: true,
      message: 'Meal suggestions generated successfully',
      data: {
        mealType,
        maxCalories: userMaxCalories,
        suggestions,
        count: suggestions.length
      }
    });
  } catch (error) {
    console.error('Get meal suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting meal suggestions',
      error: error.message
    });
  }
};

// Helper function to call Python RAG model
const callRAGModel = (data, planType) => {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'ai-backend',
      'main.py'
    );

    const pythonProcess = spawn('python', [pythonScriptPath, JSON.stringify(data)]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python process error:', error);
        reject(new Error(`Python process exited with code ${code}: ${error}`));
        return;
      }

      try {
        const parsedResult = JSON.parse(result);
        resolve(parsedResult);
      } catch (parseError) {
        console.error('Error parsing Python output:', parseError);
        // If JSON parsing fails, return the raw result
        resolve({ raw_output: result });
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      reject(new Error('Python process failed to start'));
    });
  });
};

// Helper function to get calorie percentage by meal type
const getMealPercentage = (mealType) => {
  const percentages = {
    breakfast: 0.25,    // 25%
    lunch: 0.35,        // 35%
    dinner: 0.35,       // 35%
    snack: 0.05         // 5%
  };
  return percentages[mealType] || 0.25;
};

// @desc    Single meal planner - Suggest meals based on user input using RAG
// @route   POST /api/planner/single-meal
// @access  Private
const singleMealPlanner = async (req, res) => {
  try {
    const { userInput, mealType, targetCalories, userProfile } = req.body;
    const userId = req.userId;

    if (!userInput) {
      return res.status(400).json({
        success: false,
        message: 'User input is required'
      });
    }

    const user = await User.findById(userId);
    const userTargetCalories = targetCalories ||
      (user.onboarding.healthMetrics?.dailyCalories || 2000) * getMealPercentage(mealType);

    // Prepare data for RAG model
    const ragData = {
      user_input: userInput,
      user_profile: {
        target_calories: userTargetCalories,
        preferences: userProfile?.preferences || user.onboarding.preferences || {},
        allergies: userProfile?.allergies || user.onboarding.medical?.allergies || [],
        disliked_foods: userProfile?.dislikedFoods || user.onboarding.preferences?.dislikedFoods || []
      },
      meal_type: mealType,
      plan_type: 'single_meal'
    };

    let suggestions;
    try {
      // Try to call the RAG model
      suggestions = await callRAGModel(ragData, 'single_meal');
    } catch (ragError) {
      console.warn('RAG model unavailable, using fallback:', ragError.message);
      // Fallback to database-based suggestions
      suggestions = await generateSingleMealFallback(ragData);
    }

    res.json({
      success: true,
      message: 'Single meal suggestions generated successfully',
      data: {
        userInput,
        mealType,
        targetCalories: userTargetCalories,
        suggestions: suggestions.suggestions || suggestions,
        count: suggestions.suggestions?.length || suggestions.length || 0
      }
    });
  } catch (error) {
    console.error('Single meal planner error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating single meal suggestions',
      error: error.message
    });
  }
};

// @desc    Multiple meal planner - Suggest 3 different full-day plans
// @route   POST /api/planner/multi-meal
// @access  Private
const multiMealPlanner = async (req, res) => {
  try {
    const { preferences, excludeMeals = [] } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    const dailyCalories = user.onboarding.healthMetrics?.dailyCalories || 2000;

    // Generate 3 different meal plans
    const mealPlans = await generateMultipleMealPlans(dailyCalories, preferences, excludeMeals);

    res.json({
      success: true,
      message: 'Multiple meal plans generated successfully',
      data: {
        dailyCalories,
        plans: mealPlans,
        count: mealPlans.length
      }
    });
  } catch (error) {
    console.error('Multi meal planner error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating multiple meal plans',
      error: error.message
    });
  }
};

// @desc    Smart meal planner with RAG integration
// @route   POST /api/planner/smart
// @access  Private
const smartMealPlanner = async (req, res) => {
  try {
    const { userInput, planType = 'daily' } = req.body; // daily, weekly, specific
    const userId = req.userId;

    if (!userInput) {
      return res.status(400).json({
        success: false,
        message: 'User input is required for smart planning'
      });
    }

    const user = await User.findById(userId);
    
    // Prepare data for RAG model
    const ragData = {
      user_input: userInput,
      user_profile: {
        target_calories: user.onboarding.healthMetrics?.dailyCalories || 2000,
        preferences: user.onboarding.preferences,
        dietary_restrictions: user.onboarding.medical?.allergies || [],
        goals: user.onboarding.basicInfo?.goal
      },
      plan_type: planType
    };

    let plan;
    try {
      // Try to call the RAG model
      plan = await callRAGModel(ragData, planType);
    } catch (ragError) {
      console.warn('RAG model unavailable, using fallback:', ragError.message);
      // Fallback to database-based planning
      plan = await generateFallbackPlan(ragData);
    }

    res.json({
      success: true,
      message: 'Smart meal plan generated successfully',
      data: plan,
      source: plan.source || 'rag_model'
    });
  } catch (error) {
    console.error('Smart meal planner error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating smart meal plan',
      error: error.message
    });
  }
};

// Helper function to generate multiple meal plans
const generateMultipleMealPlans = async (dailyCalories, preferences, excludeMeals) => {
  const plans = [];
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const calorieDistribution = {
    breakfast: 0.25,
    lunch: 0.35,
    dinner: 0.35,
    snack: 0.05
  };

  for (let i = 0; i < 3; i++) {
    const plan = {
      name: `Plan ${i + 1}`,
      description: getPlanDescription(i),
      totalCalories: 0,
      meals: {}
    };

    for (const mealType of mealTypes) {
      const targetCalories = dailyCalories * calorieDistribution[mealType];
      const meals = await Meal.find({
        type: mealType,
        calories: { 
          $gte: targetCalories * 0.8, 
          $lte: targetCalories * 1.2 
        },
        ...(preferences?.dietType && { dietType: { $in: [preferences.dietType] } }),
        name: { $nin: excludeMeals }
      }).limit(3);

      if (meals.length > 0) {
        const selectedMeal = meals[Math.floor(Math.random() * meals.length)];
        plan.meals[mealType] = selectedMeal;
        plan.totalCalories += selectedMeal.calories;
      }
    }

    plans.push(plan);
  }

  return plans;
};

// Helper function for fallback planning
const generateFallbackPlan = async (ragData) => {
  const { user_profile, plan_type } = ragData;
  const dailyCalories = user_profile.target_calories;

  // Simple fallback logic based on user preferences
  const mealTypes = ['breakfast', 'lunch', 'dinner'];
  const plan = {
    source: 'fallback',
    plan_type,
    total_calories: 0,
    meals: {}
  };

  for (const mealType of mealTypes) {
    const targetCalories = dailyCalories * getMealPercentage(mealType);
    
    let query = {
      type: mealType,
      calories: { $gte: targetCalories * 0.7, $lte: targetCalories * 1.3 }
    };

    // Apply dietary preferences if available
    if (user_profile.dietary_restrictions?.length > 0) {
      query.ingredients = { 
        $not: { $in: user_profile.dietary_restrictions.map(a => new RegExp(a, 'i')) }
      };
    }

    if (user_profile.preferences?.dietType) {
      query.dietType = { $in: [user_profile.preferences.dietType] };
    }

    const meals = await Meal.find(query).limit(5);
    
    if (meals.length > 0) {
      const selectedMeal = meals[Math.floor(Math.random() * meals.length)];
      plan.meals[mealType] = selectedMeal;
      plan.total_calories += selectedMeal.calories;
    }
  }

  return plan;
};

// Helper function for single meal fallback
const generateSingleMealFallback = async (ragData) => {
  const { user_input, user_profile, meal_type } = ragData;
  const targetCalories = user_profile.target_calories;

  // Parse user input to extract keywords
  const keywords = user_input.toLowerCase().split(' ').filter(word => word.length > 3);

  let query = {
    calories: { $gte: targetCalories * 0.7, $lte: targetCalories * 1.3 }
  };

  // Add meal type if specified
  if (meal_type) {
    query.type = meal_type;
  }

  // Apply dietary restrictions
  if (user_profile.allergies?.length > 0) {
    query.ingredients = {
      $not: { $in: user_profile.allergies.map(a => new RegExp(a, 'i')) }
    };
  }

  // Apply disliked foods
  if (user_profile.disliked_foods?.length > 0) {
    query.name = {
      $not: { $in: user_profile.disliked_foods.map(food => new RegExp(food, 'i')) }
    };
  }

  // Apply diet type preferences
  if (user_profile.preferences?.dietType) {
    query.dietType = { $in: [user_profile.preferences.dietType] };
  }

  // Search for meals matching keywords
  let suggestions = [];
  if (keywords.length > 0) {
    const regexPattern = keywords.map(word => `(?=.*${word})`).join('');
    suggestions = await Meal.find({
      ...query,
      name: { $regex: regexPattern, $options: 'i' }
    }).limit(20);
  }

  // If not enough results, get general meals
  if (suggestions.length < 10) {
    const additionalMeals = await Meal.find({
      ...query,
      _id: { $nin: suggestions.map(m => m._id) }
    }).limit(20 - suggestions.length);

    suggestions = [...suggestions, ...additionalMeals];
  }

  return {
    suggestions: suggestions.map(meal => ({
      _id: meal._id,
      name: meal.name,
      description: meal.description || `${meal.name} - ${meal.calories} calories`,
      calories: meal.calories,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fat: meal.fat || 0,
      ingredients: meal.ingredients || [],
      price: meal.price || (meal.calories * 0.02).toFixed(2), // Simple pricing
      imageUrl: meal.imageUrl
    })),
    source: 'fallback'
  };
};

// Helper function to get plan description
const getPlanDescription = (index) => {
  const descriptions = [
    'Balanced mix of protein and carbs for sustained energy',
    'High-protein focus for muscle maintenance and growth',
    'Light and nutritious with emphasis on vegetables and lean proteins'
  ];
  return descriptions[index] || 'Customized meal plan based on your preferences';
};

module.exports = {
  generateDailyPlan,
  generateMultiplePlans,
  findSimilarMeals,
  getMealSuggestions,
  singleMealPlanner,
  multiMealPlanner,
  smartMealPlanner
};
