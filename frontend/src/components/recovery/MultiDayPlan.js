import React, { useState, useEffect } from 'react';
import { FiCalendar, FiTrendingDown, FiActivity, FiTarget } from 'react-icons/fi';
import { recoveryService } from '../../services/recoveryService';
import styles from './MultiDayPlan.module.css';

const MultiDayPlan = ({ totalExcess, onClose }) => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (totalExcess > 0) {
      generatePlan();
    }
  }, [totalExcess]);

  const generatePlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await recoveryService.generateMultiDayPlan(totalExcess);
      setPlan(response.data);
    } catch (err) {
      setError('Failed to generate recovery plan');
      console.error('Multi-day plan generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.planCard}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Generating your recovery plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.planCard}>
        <div className={styles.error}>
          <FiTarget className={styles.errorIcon} />
          <p>{error}</p>
          <button onClick={generatePlan} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const { planDuration, totalExcess: planExcess, dailyReduction, dailyAdjustments, newMealAllocation } = plan;

  return (
    <div className={styles.planCard}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <FiCalendar className={styles.titleIcon} />
          <h3 className={styles.title}>3-Day Recovery Plan</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        )}
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryStats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total Excess:</span>
            <span className={styles.statValue}>{planExcess.toFixed(0)} kcal</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Daily Reduction:</span>
            <span className={styles.statValue}>{dailyReduction.toFixed(0)} kcal</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Duration:</span>
            <span className={styles.statValue}>{planDuration} days</span>
          </div>
        </div>
      </div>

      <div className={styles.dailyPlans}>
        {dailyAdjustments.map((day, index) => (
          <div key={day.day} className={styles.dayCard}>
            <div className={styles.dayHeader}>
              <div className={styles.dayTitle}>
                <FiCalendar className={styles.dayIcon} />
                <h4>Day {day.day}</h4>
              </div>
              <div className={styles.dayReduction}>
                <FiTrendingDown className={styles.reductionIcon} />
                <span>-{day.reduction} kcal</span>
              </div>
            </div>

            <div className={styles.dayContent}>
              <div className={styles.adjustedCalories}>
                <span className={styles.adjustedLabel}>Target Calories:</span>
                <span className={styles.adjustedValue}>{day.adjustedTDEE} kcal</span>
              </div>

              <div className={styles.mealBreakdown}>
                <h5>Meal Allocation:</h5>
                <div className={styles.mealGrid}>
                  {Object.entries(newMealAllocation).map(([meal, calories]) => (
                    <div key={meal} className={styles.mealItem}>
                      <span className={styles.mealName}>
                        {meal.charAt(0).toUpperCase() + meal.slice(1)}:
                      </span>
                      <span className={styles.mealCalories}>
                        {calories.toFixed(0)} kcal
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.exercise}>
                <h5>
                  <FiActivity className={styles.exerciseIcon} />
                  Recommended Exercise:
                </h5>
                <div className={styles.exerciseDetails}>
                  <div className={styles.exerciseItem}>
                    <span className={styles.exerciseType}>Primary:</span>
                    <span className={styles.exerciseValue}>{day.exercise.primary}</span>
                  </div>
                  <div className={styles.exerciseItem}>
                    <span className={styles.exerciseType}>Secondary:</span>
                    <span className={styles.exerciseValue}>{day.exercise.secondary}</span>
                  </div>
                  <div className={styles.exerciseRationale}>
                    <strong>Rationale:</strong> {day.exercise.rationale}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.disclaimer}>
          <FiTarget className={styles.disclaimerIcon} />
          <p>
            This plan is designed to help you recover from caloric excess while maintaining
            metabolic health. Consult with a healthcare professional before making significant
            dietary changes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MultiDayPlan;
