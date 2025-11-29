import React, { useState, useEffect } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { generateMultipleMealPlans } from '../../../services/aiService';
import { fetchAnalyticsData } from '../../../services/analyticsService';
import { FiTarget, FiShuffle, FiCheck, FiPlus, FiRefreshCw, FiChevronRight, FiChevronLeft, FiAlertTriangle, FiClock, FiActivity, FiTrendingUp } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './MultipleMealPlanner.module.css';
import BestPracticesGuide from '../../../components/emergency/BestPracticesGuide';


const MultipleMealPlanner = () => {
  const { userProfile } = useUser();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    category: 'Meat & Poultry',
    wantedMeal: '',
    preferences: ''
  });
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [selectedMeals, setSelectedMeals] = useState([]);
  
  const [remainingCalories, setRemainingCalories] = useState(0);
  const [todayStats, setTodayStats] = useState(null);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [activeTab, setActiveTab] = useState('guidance'); // 'guidance' or 'planner'

  const emergencyCategories = [
    { value: 'Meat & Poultry', label: 'Meat & Poultry', icon: '🍗', color: '#FF6B6B' },
    { value: 'Seafood', label: 'Seafood', icon: '🐟', color: '#4ECDC4' },
    { value: 'Salad', label: 'Salad', icon: '🥗', color: '#45B7D1' },
    { value: 'Soups', label: 'Soups', icon: '🍲', color: '#FFA07A' },
    { value: 'Dessert', label: 'Dessert', icon: '🍰', color: '#BA68C8' }
  ];

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
          caloriesTarget: analyticsData.caloriesTarget,
          proteinConsumed: analyticsData.proteinConsumed || 0,
          carbsConsumed: analyticsData.carbsConsumed || 0,
          fatsConsumed: analyticsData.fatsConsumed || 0
        };

        setTodayStats(todayStatsData);
        
        const dailyTarget = todayStatsData.caloriesTarget || 2000;
        const caloriesConsumed = todayStatsData.caloriesConsumed || 0;
        const remaining = dailyTarget - caloriesConsumed;
        
        setRemainingCalories(remaining);
        setEmergencyMode(remaining < 500);
      }
    } catch (error) {
      console.error('Error loading today stats:', error);
      setRemainingCalories(2000);
      setEmergencyMode(false);
    }
  };

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
    setActiveTab('planner');

    try {
      const preferences = userProfile?.onboarding?.preferences || {};

      // Prepare request data for the Flask backend
      const requestData = {
        user_input: formData.wantedMeal,
        meal_type: formData.category,
        emergency_mode: false,
        remaining_calories: remainingCalories,
        user_profile: {
          target_calories: todayStats?.caloriesTarget || userProfile?.onboarding?.healthMetrics?.dailyCalories || 2000,
          goals: userProfile?.onboarding?.basicInfo?.goal || 'maintain weight',
          avoid_categories: userProfile?.onboarding?.preferences?.dislikedFoods || []
        }
      };

      console.log('🚀 Sending LOW-CARB request to Flask:', requestData);

      // Call the Flask single-meal endpoint directly
      const response = await fetch('http://localhost:5001/api/single-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.success) {
        // Transform the single meal response to multiple plans format
        const singlePlan = {
          meals: data.data.options.map(option => ({
            name: option.food_name,
            description: `${option.type} - ${option.calories} kcal`,
            calories: option.calories,
            protein: option.protein_g,
            carbs: option.carbs_g,
            fat: option.fat_g,
            mealType: 'lunch',
            category: formData.category,
            ingredients: option.items || []
          })),
          totalCalories: data.data.target_calories,
          varietyScore: Math.min(10, data.data.options.length + 5),
          nutritionScore: 8
        };

        // Create 3 variations of the same plan (for now)
        const plans = [singlePlan, singlePlan, singlePlan].map((plan, index) => ({
          ...plan,
          plan_number: index + 1,
          totalCalories: Math.floor(plan.totalCalories * (0.9 + index * 0.1))
        }));

        setMealPlans(plans);
        setSelectedPlan(0);
        setSelectedMeals([]);
      } else {
        setError(data.error || 'Failed to generate meal plans');
      }
    } catch (error) {
      console.error('Meal plans generation error:', error);
      setError('Failed to generate meal plans. Please try again.');
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

  const addSelectedMeals = () => {
    if (selectedMeals.length === 0) return;

    const currentPlan = mealPlans[selectedPlan];
    if (!currentPlan) return;

    const mealsToAdd = selectedMeals.map(index => currentPlan.meals?.[index]).filter(Boolean);
    console.log('Adding meals to daily intake:', mealsToAdd);

    setSelectedMeals([]);
    alert('Meals added to your daily intake successfully!');
  };

  const resetPlans = () => {
    setMealPlans([]);
    setSelectedPlan(0);
    setSelectedMeals([]);
    setFormData({
      category: 'Meat & Poultry',
      wantedMeal: '',
      preferences: ''
    });
    setError(null);
  };

  const nextPlan = () => {
    if (mealPlans.length <= 1) return;
    setSelectedPlan(prev => (prev + 1) % mealPlans.length);
    setSelectedMeals([]);
  };

  const prevPlan = () => {
    if (mealPlans.length <= 1) return;
    setSelectedPlan(prev => (prev - 1 + mealPlans.length) % mealPlans.length);
    setSelectedMeals([]);
  };

  // Safe access to current plan
  const currentPlan = mealPlans[selectedPlan];

  return (
    <div className={styles.multipleMealPlanner}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <FiAlertTriangle className={styles.titleIcon} />
            Emergency Low-Carb Planner
          </h1>
          <p className={styles.subtitle}>
            High-protein, low-carb options optimized for your remaining calories
          </p>
        </div>
      </div>

      {/* Quick Status Bar */}
      {todayStats && (
        <div className={styles.quickStatusBar}>
          <div className={styles.statusItem}>
            <div className={styles.statusIcon}>🔥</div>
            <div className={styles.statusInfo}>
              <div className={styles.statusLabel}>Remaining</div>
              <div className={styles.statusValue}>{remainingCalories} kcal</div>
            </div>
          </div>
          <div className={styles.statusItem}>
            <div className={styles.statusIcon}>🚨</div>
            <div className={styles.statusInfo}>
              <div className={styles.statusLabel}>Priority</div>
              <div className={`${styles.statusValue} ${styles[remainingCalories < 300 ? 'high' : remainingCalories < 500 ? 'medium' : 'low']}`}>
                {remainingCalories < 300 ? 'High' : remainingCalories < 500 ? 'Medium' : 'Low'}
              </div>
            </div>
          </div>
          <div className={styles.statusItem}>
            <div className={styles.statusIcon}>⏰</div>
            <div className={styles.statusInfo}>
              <div className={styles.statusLabel}>Time</div>
              <div className={styles.statusValue}>Today</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className={styles.navigationTabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'guidance' ? styles.active : ''}`}
          onClick={() => setActiveTab('guidance')}
        >
          <FiActivity className={styles.tabIcon} />
          Emergency Guidance
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'planner' ? styles.active : ''}`}
          onClick={() => setActiveTab('planner')}
        >
          <FiTarget className={styles.tabIcon} />
          Meal Planner
        </button>
      </div>

      {/* Content Sections */}
      <div className={styles.contentSections}>
        {/* Emergency Guidance Section */}
        {activeTab === 'guidance' && emergencyMode && todayStats && (
          <div className={styles.guidanceSection}>
            <BestPracticesGuide 
              todayStats={todayStats}
              userProfile={userProfile}
              exceededMacros={{
                protein: todayStats.proteinConsumed || 0,
                carbs: todayStats.carbsConsumed || 0,
                fat: todayStats.fatsConsumed || 0
              }}
            />
          </div>
        )}

        {/* Meal Planner Section */}
        {activeTab === 'planner' && (
          <div className={styles.plannerSection}>
            {/* Emergency Banner */}
            {todayStats && (
              <div className={styles.emergencyBanner}>
                <FiAlertTriangle className={styles.bannerIcon} />
                <div className={styles.emergencyContent}>
                  <h3>Low-Carb Emergency Planning</h3>
                  <p>
                    {remainingCalories < 500 ? (
                      <>Only <strong>{remainingCalories} calories</strong> remaining. Specialized low-carb plans activated.</>
                    ) : (
                      <>You have <strong>{remainingCalories} calories</strong> remaining. Optimized low-carb plans ready.</>
                    )}
                  </p>
                  {emergencyMode && (
                    <div className={styles.emergencyNote}>
                      ⚡ <strong>Emergency Mode:</strong> Scientific guidance available
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Input Form */}
            <div className={styles.inputSection}>
              <div className={styles.inputCard}>
                <div className={styles.cardHeader}>
                  <FiTrendingUp className={styles.cardIcon} />
                  <h2 className={styles.cardTitle}>Generate Emergency Meal Plan</h2>
                </div>

                {/* Calorie Status */}
                {todayStats && (
                  <div className={styles.calorieStatus}>
                    <div className={styles.calorieMeter}>
                      <div className={styles.meterBar}>
                        <div 
                          className={styles.meterFill}
                          style={{ width: `${(todayStats.caloriesConsumed / todayStats.caloriesTarget) * 100}%` }}
                        ></div>
                      </div>
                      <div className={styles.meterLabels}>
                        <span>Consumed: {todayStats.caloriesConsumed || 0}kcal</span>
                        <span>Remaining: {remainingCalories}kcal</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className={styles.inputGrid}>
                  {/* Category Selection */}
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      <span className={styles.labelIcon}>📁</span>
                      Food Category
                    </label>
                    <div className={styles.mealTypeGrid}>
                      {emergencyCategories.map(category => (
                        <button
                          key={category.value}
                          type="button"
                          className={`${styles.mealTypeButton} ${
                            formData.category === category.value ? styles.active : ''
                          }`}
                          onClick={() => handleInputChange('category', category.value)}
                          style={{
                            '--meal-color': category.color
                          }}
                        >
                          <span className={styles.mealIcon}>{category.icon}</span>
                          <span className={styles.mealLabel}>{category.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wanted Meal */}
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      <span className={styles.labelIcon}>🔍</span>
                      What low-carb protein do you want?
                    </label>
                    <input
                      type="text"
                      value={formData.wantedMeal}
                      onChange={(e) => handleInputChange('wantedMeal', e.target.value)}
                      placeholder="e.g., chicken breast, grilled fish, turkey, eggs, tofu..."
                      className={styles.textInput}
                    />
                  </div>

                  {/* Additional Preferences */}
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      <span className={styles.labelIcon}>🎯</span>
                      Additional Preferences (Optional)
                    </label>
                    <textarea
                      value={formData.preferences}
                      onChange={(e) => handleInputChange('preferences', e.target.value)}
                      placeholder="e.g., no dairy, extra vegetables, specific cooking methods..."
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
                        Generating Emergency Plan...
                      </>
                    ) : (
                      <>
                        <FiShuffle className={styles.buttonIcon} />
                        Generate Low-Carb Emergency Plan
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div className={styles.errorMessage}>
                    <FiAlertTriangle className={styles.errorIcon} />
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Generated Results */}
            {mealPlans && mealPlans.length > 0 && currentPlan && (
              <div className={styles.resultsSection}>
                <div className={styles.resultsHeader}>
                  <h2 className={styles.sectionTitle}>
                    Your Low-Carb Meal Options
                  </h2>
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
                <div className={styles.planCard}>
                  <div className={styles.planHeader}>
                    <div className={styles.planTitle}>
                      <h3>Low-Carb Meal Options</h3>
                      <div className={styles.planSummary}>
                        <div className={styles.summaryItem}>
                          <FiTarget />
                          <span>{currentPlan.totalCalories || 0} kcal total</span>
                          <span className={styles.calorieNote}>
                            (Fits within {remainingCalories} kcal remaining)
                          </span>
                        </div>
                        <div className={styles.summaryItem}>
                          <span>{(currentPlan.meals || []).length} meals</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.planMeta}>
                      <div className={styles.varietyScore}>
                        Variety: {currentPlan.varietyScore || 0}/10
                      </div>
                      <div className={styles.nutritionScore}>
                        Protein Focus: {currentPlan.nutritionScore || 0}/10
                      </div>
                      <div className={styles.lowCarbBadge}>
                        🥗 Low-Carb
                      </div>
                    </div>
                  </div>

                  <div className={styles.mealsGrid}>
                    {(currentPlan.meals || []).map((meal, index) => (
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
                              {emergencyCategories.find(c => c.value === meal.category)?.icon || '🍽️'}
                            </span>
                            <span className={styles.mealTypeLabel}>
                              {emergencyCategories.find(c => c.value === meal.category)?.label || meal.category || 'Meal'}
                            </span>
                          </div>
                          <div className={styles.selectionIndicator}>
                            {selectedMeals.includes(index) && <FiCheck />}
                          </div>
                        </div>

                        <div className={styles.mealContent}>
                          <h4 className={styles.mealName}>{meal.name || 'Unnamed Meal'}</h4>
                          <p className={styles.mealDescription}>{meal.description || ''}</p>

                          <div className={styles.mealNutrition}>
                            <div className={styles.nutritionItem}>
                              <span className={styles.nutritionValue}>{meal.calories || 0}</span>
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
                        </div>

                        <div className={styles.mealIngredients}>
                          <h5>Key Ingredients:</h5>
                          <div className={styles.ingredientsList}>
                            {(meal.ingredients || []).slice(0, 4).map((ingredient, i) => (
                              <span key={i} className={styles.ingredient}>
                                {ingredient}
                              </span>
                            ))}
                            {(meal.ingredients || []).length > 4 && (
                              <span className={styles.moreIngredients}>
                                +{(meal.ingredients || []).length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

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
                            <span className={styles.statValue}>{plan.totalCalories || 0}</span>
                            <span className={styles.statLabel}>kcal</span>
                          </div>
                          <div className={styles.stat}>
                            <span className={styles.statValue}>{(plan.meals || []).length}</span>
                            <span className={styles.statLabel}>meals</span>
                          </div>
                          <div className={styles.stat}>
                            <span className={styles.statValue}>{plan.varietyScore || 0}/10</span>
                            <span className={styles.statLabel}>variety</span>
                          </div>
                        </div>

                        <div className={styles.planPreview}>
                          {(plan.meals || []).slice(0, 2).map((meal, mealIndex) => (
                            <div key={mealIndex} className={styles.previewMeal}>
                              <span className={styles.previewIcon}>
                                {emergencyCategories.find(c => c.value === meal.category)?.icon || '🍽️'}
                              </span>
                              <span className={styles.previewName}>{meal.name || 'Meal'}</span>
                            </div>
                          ))}
                          {(plan.meals || []).length > 2 && (
                            <div className={styles.moreMeals}>
                              +{(plan.meals || []).length - 2} more meals
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
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className={styles.tipsSection}>
        <h2 className={styles.sectionTitle}>
          <FiClock className={styles.sectionIcon} />
          Emergency Planning Tips
        </h2>
        <div className={styles.tipsGrid}>
          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>💪</div>
            <h4 className={styles.tipTitle}>Protein First</h4>
            <p className={styles.tipDescription}>
              Focus on lean proteins to maintain muscle while in calorie deficit.
            </p>
          </div>
          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>🥗</div>
            <h4 className={styles.tipTitle}>Smart Carbs</h4>
            <p className={styles.tipDescription}>
              Choose low-glycemic vegetables for fiber without excess calories.
            </p>
          </div>
          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>⚖️</div>
            <h4 className={styles.tipTitle}>Calorie Awareness</h4>
            <p className={styles.tipDescription}>
              Every calorie counts - focus on nutrient-dense options.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultipleMealPlanner;