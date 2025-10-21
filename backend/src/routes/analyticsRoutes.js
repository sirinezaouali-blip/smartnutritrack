const express = require('express');
const {
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getMacroDistribution
} = require('../controllers/analyticsController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

router.get('/daily/:date', getDailyAnalytics);
router.get('/weekly', getWeeklyAnalytics);
router.get('/monthly', getMonthlyAnalytics);
router.get('/macros', getMacroDistribution);

module.exports = router;