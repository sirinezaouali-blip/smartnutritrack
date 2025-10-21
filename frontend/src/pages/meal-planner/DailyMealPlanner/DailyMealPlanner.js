import React, { useState, useEffect } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { generateDailyMealPlan } from '../../../services/aiService';
import { FiCalendar, FiTarget, FiClock, FiPlus, FiCheck, FiRefreshCw, FiChevronRight } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './DailyMealPlanner.module.css';

const DailyMealPlanner = () => {
  const { userProfile } = useUser();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    mealType: 'breakfast',
    wantedMeal: '',
    preferences: ''
  });
  const [mealPlan, setMealPlan] = useState(null);
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

  const generatePlan = async () => {
    if (!formData.wantedMeal.trim()) {
      setError('Please enter what type of meal you want');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const remainingCalories = calculateRemainingCalories();
      const preferences = userProfile?.onboarding?.preferences || {};

      const requestData = {
        mealType: formData.mealType,
        wantedMeal: formData.wantedMeal,
        remainingCalories,
        preferences: {
          dietType: preferences.dietType,
          dislikedFoods: preferences.dislikedFoods || [],
          allergies: userProfile?.onboarding?.medical?.allergies || [],
          cuisine: preferences.favoriteCuisine || []
        },
        userProfile: {
          age: userProfile?.onboarding?.basicInfo?.age,
          weight: userProfile?.onboarding?.basicInfo?.weight,
          height: userProfile?.onboarding?.basicInfo?.height,
          gender: userProfile?.onboarding?.basicInfo?.gender,
          activityLevel: userProfile?.onboarding?.lifestyle?.activityLevel
        }
      };

      const response = await generateDailyMealPlan(requestData);

      if (response.success) {
        setMealPlan(response.data);
        setSelectedMeals([]);
      } else {
        setError('Failed to generate meal plan');
      }
    } catch (error) {
      console.error('Meal plan generation error:', error);
      setError('Failed to generate meal plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateRemainingCalories = () => {
    const healthMetrics = userProfile?.onboarding?.healthMetrics;
    if (!healthMetrics) return 2000;

    // This would be calculated based on today's consumed calories
    // For now, return a default value
    return healthMetrics.dailyCalories || 2000;
  };

  const toggleMealSelection = (mealIndex) => {
    setSelectedMeals(prev =>
      prev.includes(mealIndex)
        ? prev.filter(i => i !== mealIndex)
        : [...prev, mealIndex]
    );
  };

  const addSelectedMeals = () => {
    if (selectedMeals.length === 0) return;

    const mealsToAdd = selectedMeals.map(index => mealPlan.meals[index]);
    // Here you would typically dispatch to add meals to the user's daily intake
    console.log('Adding meals to daily intake:', mealsToAdd);

    // Reset selections and show success message
    setSelectedMeals([]);
    alert('Meals added to your daily intake successfully!');
  };

  const resetPlan = () => {
    setMealPlan(null);
    setSelectedMeals([]);
    setFormData({
      mealType: 'breakfast',
      wantedMeal: '',
      preferences: ''
    });
    setError(null);
  };

  return (
    <div className={styles.dailyMealPlanner}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Daily Meal Planner</h1>
          <p className={styles.subtitle}>
            Get a personalized meal plan for your entire day
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className={styles.inputSection}>
        <div className={styles.inputCard}>
          <h2 className={styles.sectionTitle}>Plan Your Day</h2>

          <div className={styles.inputGrid}>
            {/* Meal Type Selection */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Meal Type Eaten</label>
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

            {/* Wanted Meal */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>What would you like to eat?</label>
              <input
                type="text"
                value={formData.wantedMeal}
                onChange={(e) => handleInputChange('wantedMeal', e.target.value)}
                placeholder="e.g., I had breakfast already, now I want to eat chicken for lunch..."
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
              onClick={generatePlan}
              disabled={loading || !formData.wantedMeal.trim()}
              className={styles.generateButton}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <FiTarget />
                  Generate Daily Plan
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

      {/* Meal Plan Results */}
      {mealPlan && (
        <div className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.sectionTitle}>Your Daily Meal Plan</h2>
            <div className={styles.planSummary}>
              <div className={styles.summaryItem}>
                <FiTarget />
                <span>{mealPlan.totalCalories} kcal total</span>
              </div>
              <div className={styles.summaryItem}>
                <FiClock />
                <span>{mealPlan.meals.length} meals</span>
              </div>
            </div>
          </div>

          <div className={styles.mealsGrid}>
            {mealPlan.meals.map((meal, index) => (
              <div
                key={index}
                className={`${styles.mealCard} ${
                  selectedMeals.includes(index) ? styles.selected : ''
                }`}
                onClick={() => toggleMealSelection(index)}
              >
                <div className={styles.mealHeader}>
                  <div className={styles.mealType}>
                    <span className={styles.mealIcon}>
                      {mealTypes.find(t => t.value === meal.mealType)?.icon}
                    </span>
                    <span className={styles.mealTypeLabel}>
                      {mealTypes.find(t => t.value === meal.mealType)?.label}
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
                      <span className={styles.nutritionValue}>{meal.protein}g</span>
                      <span className={styles.nutritionUnit}>protein</span>
                    </div>
                    <div className={styles.nutritionItem}>
                      <span className={styles.nutritionValue}>{meal.carbs}g</span>
                      <span className={styles.nutritionUnit}>carbs</span>
                    </div>
                    <div className={styles.nutritionItem}>
                      <span className={styles.nutritionValue}>{meal.fat}g</span>
                      <span className={styles.nutritionUnit}>fat</span>
                    </div>
                  </div>
                </div>

                <div className={styles.mealIngredients}>
                  <h4>Ingredients:</h4>
                  <ul>
                    {meal.ingredients.map((ingredient, i) => (
                      <li key={i}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className={styles.resultsActions}>
            <button
              onClick={addSelectedMeals}
              disabled={selectedMeals.length === 0}
              className={styles.addMealsButton}
            >
              <FiPlus />
              Add Selected Meals ({selectedMeals.length})
            </button>

            <button
              onClick={resetPlan}
              className={styles.resetButton}
            >
              <FiRefreshCw />
              Plan Another Day
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
              Your plan is calculated based on your remaining daily calories to help you stay on track.
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

export default DailyMealPlanner;
