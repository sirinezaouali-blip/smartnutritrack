import React, { useState, useEffect } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { generateMultipleMealPlans } from '../../../services/aiService';
import { FiTarget, FiShuffle, FiCheck, FiPlus, FiRefreshCw, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './MultipleMealPlanner.module.css';

const MultipleMealPlanner = () => {
  const { userProfile } = useUser();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    mealType: 'breakfast',
    wantedMeal: '',
    preferences: ''
  });
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(0);
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

  const generatePlans = async () => {
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

      const response = await generateMultipleMealPlans(requestData);

      if (response.success) {
        setMealPlans(response.data.plans);
        setSelectedPlan(0);
        setSelectedMeals([]);
      } else {
        setError('Failed to generate meal plans');
      }
    } catch (error) {
      console.error('Meal plans generation error:', error);
      setError('Failed to generate meal plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateRemainingCalories = () => {
    const healthMetrics = userProfile?.onboarding?.healthMetrics;
    if (!healthMetrics) return 2000;

    // This would be calculated based on today's consumed calories
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

    const currentPlan = mealPlans[selectedPlan];
    const mealsToAdd = selectedMeals.map(index => currentPlan.meals[index]);
    // Here you would typically dispatch to add meals to the user's daily intake
    console.log('Adding meals to daily intake:', mealsToAdd);

    // Reset selections and show success message
    setSelectedMeals([]);
    alert('Meals added to your daily intake successfully!');
  };

  const resetPlans = () => {
    setMealPlans([]);
    setSelectedPlan(0);
    setSelectedMeals([]);
    setFormData({
      mealType: 'breakfast',
      wantedMeal: '',
      preferences: ''
    });
    setError(null);
  };

  const nextPlan = () => {
    setSelectedPlan(prev => (prev + 1) % mealPlans.length);
    setSelectedMeals([]);
  };

  const prevPlan = () => {
    setSelectedPlan(prev => (prev - 1 + mealPlans.length) % mealPlans.length);
    setSelectedMeals([]);
  };

  const currentPlan = mealPlans[selectedPlan];

  return (
    <div className={styles.multipleMealPlanner}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Multiple Meal Plans</h1>
          <p className={styles.subtitle}>
            Compare and choose from multiple meal plan options
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className={styles.inputSection}>
        <div className={styles.inputCard}>
          <h2 className={styles.sectionTitle}>Generate Plan Options</h2>

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

            {/* Wanted Meal */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>What would you like to eat?</label>
              <input
                type="text"
                value={formData.wantedMeal}
                onChange={(e) => handleInputChange('wantedMeal', e.target.value)}
                placeholder="e.g., I had breakfast already, now I want to eat chicken for lunch, give me 3 propositions..."
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
              onClick={generatePlans}
              disabled={loading || !formData.wantedMeal.trim()}
              className={styles.generateButton}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" />
                  Generating Plans...
                </>
              ) : (
                <>
                  <FiShuffle />
                  Generate 3 Plan Options
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

      {/* Meal Plans Results */}
      {mealPlans.length > 0 && (
        <div className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.sectionTitle}>Choose Your Preferred Plan</h2>
            <div className={styles.planNavigation}>
              <button
                onClick={prevPlan}
                className={styles.navButton}
                disabled={mealPlans.length <= 1}
              >
                <FiChevronLeft />
              </button>
              <span className={styles.planCounter}>
                Plan {selectedPlan + 1} of {mealPlans.length}
              </span>
              <button
                onClick={nextPlan}
                className={styles.navButton}
                disabled={mealPlans.length <= 1}
              >
                <FiChevronRight />
              </button>
            </div>
          </div>

          {/* Current Plan Display */}
          {currentPlan && (
            <div className={styles.planCard}>
              <div className={styles.planHeader}>
                <div className={styles.planTitle}>
                  <h3>Plan Option {selectedPlan + 1}</h3>
                  <div className={styles.planSummary}>
                    <div className={styles.summaryItem}>
                      <FiTarget />
                      <span>{currentPlan.totalCalories} kcal total</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span>{currentPlan.meals.length} meals</span>
                    </div>
                  </div>
                </div>
                <div className={styles.planMeta}>
                  <div className={styles.varietyScore}>
                    Variety: {currentPlan.varietyScore}/10
                  </div>
                  <div className={styles.nutritionScore}>
                    Nutrition: {currentPlan.nutritionScore}/10
                  </div>
                </div>
              </div>

              <div className={styles.mealsGrid}>
                {currentPlan.meals.map((meal, index) => (
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
                      <h4 className={styles.mealName}>{meal.name}</h4>
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
                      <h5>Key Ingredients:</h5>
                      <div className={styles.ingredientsList}>
                        {meal.ingredients.slice(0, 4).map((ingredient, i) => (
                          <span key={i} className={styles.ingredient}>
                            {ingredient}
                          </span>
                        ))}
                        {meal.ingredients.length > 4 && (
                          <span className={styles.moreIngredients}>
                            +{meal.ingredients.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan Comparison */}
          <div className={styles.comparisonSection}>
            <h3 className={styles.comparisonTitle}>Plan Comparison</h3>
            <div className={styles.comparisonGrid}>
              {mealPlans.map((plan, index) => (
                <div
                  key={index}
                  className={`${styles.comparisonCard} ${
                    selectedPlan === index ? styles.active : ''
                  }`}
                  onClick={() => {
                    setSelectedPlan(index);
                    setSelectedMeals([]);
                  }}
                >
                  <div className={styles.comparisonHeader}>
                    <h4>Plan {index + 1}</h4>
                    <div className={styles.planBadges}>
                      {selectedPlan === index && (
                        <span className={styles.currentBadge}>Current</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.comparisonStats}>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{plan.totalCalories}</span>
                      <span className={styles.statLabel}>kcal</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{plan.meals.length}</span>
                      <span className={styles.statLabel}>meals</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{plan.varietyScore}/10</span>
                      <span className={styles.statLabel}>variety</span>
                    </div>
                  </div>

                  <div className={styles.planPreview}>
                    {plan.meals.slice(0, 2).map((meal, mealIndex) => (
                      <div key={mealIndex} className={styles.previewMeal}>
                        <span className={styles.previewIcon}>
                          {mealTypes.find(t => t.value === meal.mealType)?.icon}
                        </span>
                        <span className={styles.previewName}>{meal.name}</span>
                      </div>
                    ))}
                    {plan.meals.length > 2 && (
                      <div className={styles.moreMeals}>
                        +{plan.meals.length - 2} more meals
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
              onClick={resetPlans}
              className={styles.resetButton}
            >
              <FiRefreshCw />
              Generate New Plans
            </button>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className={styles.tipsSection}>
        <h2 className={styles.sectionTitle}>Planning Tips</h2>
        <div className={styles.tipsGrid}>
          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>🔍</div>
            <h4 className={styles.tipTitle}>Compare Options</h4>
            <p className={styles.tipDescription}>
              Each plan offers different meal combinations. Choose based on your preferences and available ingredients.
            </p>
          </div>

          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>⭐</div>
            <h4 className={styles.tipTitle}>Variety Score</h4>
            <p className={styles.tipDescription}>
              Higher variety scores indicate more diverse meal options and nutritional balance.
            </p>
          </div>

          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>⚖️</div>
            <h4 className={styles.tipTitle}>Calorie Balance</h4>
            <p className={styles.tipDescription}>
              All plans are designed to fit within your remaining daily calorie target.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultipleMealPlanner;
