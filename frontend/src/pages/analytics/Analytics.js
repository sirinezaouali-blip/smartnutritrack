import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { fetchAnalyticsData } from '../../services/analyticsService';
import { FiTrendingUp, FiTarget, FiCalendar, FiBarChart2, FiPieChart } from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import ProgressChart from '../../components/charts/ProgressChart/ProgressChart';
import styles from './Analytics.module.css';

const Analytics = () => {
  const { userProfile } = useUser();
  const { t } = useLanguage();
  
  const [analyticsData, setAnalyticsData] = useState({
    daily: null,
    weekly: null,
    monthly: null
  });
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [dailyResponse, weeklyResponse, monthlyResponse] = await Promise.all([
          fetchAnalyticsData('daily'),
          fetchAnalyticsData('weekly'),
          fetchAnalyticsData('monthly')
        ]);
        
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

    loadAnalytics();
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

  const getTrendIcon = (trend) => {
    if (trend > 0) return { icon: '📈', color: '#4CAF50', text: 'Up' };
    if (trend < 0) return { icon: '📉', color: '#F44336', text: 'Down' };
    return { icon: '➡️', color: '#757575', text: 'Stable' };
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" message="Loading analytics..." />
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

  return (
    <div className={styles.analytics}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>
            Track your nutrition progress and insights
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

      {/* Overview Cards */}
      <div className={styles.overviewSection}>
        <h2 className={styles.sectionTitle}>Overview</h2>
        <div className={styles.overviewGrid}>
          <div className={styles.overviewCard}>
            <div className={styles.cardIcon}>
              <FiTarget />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValue}>
                {getProgressPercentage(currentData?.caloriesConsumed || 0, currentData?.caloriesTarget || 2000)}%
              </div>
              <div className={styles.cardLabel}>Calorie Goal</div>
              <div className={styles.cardSubtext}>
                {currentData?.caloriesConsumed || 0} / {currentData?.caloriesTarget || 2000} kcal
              </div>
            </div>
            <div className={styles.cardProgress}>
              <div 
                className={styles.progressBar}
                style={{ 
                  width: `${getProgressPercentage(currentData?.caloriesConsumed || 0, currentData?.caloriesTarget || 2000)}%` 
                }}
              />
            </div>
          </div>

          <div className={styles.overviewCard}>
            <div className={styles.cardIcon}>
              <FiTrendingUp />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValue}>
                {currentData?.averageCalories || 0}
              </div>
              <div className={styles.cardLabel}>Average Daily</div>
              <div className={styles.cardSubtext}>Calories consumed</div>
            </div>
            <div className={styles.cardTrend}>
              {currentData?.calorieTrend && (
                <div 
                  className={styles.trendIndicator}
                  style={{ color: getTrendIcon(currentData.calorieTrend).color }}
                >
                  {getTrendIcon(currentData.calorieTrend).icon} {getTrendIcon(currentData.calorieTrend).text}
                </div>
              )}
            </div>
          </div>

          <div className={styles.overviewCard}>
            <div className={styles.cardIcon}>
              <FiCalendar />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValue}>
                {currentData?.streak || 0}
              </div>
              <div className={styles.cardLabel}>Day Streak</div>
              <div className={styles.cardSubtext}>Consistent logging</div>
            </div>
          </div>
        </div>
      </div>

      {/* Macronutrient Breakdown */}
      <div className={styles.macrosSection}>
        <h2 className={styles.sectionTitle}>Macronutrient Breakdown</h2>
        <div className={styles.macrosGrid}>
          <div className={styles.macroCard}>
            <div className={styles.macroHeader}>
              <div className={styles.macroIcon} style={{ backgroundColor: '#FF9800' }}>
                💪
              </div>
              <div className={styles.macroInfo}>
                <div className={styles.macroName}>Protein</div>
                <div className={styles.macroAmount}>
                  {currentData?.proteinConsumed || 0}g / {currentData?.proteinTarget || 150}g
                </div>
              </div>
            </div>
            <div className={styles.macroProgress}>
              <div 
                className={styles.macroBar}
                style={{ 
                  width: `${getProgressPercentage(currentData?.proteinConsumed || 0, currentData?.proteinTarget || 150)}%`,
                  backgroundColor: '#FF9800'
                }}
              />
            </div>
          </div>

          <div className={styles.macroCard}>
            <div className={styles.macroHeader}>
              <div className={styles.macroIcon} style={{ backgroundColor: '#4CAF50' }}>
                🌾
              </div>
              <div className={styles.macroInfo}>
                <div className={styles.macroName}>Carbs</div>
                <div className={styles.macroAmount}>
                  {currentData?.carbsConsumed || 0}g / {currentData?.carbsTarget || 250}g
                </div>
              </div>
            </div>
            <div className={styles.macroProgress}>
              <div 
                className={styles.macroBar}
                style={{ 
                  width: `${getProgressPercentage(currentData?.carbsConsumed || 0, currentData?.carbsTarget || 250)}%`,
                  backgroundColor: '#4CAF50'
                }}
              />
            </div>
          </div>

          <div className={styles.macroCard}>
            <div className={styles.macroHeader}>
              <div className={styles.macroIcon} style={{ backgroundColor: '#2196F3' }}>
                🥑
              </div>
              <div className={styles.macroInfo}>
                <div className={styles.macroName}>Fats</div>
                <div className={styles.macroAmount}>
                  {currentData?.fatsConsumed || 0}g / {currentData?.fatsTarget || 65}g
                </div>
              </div>
            </div>
            <div className={styles.macroProgress}>
              <div 
                className={styles.macroBar}
                style={{ 
                  width: `${getProgressPercentage(currentData?.fatsConsumed || 0, currentData?.fatsTarget || 65)}%`,
                  backgroundColor: '#2196F3'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className={styles.chartSection}>
        <h2 className={styles.sectionTitle}>Progress Chart</h2>
        <div className={styles.chartContainer}>
          <ProgressChart 
            data={currentData} 
            period={selectedPeriod}
            type="line"
          />
        </div>
      </div>

      {/* Insights */}
      <div className={styles.insightsSection}>
        <h2 className={styles.sectionTitle}>Insights</h2>
        <div className={styles.insightsGrid}>
          <div className={styles.insightCard}>
            <div className={styles.insightIcon}>🎯</div>
            <h4 className={styles.insightTitle}>Goal Progress</h4>
            <p className={styles.insightDescription}>
              You're {getProgressPercentage(currentData?.caloriesConsumed || 0, currentData?.caloriesTarget || 2000)}% 
              of the way to your daily calorie goal.
            </p>
          </div>
          
          <div className={styles.insightCard}>
            <div className={styles.insightIcon}>📈</div>
            <h4 className={styles.insightTitle}>Trending Up</h4>
            <p className={styles.insightDescription}>
              Your consistency has improved by 15% compared to last week.
            </p>
          </div>
          
          <div className={styles.insightCard}>
            <div className={styles.insightIcon}>💡</div>
            <h4 className={styles.insightTitle}>Recommendation</h4>
            <p className={styles.insightDescription}>
              Consider adding more protein-rich foods to meet your daily target.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;




