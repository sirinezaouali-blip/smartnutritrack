const express = require('express');
const { 
  createMeal, 
  getMeals, 
  searchMeals,
  getMealById,
  updateMeal,
  deleteMeal 
} = require('../controllers/mealController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, createMeal);
router.get('/', getMeals);
router.get('/search', searchMeals);
router.get('/:id', getMealById);           
router.put('/:id', authMiddleware, updateMeal); 
router.delete('/:id', authMiddleware, deleteMeal); 

module.exports = router;