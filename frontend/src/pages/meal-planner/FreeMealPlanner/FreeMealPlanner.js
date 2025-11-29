import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';

import { FiTarget, FiClock, FiCheck, FiRefreshCw, FiShoppingCart } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './FreeMealPlanner.module.css';

const FreeMealPlanner = () => {
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

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: '🌅', color: '#FF9800' },
    { value: 'lunch', label: 'Lunch', icon: '🌞', color: '#4CAF50' },
    { value: 'dinner', label: 'Dinner', icon: '🌙', color: '#2196F3' },
    { value: 'snack', label: 'Snack', icon: '🍎', color: '#9C27B0' }
  ];

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
      // Get user profile data for calorie calculation
      const healthMetrics = userProfile?.onboarding?.healthMetrics;
      const targetCalories = healthMetrics?.dailyCalories || 2000;

      // Calculate target calories for single meal (max 800)
      const remainingCalories = Math.min(targetCalories * 0.4, 800);

      // Call the single meal planner endpoint
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/planner/single-meal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userInput: formData.userInput,
          mealType: formData.mealType,
          targetCalories: remainingCalories,
          userProfile: {
            preferences: userProfile?.onboarding?.preferences || {},
            allergies: userProfile?.onboarding?.medical?.allergies || [],
            dislikedFoods: userProfile?.onboarding?.preferences?.dislikedFoods || []
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setMealSuggestions({
          suggestions: data.data.suggestions || [],
          mealType: formData.mealType,
          targetCalories: remainingCalories,
          count: data.data.suggestions?.length || 0
        });
        setSelectedMeals([]);
      } else {
        setError(data.message || 'Failed to generate meal suggestions');
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
      price: meal.price || (meal.calories * 0.02).toFixed(2), // Simple pricing
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
    <div className={styles.freeMealPlanner}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Free Meal Planner</h1>
          <p className={styles.subtitle}>
            Find any meal you want without restrictions
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className={styles.inputSection}>
        <div className={styles.inputCard}>
          <h2 className={styles.sectionTitle}>Plan Your Meal</h2>

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
                placeholder="e.g., I want to eat pizza, pasta, burger..."
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
              {loading ? (
                <>
                  <LoadingSpinner size="small" />
                  Finding Meals...
                </>
              ) : (
                <>
                  <FiTarget />
                  Find Meals
                </>
              )}
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
                      ${meal.price.toFixed(2)}
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
            <div className={styles.tipIcon}>🍽️</div>
            <h4 className={styles.tipTitle}>Any Meal Type</h4>
            <p className={styles.tipDescription}>
              Choose from any cuisine or meal type you desire, without dietary restrictions.
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

export default FreeMealPlanner;
