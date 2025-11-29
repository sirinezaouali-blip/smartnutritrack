import React, { useState, useEffect } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { generateDailyMealPlan } from '../../../services/aiService';
import { FiCalendar, FiTarget, FiClock, FiPlus, FiCheck, FiRefreshCw, FiChevronRight, FiShoppingBag } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './DailyMealPlanner.module.css';
import { generateFlaskMealPlan, checkMealPlanStatus } from '../../../services/mealService';
import { useNavigate } from 'react-router-dom';

const DailyMealPlanner = () => {
  const { userProfile } = useUser();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    mealType: 'breakfast',
    wantedMeal: '',
    preferences: ''
  });
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Update the state for selected meals to store full objects
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

  const calculateRemainingCalories = () => {
    const healthMetrics = userProfile?.onboarding?.healthMetrics;
    if (!healthMetrics) return 2000;
    return healthMetrics.dailyCalories || 2000;
  };

  const transformFlaskResponse = (flaskData) => {
    console.log('🔄 Transforming Flask response:', flaskData);
    
    // Transform Flask API response to frontend format
    const mealPlan = {
      status: 'completed',
      totalCalories: flaskData.macro_summary?.remaining?.calories || 0,
      macroSummary: flaskData.macro_summary,
      meals: []
    };

    // Transform meal options to frontend format
    if (flaskData.meal_plan) {
      Object.entries(flaskData.meal_plan).forEach(([mealType, mealData]) => {
        console.log(`📊 Processing ${mealType}:`, mealData);
        
        if (mealData.options && mealData.options.length > 0) {
          mealData.options.forEach((option, index) => {
            // Handle items array properly - it might be undefined or have different structure
            let itemsArray = [];
            
            if (option.items && Array.isArray(option.items)) {
              // Extract food names from items array
              itemsArray = option.items.map(item => {
                if (typeof item === 'string') {
                  return item;
                } else if (item && item.food_name) {
                  return item.food_name;
                }
                return 'Unknown item';
              });
            } else if (option.items_list) {
              // If items_list is already a string, split it
              itemsArray = option.items_list.split(', ');
            }
            
            const mealOption = {
              mealType: mealType,
              name: option.food_name || 'Unknown Food',
              description: `${option.type || 'meal'} - ${option.total_calories || 0} kcal`,
              calories: option.total_calories || 0,
              protein: option.total_protein_g || 0,
              carbs: option.total_carbs_g || 0,
              fat: option.total_fat_g || 0,
              type: option.type || 'single',
              items: itemsArray, // This is now guaranteed to be an array
              rank: index + 1
            };
            
            console.log(`🍽️ Created meal option:`, mealOption);
            mealPlan.meals.push(mealOption);
          });
        }
      });
    }

    console.log('✅ Final transformed meal plan:', mealPlan);
    return mealPlan;
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
        user_input: formData.wantedMeal,
        user_profile: {
          goals: userProfile?.onboarding?.basicInfo?.goal || "maintain weight",
          avoid_categories: preferences.dislikedFoods || [],
          target_calories: remainingCalories
        }
      };

      console.log('🚀 Sending request to Flask API:', requestData);
      const response = await generateFlaskMealPlan(
        requestData.user_input,
        requestData.user_profile
      );

      console.log('📨 Flask API Response:', response);

      if (response.success) {
        if (response.data.status === 'processing') {
          // Background processing - show waiting message
          setMealPlan({
            status: 'processing',
            message: 'AI is generating your personalized meal plan...',
            user_input: formData.wantedMeal,
            requestId: response.data.requestId
          });
          
          console.log('🔄 Starting polling for requestId:', response.data.requestId);
          
          // Poll every 10 seconds for the completed meal plan
          const pollInterval = setInterval(async () => {
            try {
              const statusResponse = await checkMealPlanStatus(response.data.requestId);
              console.log('📊 Polling status:', statusResponse.data.status);
              
              if (statusResponse.data.status === 'completed') {
                clearInterval(pollInterval);
                console.log('✅ Meal plan ready!', statusResponse.data.result);
                setMealPlan(transformFlaskResponse(statusResponse.data.result));
                setLoading(false);
              } else if (statusResponse.data.status === 'failed') {
                clearInterval(pollInterval);
                setError('Meal plan generation failed: ' + (statusResponse.data.result?.error || 'Unknown error'));
                setLoading(false);
                setMealPlan(null); // Clear the processing state
}
              // If still processing, continue polling...
            } catch (pollError) {
              console.error('Polling error:', pollError);
              // Don't stop polling on temporary errors
            }
          }, 10000); // Check every 10 seconds

          // Stop polling after 25 minutes (1500 seconds)
          setTimeout(() => {
            clearInterval(pollInterval);
            console.log('⏰ Polling timeout after 25 minutes');
          }, 25 * 60 * 1000);
          
        } else {
          // Immediate response (shouldn't happen with current setup)
          setMealPlan(transformFlaskResponse(response.data));
          setLoading(false);
        }
      } else {
        setError('Failed to generate meal plan');
        setLoading(false);
      }
    } catch (error) {
      console.error('Meal plan generation error:', error);
      setError('Failed to generate meal plan. Please try again.');
      setLoading(false);
    }
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

  // Update the toggle function
const toggleMealSelection = (meal, mealType, index) => {
  const mealId = `${mealType}-${index}`;
  
  setSelectedMeals(prev => {
    const isSelected = prev.some(selected => selected.id === mealId);
    
    if (isSelected) {
      return prev.filter(selected => selected.id !== mealId);
    } else {
      return [...prev, {
        id: mealId,
        ...meal,
        mealType: mealType,
        quantity: 1,
        price: parseFloat(calculateMealPrice(meal.calories))
      }];
    }
  });
};

// Add to cart function
const addSelectedMealsToCart = () => {
  // Get current cart from localStorage
  const currentCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
  
  // Add selected meals to cart
  const updatedCart = [...currentCart, ...selectedMeals];
  
  // Save to localStorage
  localStorage.setItem('cartItems', JSON.stringify(updatedCart));
  
  // Navigate to cart
  navigate('/cart');
  
  // Show success message
  alert(`${selectedMeals.length} meals added to your cart!`);
};

// Helper function for pricing (optional)
const calculateMealPrice = (calories) => {
  return Number((calories * 0.02).toFixed(2));
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
                'Generating Plan...'
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
      {/* Meal Plan Results - IMPROVED UX */}
      {mealPlan && mealPlan.status === 'completed' && (
        <div className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.sectionTitle}>Your Daily Meal Plan</h2>
          </div>

          {/* Macro Summary - MOVED OUTSIDE resultsHeader */}
          {mealPlan.macroSummary && (
            <div className={styles.macroSummary}>
              <h3>Daily Nutrition Summary</h3>
              <div className={styles.macroGrid}>
                <div className={styles.macroCard}>
                  <div className={styles.macroLabel}>Already Consumed</div>
                  <div className={styles.macroValue}>{mealPlan.macroSummary.consumed.calories} kcal</div>
                  <div className={styles.macroDetails}>
                    P: {mealPlan.macroSummary.consumed.protein_g}g • F: {mealPlan.macroSummary.consumed.fat_g}g • C: {mealPlan.macroSummary.consumed.carbs_g}g
                  </div>
                </div>
                <div className={styles.macroCard}>
                  <div className={styles.macroLabel}>Remaining Target</div>
                  <div className={styles.macroValue}>{mealPlan.macroSummary.remaining.calories} kcal</div>
                  <div className={styles.macroDetails}>
                    P: {mealPlan.macroSummary.remaining.protein_g}g • F: {mealPlan.macroSummary.remaining.fat_g}g • C: {mealPlan.macroSummary.remaining.carbs_g}g
                  </div>
                </div>
                <div className={styles.macroCard}>
                  <div className={styles.macroLabel}>Meals to Plan</div>
                  <div className={styles.macroValue}>{mealPlan.macroSummary.remaining_meals.length}</div>
                  <div className={styles.macroDetails}>
                    {mealPlan.macroSummary.remaining_meals.join(', ')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Meal Selection Cards */}
          <div className={styles.mealSelection}>
            {mealPlan.macroSummary?.meal_allocations && Object.entries(mealPlan.macroSummary.meal_allocations).map(([mealType, allocation]) => {
              if (allocation.calories === 0) return null; // Skip breakfast if already eaten
              
              const mealOptions = mealPlan.meals.filter(meal => meal.mealType === mealType);
              
              return (
                <div key={mealType} className={styles.mealCategory}>
                  <div className={styles.categoryHeader}>
                    <h3 className={styles.categoryTitle}>
                      {mealType.charAt(0).toUpperCase() + mealType.slice(1)} Options
                    </h3>
                    <div className={styles.categoryTarget}>
                      Target: {allocation.calories} kcal • P: {allocation.protein_g}g • F: {allocation.fat_g}g • C: {allocation.carbs_g}g
                    </div>
                  </div>
                  
                  <div className={styles.mealCards}>
                    {mealOptions.map((option, index) => (
                      <div
                        key={index}
                        className={`${styles.mealCard} ${
                          selectedMeals.some(selected => selected.id === `${mealType}-${index}`) ? styles.selected : ''
                        }`}
                        onClick={() => toggleMealSelection(option, mealType, index)}
                      >
                        <div className={styles.mealCardHeader}>
                          <div className={styles.mealRank}>#{option.rank}</div>
                          <div className={styles.mealTypeBadge}>{option.type}</div>
                        </div>
                        
                        <h4 className={styles.mealName}>{option.name}</h4>
                        
                        <div className={styles.mealNutrition}>
                          <div className={styles.nutritionItem}>
                            <span className={styles.nutritionValue}>{option.calories}</span>
                            <span className={styles.nutritionLabel}>kcal</span>
                          </div>
                          <div className={styles.nutritionItem}>
                            <span className={styles.nutritionValue}>{option.protein}g</span>
                            <span className={styles.nutritionLabel}>protein</span>
                          </div>
                          <div className={styles.nutritionItem}>
                            <span className={styles.nutritionValue}>{option.carbs}g</span>
                            <span className={styles.nutritionLabel}>carbs</span>
                          </div>
                          <div className={styles.nutritionItem}>
                            <span className={styles.nutritionValue}>{option.fat}g</span>
                            <span className={styles.nutritionLabel}>fat</span>
                          </div>
                        </div>
                        
                        {option.items && option.items.length > 0 && (
                          <div className={styles.mealIngredients}>
                            <strong>Contains:</strong> {option.items.join(', ')}
                          </div>
                        )}
                        
                        <div className={styles.selectionIndicator}>
                          {selectedMeals.some(selected => selected.id === `${mealType}-${index}`) ? '✓ Selected' : 'Click to select'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className={styles.resultsActions}>
            <button
              onClick={addSelectedMealsToCart}
              disabled={selectedMeals.length === 0}
              className={styles.addToCartButton}
            >
              <FiShoppingBag />
              Add {selectedMeals.length} Selected Meals to Cart
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

      {/* Processing State */}
      {mealPlan && mealPlan.status === 'processing' && (
        <div className={styles.processingSection}>
          <div className={styles.processingCard}>
            <LoadingSpinner size="large" />
            <h3>Generating Your Meal Plan</h3>
            <p>{mealPlan.message}</p>
            <p className={styles.processingNote}>
              This may take a few minutes. Your personalized meal plan will be ready soon!
            </p>
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