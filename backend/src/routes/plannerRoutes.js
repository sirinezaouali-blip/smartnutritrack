const express = require('express');
const {
  generateDailyPlan,
  generateMultiplePlans,
  findSimilarMeals,
  getMealSuggestions,
  singleMealPlanner,
  multiMealPlanner,
  smartMealPlanner
} = require('../controllers/plannerController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

router.post('/daily', generateDailyPlan);
router.post('/multiple', generateMultiplePlans);
router.post('/similar', findSimilarMeals);
router.post('/suggestions', getMealSuggestions);
router.post('/single-meal', singleMealPlanner);
router.post('/multi-meal', multiMealPlanner);
router.post('/smart', smartMealPlanner);

module.exports = router;