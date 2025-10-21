import { useState, useEffect } from 'react';
import { mealService } from '../services/mealService';

export const useMeals = (date = null) => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMeals = async (targetDate = date) => {
    setLoading(true);
    setError(null);
    try {
      const response = await mealService.fetchUserMeals(targetDate);
      if (response.success) {
        setMeals(response.data.meals || []);
      } else {
        setError('Failed to fetch meals');
      }
    } catch (err) {
      console.error('Error fetching meals:', err);
      setError('Failed to fetch meals');
    } finally {
      setLoading(false);
    }
  };

  const addMeal = async (mealData) => {
    try {
      const response = await mealService.addMeal(mealData);
      if (response.success) {
        setMeals(prev => [...prev, response.data]);
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateMeal = async (mealId, mealData) => {
    try {
      const response = await mealService.updateMeal(mealId, mealData);
      if (response.success) {
        setMeals(prev => prev.map(meal => meal.id === mealId ? response.data : meal));
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteMeal = async (mealId) => {
    try {
      const response = await mealService.deleteMeal(mealId);
      if (response.success) {
        setMeals(prev => prev.filter(meal => meal.id !== mealId));
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    if (date) {
      fetchMeals(date);
    }
  }, [date]);

  return {
    meals,
    loading,
    error,
    fetchMeals,
    addMeal,
    updateMeal,
    deleteMeal
  };
};
