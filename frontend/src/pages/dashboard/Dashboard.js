import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { fetchUserMeals, fetchAnalyticsData } from '../../services/analyticsService';
import { FiTarget, FiTrendingUp, FiActivity, FiClock, FiPlus, FiCamera, FiCalendar } from 'react-icons/fi';
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

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!userProfile) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch today's meals and analytics
        const [mealsResponse, analyticsResponse] = await Promise.all([
          fetchUserMeals(today),
          fetchAnalyticsData('today')
        ]);

        console.log('Meals Response:', mealsResponse, 'Analytics Response:', analyticsResponse
        );

        if (mealsResponse.success && analyticsResponse.success) {
          const mealsData = mealsResponse.data || {};
          setDashboardData({
            todayMeals: mealsData.meals || [],
            todayStats: {
              caloriesConsumed: analyticsResponse.data.caloriesConsumed || 0,
              proteinConsumed: analyticsResponse.data.proteinConsumed || 0,
              carbsConsumed: analyticsResponse.data.carbsConsumed || 0,
              fatsConsumed: analyticsResponse.data.fatsConsumed || 0,
              caloriesTarget: analyticsResponse.data.caloriesTarget || 2000,
              proteinTarget: analyticsResponse.data.proteinTarget || 150,
              carbsTarget: analyticsResponse.data.carbsTarget || 250,
              fatsTarget: analyticsResponse.data.fatsTarget || 65,
              waterIntake: analyticsResponse.data.waterIntake || 0,
              streak: analyticsResponse.data.streak || 0
            },
            weeklyProgress: null, // Placeholder - would need separate weekly call
            recentMeals: (mealsData.meals || []).slice(0, 5)
          });
        } else {
          setError('Failed to load dashboard data');
        }
      } catch (error) {
        console.error('Dashboard data loading error:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [userProfile]);

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
    if (!dashboardData.todayStats) return { status: 'neutral', message: 'No data available' };
    
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

  const calorieStatus = getCalorieStatus();

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
        </div>
      </div>

      {/* Progress Cards */}
      <div className={styles.progressSection}>
        <h2 className={styles.sectionTitle}>Today's Progress</h2>
        <div className={styles.progressCards}>
          <ProgressCard
            title="Calories"
            current={dashboardData.todayStats?.caloriesConsumed || 0}
            target={dashboardData.todayStats?.caloriesTarget || 2000}
            unit="kcal"
            icon={<FiTarget />}
            color="primary"
            status={calorieStatus.status}
            message={calorieStatus.message}
          />
          
          <ProgressCard
            title="Protein"
            current={dashboardData.todayStats?.proteinConsumed || 0}
            target={dashboardData.todayStats?.proteinTarget || 150}
            unit="g"
            icon={<FiActivity />}
            color="secondary"
          />
          
          <ProgressCard
            title="Carbs"
            current={dashboardData.todayStats?.carbsConsumed || 0}
            target={dashboardData.todayStats?.carbsTarget || 250}
            unit="g"
            icon={<FiTrendingUp />}
            color="tertiary"
          />
          
          <ProgressCard
            title="Fats"
            current={dashboardData.todayStats?.fatsConsumed || 0}
            target={dashboardData.todayStats?.fatsTarget || 65}
            unit="g"
            icon={<FiClock />}
            color="quaternary"
          />
        </div>
      </div>

      {/* Today's Meals */}
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
        
        <div className={styles.mealsList}>
          {dashboardData.todayMeals.length > 0 ? (
            dashboardData.todayMeals.map((meal) => (
              <MealItem
                key={meal.id}
                meal={meal}
                showTime={true}
                showCalories={true}
                compact={true}
                onEdit={(meal) => {
                  console.log('🚀 EDIT BUTTON CLICKED - UserMeal ID:', meal._id, 'Meal Object:', meal);
                  console.log('🔄 Attempting navigation to:', `/edit-user-meal/${meal._id}`);
                  // Navigate to edit user meal page with the UserMeal ID
                  navigate(`/edit-user-meal/${meal._id}`);
                }}
                onDelete={(meal) => {
                  // Handle delete meal
                  if (window.confirm(`Are you sure you want to delete "${meal.name}"?`)) {
                    // Call delete API
                    console.log('Delete meal:', meal._id);
                  }
                }}
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
      </div>

      {/* Quick Stats */}
      <div className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>Quick Stats</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiCalendar />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {dashboardData.todayMeals.length}
              </div>
              <div className={styles.statLabel}>Meals Today</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiTarget />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {dashboardData.todayStats?.waterIntake || 0}
              </div>
              <div className={styles.statLabel}>Glasses of Water</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiTrendingUp />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {dashboardData.todayStats?.streak || 0}
              </div>
              <div className={styles.statLabel}>Day Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.activitySection}>
        <h2 className={styles.sectionTitle}>Recent Activity</h2>
        <div className={styles.activityList}>
          {dashboardData.recentMeals.length > 0 ? (
            dashboardData.recentMeals.map((meal) => (
              <div key={meal.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>🍽️</div>
                <div className={styles.activityContent}>
                  <div className={styles.activityTitle}>
                    Logged {meal.name}
                  </div>
                  <div className={styles.activityTime}>
                    {new Date(meal.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <div className={styles.activityCalories}>
                  {meal.calories} kcal
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyActivity}>
              <p>No recent activity to show</p>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Progress Preview */}
      {dashboardData.weeklyProgress && (
        <div className={styles.weeklySection}>
          <h2 className={styles.sectionTitle}>This Week's Progress</h2>
          <div className={styles.weeklyChart}>
            {/* Placeholder for weekly chart - would integrate with Chart.js */}
            <div className={styles.chartPlaceholder}>
              <p>Weekly progress chart would be displayed here</p>
              <small>Integration with Chart.js for visualization</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;




