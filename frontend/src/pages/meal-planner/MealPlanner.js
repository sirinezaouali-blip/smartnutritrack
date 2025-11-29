import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { fetchMealPlans } from '../../services/mealService';
import { fetchAnalyticsData } from '../../services/analyticsService'; // ADD THIS IMPORT
import { FiCalendar, FiPlus, FiTarget, FiClock, FiUsers, FiUser, FiAlertTriangle } from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './MealPlanner.module.css';

const MealPlanner = () => {
  const { userProfile } = useUser();
  const { t } = useLanguage();
  
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // NEW: Emergency mode detection
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [remainingCalories, setRemainingCalories] = useState(0);
  const [todayStats, setTodayStats] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load meal plans and analytics in parallel
        const [plansResponse, analyticsResponse] = await Promise.all([
          fetchMealPlans(),
          fetchAnalyticsData('today') // NEW: Load today's stats
        ]);

        if (plansResponse.success) {
          setMealPlans(plansResponse.data);
        } else {
          setError('Failed to load meal plans');
        }

        // NEW: Check for emergency mode
        if (analyticsResponse.success) {
          const analyticsData = analyticsResponse.data || {};
          const todayStatsData = {
            caloriesConsumed: analyticsData.caloriesConsumed || 0,
            caloriesTarget: analyticsData.caloriesTarget
          };

          setTodayStats(todayStatsData);
          
          // Calculate remaining calories
          const dailyTarget = todayStatsData.caloriesTarget || 2000;
          const caloriesConsumed = todayStatsData.caloriesConsumed || 0;
          const remaining = dailyTarget - caloriesConsumed;
          
          setRemainingCalories(remaining);
          
          // Auto-activate emergency mode based on remaining calories
          const shouldActivateEmergency = remaining < 500;
          setEmergencyMode(shouldActivateEmergency);
        }
      } catch (error) {
        console.error('Data loading error:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const plannerTypes = [
    {
      title: 'Single Meal',
      description: 'Single meal type planner',
      icon: <FiUser />,
      link: '/meal-planner/single',
      color: 'primary',
      features: ['Quick planning', 'One meal focus', 'Simple interface'],
      disabledInEmergency: true // NEW: This card gets disabled in emergency mode
    },
    {
      title: 'Multiple Meal Planner',
      description: 'Plan your entire day', 
      icon: <FiCalendar />,
      link: '/meal-planner/daily',
      color: 'secondary',
      features: ['Full day planning', 'Meal balance', 'Nutrition overview'],
      disabledInEmergency: true // NEW: This card gets disabled in emergency mode
    },
    {
      title: 'Low carb, high protein meals',
      description: 'Plan for several days',
      icon: <FiTarget />,
      link: '/meal-planner/multiple',
      color: 'tertiary', 
      features: ['Weekly planning', 'Batch preparation', 'Advanced features'],
      disabledInEmergency: false // NEW: This card stays active in emergency mode
    }
  ];

  // NEW: Check if a card should be disabled
  const isCardDisabled = (plannerType) => {
    return emergencyMode && plannerType.disabledInEmergency;
  };

  // NEW: Get disabled message for cards
  const getDisabledMessage = () => {
    return `Only ${remainingCalories} calories remaining. Use Low Carb mode for optimal options.`;
  };

  const getUpcomingMeals = () => {
    const today = new Date();
    const upcoming = [];
    
    // Get today's meals
    const todayMeals = mealPlans.filter(plan => {
      const planDate = new Date(plan.date);
      return planDate.toDateString() === today.toDateString();
    });
    
    // Get next 2 days' meals
    for (let i = 1; i <= 2; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      
      const dayMeals = mealPlans.filter(plan => {
        const planDate = new Date(plan.date);
        return planDate.toDateString() === nextDate.toDateString();
      });
      
      if (dayMeals.length > 0) {
        upcoming.push({
          date: nextDate,
          meals: dayMeals
        });
      }
    }
    
    return upcoming;
  };

  const upcomingMeals = getUpcomingMeals();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" message="Loading meal planner..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mealPlanner}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Meal Planner</h1>
          <p className={styles.subtitle}>
            Plan your meals and achieve your nutrition goals
          </p>
        </div>
        
        <div className={styles.headerActions}>
          <Link to="/scan-food" className={styles.scanButton}>
            <FiPlus />
            Scan Food
          </Link>
        </div>
      </div>

      {/* NEW: Emergency Mode Banner */}
      {emergencyMode && todayStats && (
        <div className={styles.emergencyBanner}>
          <FiAlertTriangle />
          <div className={styles.emergencyContent}>
            <h3>Low Calorie Mode Detected</h3>
            <p>
              You have only <strong>{remainingCalories} calories</strong> remaining today. 
              Some planning options have been disabled for optimal results.
            </p>
          </div>
        </div>
      )}

      {/* Planner Types */}
      <div className={styles.plannerTypesSection}>
        <h2 className={styles.sectionTitle}>Choose Your Planning Style</h2>
        <div className={styles.plannerTypesGrid}>
          {plannerTypes.map((type, index) => {
            const isDisabled = isCardDisabled(type);
            
            return (
              <div 
                key={index} 
                className={`${styles.plannerTypeCard} ${isDisabled ? styles.inactive : ''}`}
              >
                {isDisabled && (
                  <div className={styles.tooltip}>
                    <div className={styles.disabledOverlay}>
                      <FiAlertTriangle />
                      <span>Limited Options</span>
                    </div>
                    <div className={styles.tooltiptext}>
                      {getDisabledMessage()}
                    </div>
                  </div>
                )}
                
                <div className={`${styles.typeIcon} ${styles[`color${type.color.charAt(0).toUpperCase() + type.color.slice(1)}`]}`}>
                  {type.icon}
                </div>
                
                <div className={styles.typeContent}>
                  <h3 className={styles.typeTitle}>{type.title}</h3>
                  <p className={styles.typeDescription}>{type.description}</p>
                  
                  <ul className={styles.typeFeatures}>
                    {type.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className={styles.typeFeature}>
                        <span className={styles.featureBullet}>•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className={styles.typeAction}>
                  {isDisabled ? (
                    <div className={styles.disabledAction}>
                      <span className={styles.disabledText}>Limited Access</span>
                      <div className={styles.lockIcon}>🔒</div>
                    </div>
                  ) : (
                    <Link to={type.link} className={styles.cardLink}>
                      <span className={styles.actionText}>Start Planning</span>
                      <div className={styles.actionArrow}>→</div>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>Your Planning Stats</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiCalendar />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {mealPlans.length}
              </div>
              <div className={styles.statLabel}>Meals Planned</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiTarget />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {userProfile?.onboarding?.healthMetrics?.dailyCalories || 2000}
              </div>
              <div className={styles.statLabel}>Daily Calorie Goal</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiClock />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {upcomingMeals.length}
              </div>
              <div className={styles.statLabel}>Days Planned Ahead</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Meals */}
      {upcomingMeals.length > 0 && (
        <div className={styles.upcomingSection}>
          <h2 className={styles.sectionTitle}>Upcoming Planned Meals</h2>
          <div className={styles.upcomingList}>
            {upcomingMeals.map((day, index) => (
              <div key={index} className={styles.upcomingDay}>
                <div className={styles.dayHeader}>
                  <h3 className={styles.dayTitle}>
                    {day.date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <span className={styles.mealCount}>
                    {day.meals.length} meals planned
                  </span>
                </div>
                
                <div className={styles.dayMeals}>
                  {day.meals.slice(0, 3).map((meal) => (
                    <div key={meal.id} className={styles.upcomingMeal}>
                      <div className={styles.mealIcon}>
                        {meal.mealType === 'breakfast' && '🌅'}
                        {meal.mealType === 'lunch' && '🌞'}
                        {meal.mealType === 'dinner' && '🌙'}
                        {meal.mealType === 'snack' && '🍎'}
                      </div>
                      <div className={styles.mealInfo}>
                        <div className={styles.mealName}>{meal.name}</div>
                        <div className={styles.mealCalories}>{meal.calories} kcal</div>
                      </div>
                    </div>
                  ))}
                  
                  {day.meals.length > 3 && (
                    <div className={styles.moreMeals}>
                      +{day.meals.length - 3} more meals
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className={styles.tipsSection}>
        <h2 className={styles.sectionTitle}>Planning Tips</h2>
        <div className={styles.tipsGrid}>
          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>💡</div>
            <h4 className={styles.tipTitle}>Start Small</h4>
            <p className={styles.tipDescription}>
              Begin with planning just one meal per day, then gradually increase.
            </p>
          </div>
          
          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>🎯</div>
            <h4 className={styles.tipTitle}>Set Goals</h4>
            <p className={styles.tipDescription}>
              Use your health metrics to set realistic nutrition targets.
            </p>
          </div>
          
          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>🔄</div>
            <h4 className={styles.tipTitle}>Stay Consistent</h4>
            <p className={styles.tipDescription}>
              Regular planning helps build healthy eating habits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlanner;



