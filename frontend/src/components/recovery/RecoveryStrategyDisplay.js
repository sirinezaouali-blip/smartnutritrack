import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiTarget, FiActivity } from 'react-icons/fi';
import { recoveryService } from '../../services/recoveryService';
import styles from './RecoveryStrategyDisplay.module.css';

const RecoveryStrategyDisplay = ({
  currentMeal,
  consumptionData,
  onRecoveryAction
}) => {
  const [recoveryAssessment, setRecoveryAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentMeal && consumptionData) {
      assessRecovery();
    }
  }, [currentMeal, consumptionData]);

  const assessRecovery = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await recoveryService.assessRecovery(currentMeal, consumptionData);
      setRecoveryAssessment(response.data);
    } catch (err) {
      setError('Failed to assess recovery needs');
      console.error('Recovery assessment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getExceedanceBadge = (level) => {
    const badges = {
      minor: { text: 'Minor', color: '#8BC34A', icon: FiCheckCircle },
      moderate: { text: 'Moderate', color: '#FF9800', icon: FiTrendingUp },
      large: { text: 'Large', color: '#F44336', icon: FiAlertTriangle }
    };
    return badges[level] || badges.minor;
  };

  const handleRecoveryAction = (actionType) => {
    if (onRecoveryAction) {
      onRecoveryAction(actionType, recoveryAssessment);
    }
  };

  if (loading) {
    return (
      <div className={styles.recoveryCard}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Assessing recovery needs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.recoveryCard}>
        <div className={styles.error}>
          <FiAlertTriangle className={styles.errorIcon} />
          <p>{error}</p>
          <button onClick={assessRecovery} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!recoveryAssessment) {
    return null;
  }

  const { exceedanceData, recoveryData, requiresMultiDay, sportsEnhancement } = recoveryAssessment;
  const badge = getExceedanceBadge(exceedanceData?.level);

  return (
    <div className={styles.recoveryCard}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <FiTarget className={styles.titleIcon} />
          <h3 className={styles.title}>Recovery Strategy</h3>
        </div>
        {exceedanceData?.hasExceedance && (
          <div
            className={styles.exceedanceBadge}
            style={{ backgroundColor: badge.color }}
          >
            <badge.icon className={styles.badgeIcon} />
            <span>{badge.text} Exceedance</span>
          </div>
        )}
      </div>

      <div className={styles.content}>
        {exceedanceData?.hasExceedance ? (
          <div className={styles.exceedanceInfo}>
            <div className={styles.exceedanceStats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Exceeded by:</span>
                <span className={styles.statValue}>
                  {exceedanceData.percentage.toFixed(1)}%
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Extra calories:</span>
                <span className={styles.statValue}>
                  {exceedanceData.calories.toFixed(0)} kcal
                </span>
              </div>
            </div>

            <div className={styles.recoveryOptions}>
              {recoveryData.canRecover && (
                <button
                  className={`${styles.actionButton} ${styles.primary}`}
                  onClick={() => handleRecoveryAction('lowCarbHighProtein')}
                >
                  <FiActivity className={styles.buttonIcon} />
                  Low Carb High Protein Mode
                  <span className={styles.buttonDesc}>
                    Recover in remaining meals today
                  </span>
                </button>
              )}

              {requiresMultiDay && (
                <button
                  className={`${styles.actionButton} ${styles.secondary}`}
                  onClick={() => handleRecoveryAction('multiDayPlan')}
                >
                  <FiTrendingUp className={styles.buttonIcon} />
                  Multi-Day Recovery Plan
                  <span className={styles.buttonDesc}>
                    Spread recovery over 3 days
                  </span>
                </button>
              )}

              {sportsEnhancement && (
                <button
                  className={`${styles.actionButton} ${styles.sports}`}
                  onClick={() => handleRecoveryAction('sportsEnhancement')}
                >
                  <FiTarget className={styles.buttonIcon} />
                  Sports Enhancement
                  <span className={styles.buttonDesc}>
                    Athlete-specific recovery strategies
                  </span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.noExceedance}>
            <FiCheckCircle className={styles.successIcon} />
            <h4>You're on track!</h4>
            <p>Your {currentMeal} consumption is within healthy limits.</p>
            <button
              className={`${styles.actionButton} ${styles.free}`}
              onClick={() => handleRecoveryAction('freeSingle')}
            >
              Continue with Free Single Meal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecoveryStrategyDisplay;
