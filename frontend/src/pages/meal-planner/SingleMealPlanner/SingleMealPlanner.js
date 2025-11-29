import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';
import { fetchAnalyticsData } from '../../../services/analyticsService';
import { FiTarget, FiClock, FiCheck, FiRefreshCw, FiShoppingCart } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './SingleMealPlanner.module.css';

const SingleMealPlanner = () => {
  const { userProfile } = useUser();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    mealType: 'lunch',
    userInput: '',
    preferences: ''
  });

  const [mealSuggestions, setMealSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMeals, setSelectedMeals] = useState([]);
  
  // Track calories for recommendations
  const [remainingCalories, setRemainingCalories] = useState(0);
  const [todayStats, setTodayStats] = useState(null);

  // Normal meal types only
  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: '🌅', color: '#FF9800' },
    { value: 'lunch', label: 'Lunch', icon: '🌞', color: '#4CAF50' },
    { value: 'dinner', label: 'Dinner', icon: '🌙', color: '#2196F3' },
    { value: 'snack', label: 'Snack', icon: '🍎', color: '#9C27B0' }
  ];

  // Load today's stats for calorie tracking
  useEffect(() => {
    loadTodayStats();
  }, [userProfile]);

  const loadTodayStats = async () => {
    try {
      const analyticsResponse = await fetchAnalyticsData('today');
      
      if (analyticsResponse.success) {
        const analyticsData = analyticsResponse.data || {};
        
        const todayStatsData = {
          caloriesConsumed: analyticsData.caloriesConsumed || 0,
          proteinConsumed: analyticsData.proteinConsumed || 0,
          carbsConsumed: analyticsData.carbsConsumed || 0,
          fatsConsumed: analyticsData.fatsConsumed || 0,
          caloriesTarget: analyticsData.caloriesTarget,
          proteinTarget: analyticsData.proteinTarget,
          carbsTarget: analyticsData.carbsTarget,
          fatsTarget: analyticsData.fatsTarget
        };

        setTodayStats(todayStatsData);
        
        // Calculate remaining calories for recommendations
        const dailyTarget = todayStatsData.caloriesTarget || 2000;
        const caloriesConsumed = todayStatsData.caloriesConsumed || 0;
        const remaining = dailyTarget - caloriesConsumed;
        
        setRemainingCalories(remaining);
        
        console.log('📊 Calorie Data Loaded:', {
          dailyTarget,
          caloriesConsumed,
          remaining
        });
      }
    } catch (error) {
      console.error('Error loading today stats:', error);
      const healthMetrics = userProfile?.onboarding?.healthMetrics;
      const dailyTarget = healthMetrics?.dailyCalories || 2000;
      setRemainingCalories(dailyTarget);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateMealSuggestions = async () => {
    if (!formData.userInput.trim()) {
      setError('Please describe what you want to eat');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use REAL data from todayStats for recommendations
      const healthMetrics = userProfile?.onboarding?.healthMetrics;
      const targetCalories = todayStats?.caloriesTarget || healthMetrics?.dailyCalories || 2000;
      const goal = userProfile?.onboarding?.basicInfo?.goal || 'maintain weight';

      // Prepare request for Flask API with calorie data
      const requestData = {
        user_input: formData.userInput,
        meal_type: formData.mealType,
        emergency_mode: true,
        remaining_calories: remainingCalories, // Send remaining calories for smart recommendations
        user_profile: {
          target_calories: targetCalories,
          goals: goal,
          avoid_categories: userProfile?.onboarding?.preferences?.dislikedFoods || []
        }
      };

      console.log('🚀 Sending request to Flask API:', requestData);

      // Call the Flask single meal endpoint
      const response = await fetch('http://localhost:5001/api/single-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.success) {
        // Transform the response to match your existing frontend format
        const transformedSuggestions = data.data.options.map(option => ({
          _id: option.id,
          name: option.food_name,
          description: `${option.type} - ${option.calories} kcal`,
          calories: option.calories,
          protein: option.protein_g,
          carbs: option.carbs_g,
          fat: option.fat_g,
          type: option.type,
          ingredients: option.items,
          price: Number((option.calories * 0.02).toFixed(2))
        }));

        setMealSuggestions({
          suggestions: transformedSuggestions,
          mealType: formData.mealType,
          targetCalories: data.data.target_calories,
          count: transformedSuggestions.length,
          remainingCalories: remainingCalories // Include for display
        });
        setSelectedMeals([]);
      } else {
        setError(data.error || 'Failed to generate meal suggestions');
      }
    } catch (error) {
      console.error('Meal suggestions error:', error);
      setError('Failed to generate meal suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMealSelection = (mealIndex) => {
    setSelectedMeals(prev =>
      prev.includes(mealIndex)
        ? prev.filter(i => i !== mealIndex)
        : [...prev, mealIndex]
    );
  };

  const addToCart = () => {
    if (selectedMeals.length === 0) return;

    const selectedMealObjects = selectedMeals.map(index => mealSuggestions.suggestions[index]);

    // Store in localStorage for cart
    const cartItems = selectedMealObjects.map(meal => ({
      id: meal._id || meal.name,
      name: meal.name,
      calories: meal.calories,
      price: meal.price || (meal.calories * 0.02).toFixed(2),
      quantity: 1,
      image: meal.imageUrl,
      type: 'meal'
    }));

    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    navigate('/cart');
  };

  const resetPlan = () => {
    setMealSuggestions(null);
    setSelectedMeals([]);
    setFormData({
      mealType: 'lunch',
      userInput: '',
      preferences: ''
    });
    setError(null);
  };

  return (
    <div className={styles.dailyMealPlanner}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Single Meal Planner</h1>
          <p className={styles.subtitle}>
            Find the perfect meal based on your daily nutrition goals
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className={styles.inputSection}>
        <div className={styles.inputCard}>
          <h2 className={styles.sectionTitle}>Plan Your Meal</h2>

          {/* Calorie Status Display */}
          {todayStats && (
            <div className={styles.calorieStatus}>
              <div className={styles.calorieInfo}>
                <span className={styles.calorieLabel}>Today's Progress:</span>
                <span className={styles.calorieValue}>
                  {todayStats.caloriesConsumed || 0} / {todayStats.caloriesTarget || 2000} kcal
                </span>
                <span className={styles.calorieRemaining}>
                  {remainingCalories} kcal remaining for recommendations
                </span>
              </div>
            </div>
          )}

          <div className={styles.inputGrid}>
            {/* Meal Type Selection */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Meal Type</label>
              <div className={styles.mealTypeGrid}>
                {mealTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    className={`${styles.mealTypeButton} ${
                      formData.mealType === type.value ? styles.active : ''
                    }`}
                    onClick={() => handleInputChange('mealType', type.value)}
                    style={{
                      '--meal-color': type.color
                    }}
                  >
                    <span className={styles.mealIcon}>{type.icon}</span>
                    <span className={styles.mealLabel}>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* User Input */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>What would you like to eat?</label>
              <input
                type="text"
                value={formData.userInput}
                onChange={(e) => handleInputChange('userInput', e.target.value)}
                placeholder="e.g., I want to eat lunch, and I want to eat chicken..."
                className={styles.textInput}
              />
            </div>

            {/* Additional Preferences */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Additional Preferences (Optional)</label>
              <textarea
                value={formData.preferences}
                onChange={(e) => handleInputChange('preferences', e.target.value)}
                placeholder="Any specific requirements or preferences..."
                className={styles.textArea}
                rows={3}
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className={styles.actionSection}>
            <button
              onClick={generateMealSuggestions}
              disabled={loading || !formData.userInput.trim()}
              className={styles.generateButton}
            >
              <FiTarget />
              Find Meals
            </button>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Meal Suggestions Results */}
      {mealSuggestions && mealSuggestions.suggestions.length > 0 && (
        <div className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.sectionTitle}>Meal Suggestions</h2>
            <div className={styles.planSummary}>
              <div className={styles.summaryItem}>
                <FiTarget />
                <span>{mealSuggestions.targetCalories} kcal target</span>
              </div>
              <div className={styles.summaryItem}>
                <FiClock />
                <span>{mealSuggestions.count} suggestions</span>
              </div>
              <div className={styles.summaryItem}>
                <span>Remaining: {mealSuggestions.remainingCalories} kcal</span>
              </div>
            </div>
          </div>

          <div className={styles.mealsGrid}>
            {mealSuggestions.suggestions.map((meal, index) => (
              <div
                key={meal._id || meal.name || index}
                className={`${styles.mealCard} ${
                  selectedMeals.includes(index) ? styles.selected : ''
                }`}
                onClick={() => toggleMealSelection(index)}
              >
                <div className={styles.mealHeader}>
                  <div className={styles.mealType}>
                    <span className={styles.mealIcon}>
                      {mealTypes.find(t => t.value === mealSuggestions.mealType)?.icon}
                    </span>
                    <span className={styles.mealTypeLabel}>
                      {mealTypes.find(t => t.value === mealSuggestions.mealType)?.label}
                    </span>
                  </div>
                  <div className={styles.selectionIndicator}>
                    {selectedMeals.includes(index) && <FiCheck />}
                  </div>
                </div>

                <div className={styles.mealContent}>
                  <h3 className={styles.mealName}>{meal.name}</h3>
                  <p className={styles.mealDescription}>{meal.description}</p>

                  <div className={styles.mealNutrition}>
                    <div className={styles.nutritionItem}>
                      <span className={styles.nutritionValue}>{meal.calories}</span>
                      <span className={styles.nutritionUnit}>kcal</span>
                    </div>
                    <div className={styles.nutritionItem}>
                      <span className={styles.nutritionValue}>{meal.protein || 0}g</span>
                      <span className={styles.nutritionUnit}>protein</span>
                    </div>
                    <div className={styles.nutritionItem}>
                      <span className={styles.nutritionValue}>{meal.carbs || 0}g</span>
                      <span className={styles.nutritionUnit}>carbs</span>
                    </div>
                    <div className={styles.nutritionItem}>
                      <span className={styles.nutritionValue}>{meal.fat || 0}g</span>
                      <span className={styles.nutritionUnit}>fat</span>
                    </div>
                  </div>

                  {meal.price && (
                    <div className={styles.mealPrice}>
                      ${typeof meal.price === 'number' ? meal.price.toFixed(2) : parseFloat(meal.price || 0).toFixed(2)}
                    </div>
                  )}
                </div>

                {meal.ingredients && meal.ingredients.length > 0 && (
                  <div className={styles.mealIngredients}>
                    <h4>Ingredients:</h4>
                    <ul>
                      {meal.ingredients.map((ingredient, i) => (
                        <li key={i}>{ingredient}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className={styles.resultsActions}>
            <button
              onClick={addToCart}
              disabled={selectedMeals.length === 0}
              className={styles.addMealsButton}
            >
              <FiShoppingCart />
              Add to Cart ({selectedMeals.length})
            </button>

            <button
              onClick={resetPlan}
              className={styles.resetButton}
            >
              <FiRefreshCw />
              Find Different Meals
            </button>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className={styles.tipsSection}>
        <h2 className={styles.sectionTitle}>Planning Tips</h2>
        <div className={styles.tipsGrid}>
          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>🎯</div>
            <h4 className={styles.tipTitle}>Be Specific</h4>
            <p className={styles.tipDescription}>
              The more specific you are about what you want, the better the AI can suggest meals that match your preferences.
            </p>
          </div>

          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>⚖️</div>
            <h4 className={styles.tipTitle}>Calorie Balance</h4>
            <p className={styles.tipDescription}>
              Your suggestions are calculated based on your daily calorie goals to help you stay on track.
            </p>
          </div>

          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>🔄</div>
            <h4 className={styles.tipTitle}>Flexibility</h4>
            <p className={styles.tipDescription}>
              You can always adjust portions or substitute ingredients based on what you have available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleMealPlanner;



