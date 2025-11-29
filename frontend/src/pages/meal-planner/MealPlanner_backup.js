import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { fetchMealPlans } from '../../services/mealService';
import { FiCalendar, FiPlus, FiTarget, FiClock, FiUsers, FiUser, FiHeart } from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './MealPlanner.module.css';

const MealPlanner = () => {
  const { userProfile } = useUser();
  const { t } = useLanguage();
  
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMealPlans = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchMealPlans();
        if (response.success) {
          setMealPlans(response.data);
        } else {
          setError('Failed to load meal plans');
        }
      } catch (error) {
        console.error('Meal plans loading error:', error);
        setError('Failed to load meal plans');
      } finally {
        setLoading(false);
      }
    };

    loadMealPlans();
  }, []);

  const [activeCard, setActiveCard] = useState(null);

  const plannerTypes = [
    {
      title: "Low carb high protein single meal type choices",
      description: 'Plan one meal at a time with low carb, high protein focus',
      icon: <FiUser />,
      link: '/meal-planner/single',
      color: 'primary',
      features: ['Low carb focus', 'High protein', 'Simple interface'],
      id: 'low-carb'
    },
    {
      title: 'Multiple daily planning choices',
      description: 'Plan your entire day',
      icon: <FiCalendar />,
      link: '/meal-planner/daily',
      color: 'secondary',
      features: ['Full day planning', 'Meal balance', 'Nutrition overview'],
      id: 'multiple-daily'
    },
    {
      title: 'Free single meal type choices',
      description: 'Plan any meal without restrictions',
      icon: <FiHeart />,
      link: '/meal-planner/free',
      color: 'tertiary',
      features: ['Any cuisine', 'No restrictions', 'Flexible planning'],
      id: 'free-meal'
    }
  ];

  const handleCardClick = (cardId) => {
    // Mutual exclusivity: if clicking on low-carb or multiple-daily, deactivate the other
    if (cardId === 'low-carb' || cardId === 'multiple-daily') {
      setActiveCard(activeCard === cardId ? null : cardId);
    } else {
      // Free meal can be active independently
      setActiveCard(activeCard === cardId ? null : cardId);
    }
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

      {/* Planner Types */}
      <div className={styles.plannerTypesSection}>
        <h2 className={styles.sectionTitle}>Choose Your Planning Style</h2>
        <div className={styles.plannerTypesGrid}>
          {plannerTypes.map((type, index) => (
            <Link
              key={index}
              to={type.link}
              className={`${styles.plannerTypeCard} ${activeCard === type.id ? styles.active : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleCardClick(type.id);
              }}
            >
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
                <span className={styles.actionText}>Start Planning</span>
                <div className={styles.actionArrow}>→</div>
              </div>
            </Link>
          ))}
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




