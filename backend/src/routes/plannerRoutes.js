const express = require('express');
const {
  generateDailyPlan,
  generateMultiplePlans,
  findSimilarMeals,
  getMealSuggestions,
  singleMealPlanner,
  multiMealPlanner,
  smartMealPlanner,
  generateFlaskDailyPlan,
  getMealPlanStatus  // ✅ ADD THIS IMPORT
} = require('../controllers/plannerController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes are protected (authMiddleware applies to ALL routes below)
router.use(authMiddleware);

router.post('/daily', generateDailyPlan);
router.post('/multiple', generateMultiplePlans);
router.post('/similar', findSimilarMeals);
router.post('/suggestions', getMealSuggestions);
router.post('/single-meal', singleMealPlanner);
router.post('/multi-meal', multiMealPlanner);
router.post('/smart', smartMealPlanner);
router.post('/flask-daily', generateFlaskDailyPlan);
router.get('/meal-plan-status/:requestId', getMealPlanStatus); 

module.exports = router;