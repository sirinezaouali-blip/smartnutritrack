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
      totals.fat += meal.fat;
      return totals;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    // Get user targets
    const user = await User.findById(userId);
    const targets = user.onboarding.healthMetrics || {
      dailyCalories: 2000,
      proteinTarget: 150,
      carbsTarget: 250,
      fatsTarget: 67
    };

    // Calculate percentages
    const percentages = {
      calories: Math.round((dailyTotals.calories / targets.dailyCalories) * 100),
      protein: Math.round((dailyTotals.protein / targets.proteinTarget) * 100),
      carbs: Math.round((dailyTotals.carbs / targets.carbsTarget) * 100),
      fat: Math.round((dailyTotals.fat / targets.fatsTarget) * 100)
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
        totals: dailyTotals,
        targets: {
          calories: targets.dailyCalories,
          protein: targets.proteinTarget,
          carbs: targets.carbsTarget,
          fat: targets.fatsTarget
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
        fat: 0,
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
        dailyData[dateKey].fat += meal.fat;
      }
    });

    // Convert to array and calculate weekly totals
    const dailyArray = Object.values(dailyData);
    const weeklyTotals = dailyArray.reduce((totals, day) => {
      totals.calories += day.calories;
      totals.protein += day.protein;
      totals.carbs += day.carbs;
      totals.fat += day.fat;
      return totals;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const weeklyAverage = {
      calories: Math.round(weeklyTotals.calories / 7),
      protein: Math.round(weeklyTotals.protein / 7),
      carbs: Math.round(weeklyTotals.carbs / 7),
      fat: Math.round(weeklyTotals.fat / 7)
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
        totals.fat += meal.fat;
        return totals;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

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
      totals.fat += day.fat;
      return totals;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const monthlyAverage = {
      calories: Math.round(monthlyTotals.calories / daysInMonth),
      protein: Math.round(monthlyTotals.protein / daysInMonth),
      carbs: Math.round(monthlyTotals.carbs / daysInMonth),
      fat: Math.round(monthlyTotals.fat / daysInMonth)
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
      acc.fat += meal.fat;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    // Calculate percentage distribution
    const totalMacroCalories = (totals.protein * 4) + (totals.carbs * 4) + (totals.fat * 9);
    
    const distribution = {
      protein: Math.round((totals.protein * 4) / totalMacroCalories * 100),
      carbs: Math.round((totals.carbs * 4) / totalMacroCalories * 100),
      fat: Math.round((totals.fat * 9) / totalMacroCalories * 100)
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

module.exports = {
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getMacroDistribution
};