const UserMeal = require('../models/UserMeal');
const User = require('../models/User');

// @desc    Get daily nutrition summary
// @route   GET /api/analytics/daily/:date
// @access  Private
const getDailyAnalytics = async (req, res) => {
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

    // Get user meals for the day
    const userMeals = await UserMeal.find({
      userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      consumed: true
    }).populate('mealId');

    // Calculate daily totals
    const dailyTotals = userMeals.reduce((totals, meal) => {
      totals.calories += meal.calories;
      totals.protein += meal.protein;
      totals.carbs += meal.carbs;
      totals.fats += meal.fats;
      return totals;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    // Get user targetsdailyCalories: healthMetrics.dailyCalories || 2000,
        // Get user targets - NO STATIC DATA
    const user = await User.findById(userId);
    console.log('🔍 FULL USER DATA:', JSON.stringify(user.onboarding, null, 2));

    const healthMetrics = user.onboarding.healthMetrics || {};

    console.log('🔍 HEALTH METRICS:', JSON.stringify(healthMetrics, null, 2));

    console.log('🔍 USER HEALTH METRICS:', healthMetrics);
    console.log('🔍 FAT TARGET VALUE:', healthMetrics.fatsTarget);
    
    const targets = {
      dailyCalories: healthMetrics.dailyCalories,
      proteinTarget: healthMetrics.proteinTarget,
      carbsTarget: healthMetrics.carbsTarget,
      fatsTarget: healthMetrics.fatsTarget
    };

    console.log('🔍 TARGETS BEING SENT:', JSON.stringify(targets, null, 2));

    // Calculate percentages
    const percentages = {
      calories: Math.round((dailyTotals.calories / targets.dailyCalories) * 100),
      protein: Math.round((dailyTotals.protein / targets.proteinTarget) * 100),
      carbs: Math.round((dailyTotals.carbs / targets.carbsTarget) * 100),
      fats: Math.round((dailyTotals.fats / targets.fatsTarget) * 100)
    };

    // Group by meal type
    const mealsByType = userMeals.reduce((acc, meal) => {
      if (!acc[meal.mealType]) {
        acc[meal.mealType] = [];
      }
      acc[meal.mealType].push(meal);
      return acc;
    }, {});

        res.json({
          success: true,
          data: {
            date: startOfDay.toISOString().split('T')[0],
            totals: {
              calories: dailyTotals.calories,
              protein: dailyTotals.protein,
              carbs: dailyTotals.carbs,
              fats: dailyTotals.fats  
            },
            targets: {
              calories: targets.dailyCalories,
              protein: targets.proteinTarget,
              carbs: targets.carbsTarget,
              fats: targets.fatsTarget || Math.round((0.25 * targets.dailyCalories) / 9)
            },
            percentages,
            mealsByType,
            mealCount: userMeals.length
          }
        });
  } catch (error) {
    console.error('Get daily analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get weekly progress
// @route   GET /api/analytics/weekly
// @access  Private
const getWeeklyAnalytics = async (req, res) => {
  try {
    const userId = req.userId;
    const { startDate } = req.query;

    let startDateObj;
    if (startDate) {
      startDateObj = new Date(startDate);
    } else {
      // Default to start of current week (Monday)
      startDateObj = new Date();
      startDateObj.setDate(startDateObj.getDate() - startDateObj.getDay() + 1); // Monday
    }

    startDateObj.setHours(0, 0, 0, 0);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + 6); // Sunday
    endDateObj.setHours(23, 59, 59, 999);

    // Get user targets
    const user = await User.findById(userId);
    const dailyTarget = user.onboarding.healthMetrics?.dailyCalories || 2000;

    // Get meals for the week
    const weeklyMeals = await UserMeal.find({
      userId,
      date: {
        $gte: startDateObj,
        $lte: endDateObj
      },
      consumed: true
    });

    // Group by day and calculate daily totals
    const dailyData = {};
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDateObj);
      currentDate.setDate(startDateObj.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];
      
      dailyData[dateKey] = {
        date: dateKey,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        target: dailyTarget
      };
    }

    // Calculate daily totals
    weeklyMeals.forEach(meal => {
      const dateKey = meal.date.toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].calories += meal.calories;
        dailyData[dateKey].protein += meal.protein;
        dailyData[dateKey].carbs += meal.carbs;
        dailyData[dateKey].fats += meal.fats;
      }
    });

    // Convert to array and calculate weekly totals
    const dailyArray = Object.values(dailyData);
    const weeklyTotals = dailyArray.reduce((totals, day) => {
      totals.calories += day.calories;
      totals.protein += day.protein;
      totals.carbs += day.carbs;
      totals.fats += day.fats;
      return totals;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    const weeklyAverage = {
      calories: Math.round(weeklyTotals.calories / 7),
      protein: Math.round(weeklyTotals.protein / 7),
      carbs: Math.round(weeklyTotals.carbs / 7),
      fats: Math.round(weeklyTotals.fats / 7)
    };

    res.json({
      success: true,
      data: {
        period: {
          start: startDateObj.toISOString().split('T')[0],
          end: endDateObj.toISOString().split('T')[0]
        },
        dailyData: dailyArray,
        weeklyTotals,
        weeklyAverage,
        target: dailyTarget * 7
      }
    });
  } catch (error) {
    console.error('Get weekly analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get monthly trends
// @route   GET /api/analytics/monthly
// @access  Private
const getMonthlyAnalytics = async (req, res) => {
  try {
    const userId = req.userId;
    const { year, month } = req.query;

    const targetYear = parseInt(year) || new Date().getFullYear();
    const targetMonth = parseInt(month) || new Date().getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    // Get user targets
    const user = await User.findById(userId);
    const dailyTarget = user.onboarding.healthMetrics?.dailyCalories || 2000;

    // Get meals for the month
    const monthlyMeals = await UserMeal.find({
      userId,
      date: {
        $gte: startDate,
        $lte: endDate
      },
      consumed: true
    });

    // Calculate daily totals for the month
    const daysInMonth = endDate.getDate();
    const monthlyData = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(targetYear, targetMonth - 1, day);
      const dateKey = currentDate.toISOString().split('T')[0];
      
      const dayMeals = monthlyMeals.filter(meal => 
        meal.date.toISOString().split('T')[0] === dateKey
      );

      const dayTotals = dayMeals.reduce((totals, meal) => {
        totals.calories += meal.calories;
        totals.protein += meal.protein;
        totals.carbs += meal.carbs;
        totals.fats += meal.fats;
        return totals;
      }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

      monthlyData.push({
        date: dateKey,
        day: day,
        ...dayTotals,
        target: dailyTarget
      });
    }

    // Calculate monthly totals and averages
    const monthlyTotals = monthlyData.reduce((totals, day) => {
      totals.calories += day.calories;
      totals.protein += day.protein;
      totals.carbs += day.carbs;
      totals.fats += day.fats;
      return totals;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    const monthlyAverage = {
      calories: Math.round(monthlyTotals.calories / daysInMonth),
      protein: Math.round(monthlyTotals.protein / daysInMonth),
      carbs: Math.round(monthlyTotals.carbs / daysInMonth),
      fats: Math.round(monthlyTotals.fats / daysInMonth)
    };

    // Most consumed meals
    const mealCount = {};
    monthlyMeals.forEach(meal => {
      const mealName = meal.mealId?.name || 'Unknown Meal';
      mealCount[mealName] = (mealCount[mealName] || 0) + 1;
    });

    const topMeals = Object.entries(mealCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.json({
      success: true,
      data: {
        period: {
          year: targetYear,
          month: targetMonth,
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        monthlyData,
        monthlyTotals,
        monthlyAverage,
        target: dailyTarget * daysInMonth,
        topMeals,
        daysTracked: monthlyData.filter(day => day.calories > 0).length
      }
    });
  } catch (error) {
    console.error('Get monthly analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get macronutrient distribution
// @route   GET /api/analytics/macros
// @access  Private
const getMacroDistribution = async (req, res) => {
  try {
    const userId = req.userId;
    const { period = 'week' } = req.query; // week, month

    let startDate, endDate;
    const now = new Date();

    if (period === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const meals = await UserMeal.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
      consumed: true
    });

    const totals = meals.reduce((acc, meal) => {
      acc.calories += meal.calories;
      acc.protein += meal.protein;
      acc.carbs += meal.carbs;
      acc.fats += meal.fats;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    // Calculate percentage distribution
    const totalMacroCalories = (totals.protein * 4) + (totals.carbs * 4) + (totals.fats * 9);
    
    const distribution = {
      protein: Math.round((totals.protein * 4) / totalMacroCalories * 100),
      carbs: Math.round((totals.carbs * 4) / totalMacroCalories * 100),
      fats: Math.round((totals.fats * 9) / totalMacroCalories * 100)
    };

    res.json({
      success: true,
      data: {
        period,
        totals,
        distribution,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Get macro distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get detailed analytics with all metrics
// @route   GET /api/analytics/detailed
// @access  Private
const getDetailedAnalytics = async (req, res) => {
  try {
    const userId = req.userId;
    const { timeframe = 'week' } = req.query;

    // Get user data
    const user = await User.findById(userId);
    const healthMetrics = user.onboarding.healthMetrics || {};
    
    const targets = {
      calories: healthMetrics.dailyCalories || 2000,
      protein: healthMetrics.proteinTarget || 150,
      carbs: healthMetrics.carbsTarget || 250,
      fats: healthMetrics.fatsTarget || 67
    };

    // Calculate date range based on timeframe
    let startDate, endDate;
    const now = new Date();
    
    if (timeframe === 'today') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
    } else if (timeframe === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
    } else if (timeframe === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date();
    }

    // Get meals for the period
    const meals = await UserMeal.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
      consumed: true
    }).populate('mealId');

    // Calculate totals
    const totals = meals.reduce((acc, meal) => {
      acc.calories += meal.calories;
      acc.protein += meal.protein;
      acc.carbs += meal.carbs;
      acc.fats += meal.fats;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    // Calculate averages based on timeframe
    let daysInPeriod = 1;
    if (timeframe === 'week') daysInPeriod = 7;
    if (timeframe === 'month') daysInPeriod = 30;

    const averages = {
      calories: Math.round(totals.calories / daysInPeriod),
      protein: Math.round(totals.protein / daysInPeriod),
      carbs: Math.round(totals.carbs / daysInPeriod),
      fats: Math.round(totals.fats / daysInPeriod)
    };

    // Calculate percentages
    const percentages = {
      calories: Math.round((totals.calories / (targets.calories * daysInPeriod)) * 100),
      protein: Math.round((totals.protein / (targets.protein * daysInPeriod)) * 100),
      carbs: Math.round((totals.carbs / (targets.carbs * daysInPeriod)) * 100),
      fats: Math.round((totals.fats / (targets.fats * daysInPeriod)) * 100)
    };

    // Macronutrient distribution
    const totalMacroCalories = (totals.protein * 4) + (totals.carbs * 4) + (totals.fats * 9);
    const macroDistribution = {
      protein: Math.round((totals.protein * 4) / totalMacroCalories * 100),
      carbs: Math.round((totals.carbs * 4) / totalMacroCalories * 100),
      fats: Math.round((totals.fats * 9) / totalMacroCalories * 100)
    };

    // Meal type distribution
    const mealTypeDistribution = meals.reduce((acc, meal) => {
      const type = meal.mealType || 'other';
      if (!acc[type]) {
        acc[type] = { calories: 0, count: 0 };
      }
      acc[type].calories += meal.calories;
      acc[type].count += 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        timeframe,
        totals,
        averages,
        targets,
        percentages,
        macroDistribution,
        mealTypeDistribution,
        mealCount: meals.length,
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }
      }
    });
  } catch (error) {
    console.error('Get detailed analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get macronutrient details
// @route   GET /api/analytics/macronutrient-details
// @access  Private
const getMacronutrientDetails = async (req, res) => {
  try {
    const userId = req.userId;
    const { timeframe = 'week' } = req.query;

    // Similar date range calculation as above
    let startDate, endDate;
    const now = new Date();
    
    if (timeframe === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
    } else if (timeframe === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date();
    }

    const meals = await UserMeal.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
      consumed: true
    });

    // Calculate daily macronutrient breakdown
    const dailyMacros = {};
    meals.forEach(meal => {
      const date = meal.date.toISOString().split('T')[0];
      if (!dailyMacros[date]) {
        dailyMacros[date] = { protein: 0, carbs: 0, fats: 0, calories: 0 };
      }
      dailyMacros[date].protein += meal.protein;
      dailyMacros[date].carbs += meal.carbs;
      dailyMacros[date].fats += meal.fats;
      dailyMacros[date].calories += meal.calories;
    });

    // Convert to array for chart data
    const dailyMacroData = Object.entries(dailyMacros).map(([date, macros]) => ({
      date,
      ...macros
    }));

    res.json({
      success: true,
      data: {
        dailyMacroData,
        timeframe
      }
    });
  } catch (error) {
    console.error('Get macronutrient details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Add these to your exports
module.exports = {
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getMacroDistribution,
  getDetailedAnalytics,
  getMacronutrientDetails
};