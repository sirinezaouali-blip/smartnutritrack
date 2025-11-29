import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { fetchAnalyticsData } from '../../services/analyticsService';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import ProgressChart from '../../components/charts/ProgressChart/ProgressChart';
import GaugeChart from '../../components/charts/GaugeChart/GaugeChart';
import PieChart from '../../components/charts/PieChart/PieChart';
import { 
  FiTarget, 
  FiCalendar, 
  FiBarChart2, 
  FiPieChart,
  FiActivity,
  FiZap,
  FiCoffee,
  FiDroplet,
  FiTrendingUp,
  FiAward
} from 'react-icons/fi';
import styles from './Analytics.module.css';

const Analytics = () => {
  const { userProfile } = useUser();
  
  const [analyticsData, setAnalyticsData] = useState({
    daily: null,
    weekly: null,
    monthly: null
  });
  const [selectedPeriod, setSelectedPeriod] = useState('daily'); // Changed to 'daily' as default
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [dailyResponse, weeklyResponse, monthlyResponse] = await Promise.all([
          fetchAnalyticsData('daily'),
          fetchAnalyticsData('weekly'),
          fetchAnalyticsData('monthly')
        ]);
        
        console.log('📊 Daily Analytics Data:', dailyResponse.data);
        console.log('📊 Weekly Analytics Data:', weeklyResponse.data);
        console.log('📊 Monthly Analytics Data:', monthlyResponse.data);
        
        if (dailyResponse.success && weeklyResponse.success && monthlyResponse.success) {
          setAnalyticsData({
            daily: dailyResponse.data,
            weekly: weeklyResponse.data,
            monthly: monthlyResponse.data
          });
        } else {
          setError('Failed to load analytics data');
        }

      } catch (error) {
        console.error('Analytics loading error:', error);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, []);

  const periods = [
    { value: 'daily', label: 'Daily', icon: <FiCalendar /> },
    { value: 'weekly', label: 'Weekly', icon: <FiBarChart2 /> },
    { value: 'monthly', label: 'Monthly', icon: <FiPieChart /> }
  ];

  const getCurrentData = () => {
    return analyticsData[selectedPeriod];
  };

  const getProgressPercentage = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const formatValue = (value, unit = '') => {
    if (value === null || value === undefined) return '--';
    if (typeof value === 'number') {
      // Format numbers with commas for thousands
      return `${value.toLocaleString()}${unit}`;
    }
    return `${value}${unit}`;
  };

  // Calculate macronutrient distribution
  const getMacroDistribution = () => {
    const currentData = getCurrentData();
    if (!currentData) return null;

    const proteinCalories = (currentData.proteinConsumed || 0) * 4;
    const carbsCalories = (currentData.carbsConsumed || 0) * 4;
    const fatsCalories = (currentData.fatsConsumed || 0) * 9;
    const totalCalories = proteinCalories + carbsCalories + fatsCalories;

    if (totalCalories === 0) return null;

    return {
      protein: Math.round((proteinCalories / totalCalories) * 100),
      carbs: Math.round((carbsCalories / totalCalories) * 100),
      fats: Math.round((fatsCalories / totalCalories) * 100)
    };
  };

  // Get achievement status
  const getAchievements = () => {
    const currentData = getCurrentData();
    const achievements = [];

    if (getProgressPercentage(currentData?.caloriesConsumed || 0, currentData?.caloriesTarget || 1) >= 100) {
      achievements.push({ icon: '🎯', text: 'Daily Calorie Goal Met' });
    }
    if (getProgressPercentage(currentData?.proteinConsumed || 0, currentData?.proteinTarget || 1) >= 100) {
      achievements.push({ icon: '💪', text: 'Protein Target Achieved' });
    }
    if (currentData?.mealCount >= 3) {
      achievements.push({ icon: '🍽️', text: '3+ Meals Tracked' });
    }
    if (currentData?.streak > 0) {
      achievements.push({ icon: '🔥', text: `${currentData.streak} Day Streak` });
    }

    return achievements;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" message="Loading your analytics..." />
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

  const currentData = getCurrentData();
  const macroDistribution = getMacroDistribution();
  const achievements = getAchievements();

  console.log('🔍 Current Analytics Data:', currentData);
  console.log('🎯 Current Period:', selectedPeriod);

  return (
    <div className={styles.analytics}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Nutrition Analytics</h1>
          <p className={styles.subtitle}>
            Track your progress and optimize your nutrition
          </p>
        </div>
        
        <div className={styles.periodSelector}>
          {periods.map(period => (
            <button
              key={period.value}
              className={`${styles.periodButton} ${selectedPeriod === period.value ? styles.active : ''}`}
              onClick={() => setSelectedPeriod(period.value)}
            >
              {period.icon}
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Section */}
      <div className={styles.metricsSection}>
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>
              <FiZap />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricValue}>
                {formatValue(currentData?.caloriesConsumed)}
              </div>
              <div className={styles.metricLabel}>Calories Consumed</div>
              <div className={styles.metricTarget}>
                Target: {formatValue(currentData?.caloriesTarget, ' kcal')}
              </div>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>
              <FiActivity />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricValue}>
                {formatValue(currentData?.mealCount)}
              </div>
              <div className={styles.metricLabel}>Meals Tracked</div>
              <div className={styles.metricTarget}>
                {selectedPeriod === 'daily' ? 'Today' : 'This period'}
              </div>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>
              <FiTrendingUp />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricValue}>
                {getProgressPercentage(currentData?.caloriesConsumed || 0, currentData?.caloriesTarget || 1)}%
              </div>
              <div className={styles.metricLabel}>Goal Progress</div>
              <div className={styles.metricTarget}>
                Overall completion
              </div>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>
              <FiAward />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricValue}>
                {achievements.length}
              </div>
              <div className={styles.metricLabel}>Achievements</div>
              <div className={styles.metricTarget}>
                Goals completed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Goal Progress Gauges */}
        <div className={styles.chartSection}>
          <h3 className={styles.chartTitle}>Nutrition Goals Progress</h3>
          <div className={styles.gaugesGrid}>
            <div className={styles.gaugeItem}>
              <GaugeChart
                value={currentData?.caloriesConsumed || 0}
                max={currentData?.caloriesTarget || 2000}
                label="Calories"
                color="#4CAF50"
                size={140}
              />
            </div>
            <div className={styles.gaugeItem}>
              <GaugeChart
                value={currentData?.proteinConsumed || 0}
                max={currentData?.proteinTarget || 150}
                label="Protein"
                color="#FF9800"
                size={140}
              />
            </div>
            <div className={styles.gaugeItem}>
              <GaugeChart
                value={currentData?.carbsConsumed || 0}
                max={currentData?.carbsTarget || 250}
                label="Carbs"
                color="#2196F3"
                size={140}
              />
            </div>
            <div className={styles.gaugeItem}>
              <GaugeChart
                value={currentData?.fatsConsumed || 0}
                max={currentData?.fatsTarget || 65}
                label="Fats"
                color="#9C27B0"
                size={140}
              />
            </div>
          </div>
        </div>

        {/* Progress Over Time */}
        <div className={styles.chartSection}>
          <h3 className={styles.chartTitle}>Progress Over Time</h3>
          <div className={styles.chartContainer}>
            <ProgressChart 
              data={currentData} 
              period={selectedPeriod}
              type="line"
            />
          </div>
        </div>

        {/* Macronutrient Distribution */}
        <div className={styles.chartSection}>
          <h3 className={styles.chartTitle}>Macronutrient Balance</h3>
          <div className={styles.chartContainer}>
            {macroDistribution ? (
              <PieChart
                data={{
                  labels: ['Protein', 'Carbs', 'Fats'],
                  values: [
                    macroDistribution.protein,
                    macroDistribution.carbs,
                    macroDistribution.fats
                  ]
                }}
                height={300}
              />
            ) : (
              <div className={styles.noData}>
                <p>Track meals to see your macro balance</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Achievements & Insights */}
      <div className={styles.insightsSection}>
        <h3 className={styles.sectionTitle}>Achievements & Insights</h3>
        <div className={styles.insightsGrid}>
          {achievements.length > 0 ? (
            achievements.map((achievement, index) => (
              <div key={index} className={styles.achievementCard}>
                <div className={styles.achievementIcon}>{achievement.icon}</div>
                <div className={styles.achievementText}>{achievement.text}</div>
              </div>
            ))
          ) : (
            <div className={styles.noAchievements}>
              <div className={styles.noAchievementsIcon}>🎯</div>
              <h4>Keep Going!</h4>
              <p>Track your meals consistently to unlock achievements</p>
            </div>
          )}
        </div>
      </div>

      {/* Nutrition Summary */}
      <div className={styles.summarySection}>
        <h3 className={styles.sectionTitle}>Nutrition Summary</h3>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <FiTarget className={styles.summaryIcon} />
              <h4>Calories</h4>
            </div>
            <div className={styles.summaryContent}>
              <div className={styles.summaryValue}>
                {formatValue(currentData?.caloriesConsumed)} / {formatValue(currentData?.caloriesTarget)}
              </div>
              <div className={styles.summaryUnit}>kcal</div>
              <div className={styles.summaryProgress}>
                <div 
                  className={styles.progressBar}
                  style={{ 
                    width: `${getProgressPercentage(currentData?.caloriesConsumed || 0, currentData?.caloriesTarget || 1)}%` 
                  }}
                />
              </div>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <FiActivity className={styles.summaryIcon} />
              <h4>Protein</h4>
            </div>
            <div className={styles.summaryContent}>
              <div className={styles.summaryValue}>
                {formatValue(currentData?.proteinConsumed)} / {formatValue(currentData?.proteinTarget)}
              </div>
              <div className={styles.summaryUnit}>grams</div>
              <div className={styles.summaryProgress}>
                <div 
                  className={styles.progressBar}
                  style={{ 
                    width: `${getProgressPercentage(currentData?.proteinConsumed || 0, currentData?.proteinTarget || 1)}%` 
                  }}
                />
              </div>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <FiCoffee className={styles.summaryIcon} />
              <h4>Carbs</h4>
            </div>
            <div className={styles.summaryContent}>
              <div className={styles.summaryValue}>
                {formatValue(currentData?.carbsConsumed)} / {formatValue(currentData?.carbsTarget)}
              </div>
              <div className={styles.summaryUnit}>grams</div>
              <div className={styles.summaryProgress}>
                <div 
                  className={styles.progressBar}
                  style={{ 
                    width: `${getProgressPercentage(currentData?.carbsConsumed || 0, currentData?.carbsTarget || 1)}%` 
                  }}
                />
              </div>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <FiDroplet className={styles.summaryIcon} />
              <h4>Fats</h4>
            </div>
            <div className={styles.summaryContent}>
              <div className={styles.summaryValue}>
                {formatValue(currentData?.fatsConsumed)} / {formatValue(currentData?.fatsTarget)}
              </div>
              <div className={styles.summaryUnit}>grams</div>
              <div className={styles.summaryProgress}>
                <div 
                  className={styles.progressBar}
                  style={{ 
                    width: `${getProgressPercentage(currentData?.fatsConsumed || 0, currentData?.fatsTarget || 1)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;



