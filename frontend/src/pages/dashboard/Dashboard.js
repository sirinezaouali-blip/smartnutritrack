import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { deleteUserMeal,fetchUserMeals, fetchAnalyticsData } from '../../services/analyticsService';
import { FiTarget, FiTrendingUp, FiActivity, FiClock, FiPlus, FiCamera, FiCalendar, FiAlertTriangle } from 'react-icons/fi';
import ProgressCard from '../../components/common/ProgressCard/ProgressCard';
import MealItem from '../../components/common/MealItem/MealItem';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './Dashboard.module.css';


const Dashboard = () => {
  const navigate = useNavigate();
  const { userProfile, loading: userLoading } = useUser();
  const { t } = useLanguage();
  
  const [dashboardData, setDashboardData] = useState({
    todayMeals: [],
    todayStats: null,
    weeklyProgress: null,
    recentMeals: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebug, setShowDebug] = useState(true);
  
  // Use ref to track if we've already logged render info
  const renderCount = useRef(0);

  const addDebugLog = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };
    setDebugLogs(prev => [logEntry, ...prev].slice(0, 10));
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!userProfile) return;
      
      setLoading(true);
      setError(null);
      setDebugLogs([]);
      
      try {
        const today = new Date().toISOString().split('T')[0];
        
        addDebugLog('🔄 Starting data load for date:', today);
        addDebugLog('👤 User Profile Health Metrics:', userProfile?.onboarding?.healthMetrics);

        // Fetch today's meals and analytics
        const [mealsResponse, analyticsResponse] = await Promise.all([
          fetchUserMeals(today),
          fetchAnalyticsData('today')
        ]);

        addDebugLog('📊 Meals API Response success:', mealsResponse.success);
        addDebugLog('📈 Analytics API Response success:', analyticsResponse.success);

        if (mealsResponse.success && analyticsResponse.success) {
          const mealsData = mealsResponse.data || {};
          const analyticsData = analyticsResponse.data || {};
          
          addDebugLog('🍽️ Meals count:', mealsData.meals?.length || 0);
          addDebugLog('📊 Analytics data keys:', Object.keys(analyticsData));
          addDebugLog('🎯 Fat Target from Analytics:', analyticsData.fatsTarget);
          addDebugLog('🍽️ Fat Consumed from Analytics:', analyticsData.fatsConsumed);
          
          const todayStats = {
            caloriesConsumed: analyticsData.caloriesConsumed || 0,
            proteinConsumed: analyticsData.proteinConsumed || 0,
            carbsConsumed: analyticsData.carbsConsumed || 0,
            fatsConsumed: analyticsData.fatsConsumed || 0,
            caloriesTarget: analyticsData.caloriesTarget,
            proteinTarget: analyticsData.proteinTarget,
            carbsTarget: analyticsData.carbsTarget,
            fatsTarget: analyticsData.fatsTarget,
            waterIntake: analyticsData.waterIntake || 0,
            streak: analyticsData.streak || 0
          };

          addDebugLog('📋 Final Today Stats created');
          addDebugLog('🔍 Fat Target in Today Stats:', todayStats.fatsTarget);

          setDashboardData({
            todayMeals: mealsData.meals || [],
            todayStats: todayStats,
            weeklyProgress: null,
            recentMeals: (mealsData.meals || []).slice(0, 5)
          });
        } else {
          addDebugLog('❌ API responses failed');
          setError('Failed to load dashboard data');
        }
      } catch (error) {
        addDebugLog('❌ Data loading error:', error.message);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [userProfile]);

  // Add debug log when dashboardData updates - only once
  useEffect(() => {
    if (dashboardData.todayStats) {
      addDebugLog('🔄 Dashboard data updated with stats');
      addDebugLog('🎯 Current fat target:', dashboardData.todayStats?.fatsTarget);
      addDebugLog('🍽️ Current fat consumed:', dashboardData.todayStats?.fatsConsumed);
    }
  }, [dashboardData.todayStats]); // Only depend on todayStats, not the whole dashboardData

    // Add this NEW function after addDebugLog and before getGreeting
  const handleDeleteMeal = async (meal) => {
    if (!window.confirm(`Are you sure you want to delete "${meal.name}"?`)) {
      return;
    }

    try {
      addDebugLog('🗑️ Attempting to delete meal:', { mealId: meal._id, mealName: meal.name });
      
      const deleteResponse = await deleteUserMeal(meal._id);
      
      if (deleteResponse.success) {
        addDebugLog('✅ Meal deleted successfully');
        
        // Reload the dashboard data to reflect the changes
        const today = new Date().toISOString().split('T')[0];
        
        const [mealsResponse, analyticsResponse] = await Promise.all([
          fetchUserMeals(today),
          fetchAnalyticsData('today')
        ]);

        if (mealsResponse.success && analyticsResponse.success) {
          const mealsData = mealsResponse.data || {};
          const analyticsData = analyticsResponse.data || {};
          
          const todayStats = {
            caloriesConsumed: analyticsData.caloriesConsumed || 0,
            proteinConsumed: analyticsData.proteinConsumed || 0,
            carbsConsumed: analyticsData.carbsConsumed || 0,
            fatsConsumed: analyticsData.fatsConsumed || 0,
            caloriesTarget: analyticsData.caloriesTarget,
            proteinTarget: analyticsData.proteinTarget,
            carbsTarget: analyticsData.carbsTarget,
            fatsTarget: analyticsData.fatsTarget,
            waterIntake: analyticsData.waterIntake || 0,
            streak: analyticsData.streak || 0
          };

          setDashboardData({
            todayMeals: mealsData.meals || [],
            todayStats: todayStats,
            weeklyProgress: null,
            recentMeals: (mealsData.meals || []).slice(0, 5)
          });

          addDebugLog('🔄 Dashboard data refreshed after deletion');
        }
      } else {
        addDebugLog('❌ Failed to delete meal:', deleteResponse.error);
        alert('Failed to delete meal. Please try again.');
      }
    } catch (error) {
      addDebugLog('❌ Error deleting meal:', error.message);
      alert('Error deleting meal. Please try again.');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getProgressPercentage = (current, target) => {
    if (!target || target === 0) return 0;
    const percentage = Math.round((current / target) * 100);
    return isNaN(percentage) ? 0 : Math.min(percentage, 100);
  };

  const getCalorieStatus = () => {
    if (!dashboardData.todayStats?.caloriesTarget) return { status: 'neutral', message: 'Set your calorie target to track progress' };

    const { caloriesConsumed, caloriesTarget } = dashboardData.todayStats;
    const percentage = getProgressPercentage(caloriesConsumed, caloriesTarget);

    if (percentage >= 100) {
      return { status: 'excellent', message: 'Great job! You\'ve reached your goal!' };
    } else if (percentage >= 75) {
      return { status: 'good', message: 'You\'re doing well! Almost there.' };
    } else if (percentage >= 50) {
      return { status: 'okay', message: 'Good progress! Keep it up.' };
    } else {
      return { status: 'low', message: 'Keep going! You\'ve got this.' };
    }
  };

  const getProteinStatus = () => {
    if (!dashboardData.todayStats?.proteinTarget) return { status: 'neutral', message: 'Set your protein target to track progress' };

    const { proteinConsumed, proteinTarget } = dashboardData.todayStats;
    const percentage = getProgressPercentage(proteinConsumed, proteinTarget);

    if (percentage >= 100) {
      return { status: 'excellent', message: 'Great job! You\'ve reached your goal!' };
    } else if (percentage >= 75) {
      return { status: 'good', message: 'You\'re doing well! Almost there.' };
    } else if (percentage >= 50) {
      return { status: 'okay', message: 'Good progress! Keep it up.' };
    } else {
      return { status: 'low', message: 'Keep going! You\'ve got this.' };
    }
  };

  const getCarbsStatus = () => {
    if (!dashboardData.todayStats?.carbsTarget) return { status: 'neutral', message: 'Set your carbs target to track progress' };

    const { carbsConsumed, carbsTarget } = dashboardData.todayStats;
    const percentage = getProgressPercentage(carbsConsumed, carbsTarget);

    if (percentage >= 100) {
      return { status: 'excellent', message: 'Great job! You\'ve reached your goal!' };
    } else if (percentage >= 75) {
      return { status: 'good', message: 'You\'re doing well! Almost there.' };
    } else if (percentage >= 50) {
      return { status: 'okay', message: 'Good progress! Keep it up.' };
    } else {
      return { status: 'low', message: 'Keep going! You\'ve got this.' };
    }
  };

  const getFatsStatus = () => {
    // Don't call addDebugLog here to avoid re-renders during render
    if (!dashboardData.todayStats?.fatsTarget) {
      return { status: 'neutral', message: 'Set your fats target to track progress' };
    }

    const { fatsConsumed, fatsTarget } = dashboardData.todayStats;
    const percentage = getProgressPercentage(fatsConsumed, fatsTarget);

    if (percentage >= 100) {
      return { status: 'excellent', message: 'Great job! You\'ve reached your goal!' };
    } else if (percentage >= 75) {
      return { status: 'good', message: 'You\'re doing well! Almost there.' };
    } else if (percentage >= 50) {
      return { status: 'okay', message: 'Good progress! Keep it up.' };
    } else {
      return { status: 'low', message: 'Keep going! You\'ve got this.' };
    }
  };

  const formatValue = (value, unit = '') => {
    if (value === null || value === undefined) return '--';
    return `${value}${unit}`;
  };

  const calorieStatus = getCalorieStatus();

  // Log render count safely
  renderCount.current += 1;
  if (renderCount.current <= 5) { // Only log first few renders
    console.log(`🔄 Dashboard render #${renderCount.current}`);
  }

  if (userLoading || loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" message="Loading your dashboard..." />
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
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.greeting}>
          <h1 className={styles.greetingText}>
            {getGreeting()}, {userProfile?.firstName || 'there'}! 👋
          </h1>
          <p className={styles.greetingSubtext}>
            Ready to track your nutrition today?
          </p>
        </div>
        
        <div className={styles.quickActions}>
          <button
            className={styles.quickActionButton}
            onClick={() => navigate('/add-meal')}
          >
            <FiPlus />
            Add Meal
          </button>
          <button
            className={styles.quickActionButton}
            onClick={() => navigate('/scan-food')}
          >
            <FiCamera />
            Scan Food
          </button>
          {!showDebug && (
            <button
              className={styles.quickActionButton}
              onClick={() => setShowDebug(true)}
            >
              <FiAlertTriangle />
              Show Debug
            </button>
          )}
        </div>
      </div>

      {/* Progress Cards */}
      <div className={styles.progressSection}>
        <h2 className={styles.sectionTitle}>Today's Progress</h2>
        <div className={styles.progressCards}>
          <ProgressCard
            title="Calories"
            current={dashboardData.todayStats?.caloriesConsumed || 0}
            target={dashboardData.todayStats?.caloriesTarget}
            unit="kcal"
            icon={<FiTarget />}
            color="primary"
            status={calorieStatus.status}
            message={calorieStatus.message}
          />
          
          <ProgressCard
            title="Protein"
            current={dashboardData.todayStats?.proteinConsumed || 0}
            target={dashboardData.todayStats?.proteinTarget}
            unit="g"
            icon={<FiActivity />}
            color="secondary"
            status={getProteinStatus().status}
            message={getProteinStatus().message}
          />

          <ProgressCard
            title="Carbs"
            current={dashboardData.todayStats?.carbsConsumed || 0}
            target={dashboardData.todayStats?.carbsTarget}
            unit="g"
            icon={<FiTrendingUp />}
            color="tertiary"
            status={getCarbsStatus().status}
            message={getCarbsStatus().message}
          />

          <ProgressCard
            title="Fats"
            current={dashboardData.todayStats?.fatsConsumed || 0}
            target={dashboardData.todayStats?.fatsTarget}
            unit="g"
            icon={<FiClock />}
            color="quaternary"
            status={getFatsStatus().status}
            message={getFatsStatus().message}
          />
        </div>
      </div>

      {/* Rest of your Dashboard component */}
      <div className={styles.mealsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Today's Meals</h2>
          <button
            className={styles.addMealButton}
            onClick={() => navigate('/add-meal')}
          >
            <FiPlus />
            Add Meal
          </button>
        </div>
        
        <div className={styles.mealsContainer}>
          <div className={styles.mealsList}>
            {dashboardData.todayMeals.length > 0 ? (
              dashboardData.todayMeals.slice(0, 4).map((meal) => ( // Limit to 4 meals
                <MealItem
                  key={meal._id || meal.id}
                  meal={meal}
                  showTime={true}
                  showCalories={true}
                  showMacros={true} // Show all macros
                  compact={false} // Show full details
                  onEdit={(meal) => navigate(`/edit-user-meal/${meal._id}`)}
                  onDelete={handleDeleteMeal}
                />
              ))
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🍽️</div>
                <h3>No meals logged today</h3>
                <p>Start tracking your nutrition by adding your first meal!</p>
                <button
                  className={styles.emptyActionButton}
                  onClick={() => navigate('/add-meal')}
                >
                  <FiPlus />
                  Add Your First Meal
                </button>
              </div>
            )}
          </div>
          
          {/* Show "View All" if more than 4 meals */}
          {dashboardData.todayMeals.length > 4 && (
            <div className={styles.viewAllSection}>
              <button 
                className={styles.viewAllButton}
                onClick={() => navigate('/meal-history')} // Or create a dedicated page
              >
                View All {dashboardData.todayMeals.length} Meals
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;



