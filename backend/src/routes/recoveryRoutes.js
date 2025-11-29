const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const User = require('../models/User');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Import the ScientificRecoveryEngine
const { ScientificRecoveryEngine } = require('../../../frontend/src/utils/scientificRecoveryEngine');

// Initialize recovery engine
const recoveryEngine = new ScientificRecoveryEngine();

// @desc    Assess recovery needs based on current consumption
// @route   POST /api/recovery/assess
// @access  Private
const assessRecovery = async (req, res) => {
  try {
    const { currentMeal, consumptionData } = req.body;
    const userId = req.userId;

    if (!currentMeal || !consumptionData) {
      return res.status(400).json({
        success: false,
        message: 'Current meal and consumption data are required'
      });
    }

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Extract user profile data for recovery engine
    const userData = {
      weight: user.onboarding?.healthMetrics?.weight || 70,
      height: user.onboarding?.healthMetrics?.height || 170,
      age: user.onboarding?.basicInfo?.age || 25,
      gender: user.onboarding?.basicInfo?.gender || 'male',
      activityLevel: user.onboarding?.lifestyle?.activityLevel || 'moderate'
    };

    // Assess recovery needs using the scientific engine
    const recoveryAssessment = recoveryEngine.assessRecoveryNeed(
      userData,
      currentMeal,
      consumptionData
    );

    res.json({
      success: true,
      message: 'Recovery assessment completed successfully',
      data: recoveryAssessment
    });
  } catch (error) {
    console.error('Recovery assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error assessing recovery needs',
      error: error.message
    });
  }
};

// @desc    Generate multi-day recovery plan
// @route   POST /api/recovery/multi-day-plan
// @access  Private
const generateMultiDayPlan = async (req, res) => {
  try {
    const { totalExcess, remainingDays = 3 } = req.body;
    const userId = req.userId;

    if (typeof totalExcess !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Total excess calories is required'
      });
    }

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate current TDEE
    const userData = {
      weight: user.onboarding?.healthMetrics?.weight || 70,
      height: user.onboarding?.healthMetrics?.height || 170,
      age: user.onboarding?.basicInfo?.age || 25,
      gender: user.onboarding?.basicInfo?.gender || 'male',
      activityLevel: user.onboarding?.lifestyle?.activityLevel || 'moderate'
    };

    const BMR = recoveryEngine.calculateBMR(userData);
    const TDEE = recoveryEngine.calculateTDEE(BMR, userData.activityLevel);

    // Generate multi-day adjustment plan
    const multiDayPlan = recoveryEngine.calculateMultiDayAdjustment(
      totalExcess,
      TDEE,
      remainingDays
    );

    res.json({
      success: true,
      message: 'Multi-day recovery plan generated successfully',
      data: multiDayPlan
    });
  } catch (error) {
    console.error('Multi-day plan generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating multi-day plan',
      error: error.message
    });
  }
};

// Routes
router.post('/assess', assessRecovery);
router.post('/multi-day-plan', generateMultiDayPlan);

module.exports = router;
