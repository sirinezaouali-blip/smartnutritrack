const express = require('express');
const {
  addUserMeal,
  getUserMealsByDate,
  updateUserMeal,
  deleteUserMeal,
  getRecentMealHistory,
  getUserMealById
} = require('../controllers/userMealController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

router.post('/', addUserMeal);
router.get('/history/recent', getRecentMealHistory);
router.get('/:date', getUserMealsByDate);
router.get('/single/:id', getUserMealById);
router.put('/:id', updateUserMeal);
router.delete('/:id', deleteUserMeal);

module.exports = router;
