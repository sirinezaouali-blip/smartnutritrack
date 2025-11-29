import React from 'react';
import { FiZap, FiTarget, FiClock, FiTrendingUp } from 'react-icons/fi';
import styles from './SportsEnhancement.module.css';

const SportsEnhancement = ({ activityLevel, macroType, exceedanceLevel, onClose }) => {
  // Sports enhancement data based on activity level and exceedance
  const getSportsData = () => {
    const enhancements = {
      moderate: {
        calorie: {
          exercise: '30-45 min cycling or swimming',
          intensity: 'Moderate (65-75% HRmax)',
          timing: 'Post-meal optimal',
          benefits: ['Enhanced fat oxidation', 'Improved insulin sensitivity', 'Metabolic boost']
        },
        protein: {
          exercise: 'Full body light resistance',
          timing: 'Within 2 hours of meal',
          focus: 'Muscle protein synthesis',
          benefits: ['Muscle repair', 'Recovery optimization', 'Performance maintenance']
        }
      },
      active: {
        calorie: {
          exercise: 'HIIT session 20-30min or sport-specific drills',
          intensity: 'High (75-85% HRmax)',
          timing: 'Can be same day',
          benefits: ['Accelerated calorie burn', 'Metabolic adaptation', 'Performance enhancement']
        },
        protein: {
          exercise: 'Targeted muscle group training',
          timing: 'Immediate post-meal',
          focus: 'Recovery and adaptation',
          benefits: ['Muscle hypertrophy', 'Strength gains', 'Injury prevention']
        }
      },
      extra: {
        calorie: {
          exercise: 'Sport-specific intense training',
          intensity: 'Competition level',
          timing: 'Integrated with training schedule',
          benefits: ['Peak performance', 'Competition readiness', 'Elite adaptation']
        },
        protein: {
          exercise: 'Performance-focused resistance',
          timing: 'Strategic throughout day',
          focus: 'Performance maintenance',
          benefits: ['Elite recovery', 'Strength optimization', 'Endurance enhancement']
        }
      }
    };

    return enhancements[activityLevel]?.[macroType] || enhancements.moderate.calorie;
  };

  const sportsData = getSportsData();

  const getActivityLevelInfo = () => {
    const levels = {
      moderate: {
        label: 'Moderate Activity',
        color: '#8BC34A',
        description: 'Regular exercise 3-5 days/week'
      },
      active: {
        label: 'Active Lifestyle',
        color: '#FF9800',
        description: 'Intense training 5-6 days/week'
      },
      extra: {
        label: 'Elite Athlete',
        color: '#F44336',
        description: 'Professional or high-performance training'
      }
    };
    return levels[activityLevel] || levels.moderate;
  };

  const activityInfo = getActivityLevelInfo();

  return (
    <div className={styles.enhancementCard}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <FiZap className={styles.titleIcon} />
          <h3 className={styles.title}>Sports Enhancement</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        )}
      </div>

      <div className={styles.activityLevel}>
        <div
          className={styles.levelBadge}
          style={{ backgroundColor: activityInfo.color }}
        >
          <FiTarget className={styles.levelIcon} />
          <span>{activityInfo.label}</span>
        </div>
        <p className={styles.levelDescription}>{activityInfo.description}</p>
      </div>

      <div className={styles.enhancementContent}>
        <div className={styles.mainExercise}>
          <h4 className={styles.sectionTitle}>
            <FiTrendingUp className={styles.sectionIcon} />
            Recommended Exercise
          </h4>
          <div className={styles.exerciseCard}>
            <div className={styles.exercisePrimary}>
              <h5>{sportsData.exercise}</h5>
              {sportsData.intensity && (
                <p className={styles.intensity}>Intensity: {sportsData.intensity}</p>
              )}
            </div>
            <div className={styles.exerciseTiming}>
              <FiClock className={styles.timingIcon} />
              <span>{sportsData.timing}</span>
            </div>
          </div>
        </div>

        {sportsData.focus && (
          <div className={styles.focusArea}>
            <h4 className={styles.sectionTitle}>Training Focus</h4>
            <div className={styles.focusCard}>
              <p className={styles.focusText}>{sportsData.focus}</p>
            </div>
          </div>
        )}

        <div className={styles.benefits}>
          <h4 className={styles.sectionTitle}>Performance Benefits</h4>
          <div className={styles.benefitsList}>
            {sportsData.benefits.map((benefit, index) => (
              <div key={index} className={styles.benefitItem}>
                <div className={styles.benefitDot}></div>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.nutritionTips}>
          <h4 className={styles.sectionTitle}>Nutrition Optimization</h4>
          <div className={styles.tipsCard}>
            <div className={styles.tip}>
              <strong>Pre-Exercise:</strong> Consume carbohydrates 2-3 hours before training for optimal energy.
            </div>
            <div className={styles.tip}>
              <strong>During Exercise:</strong> For sessions >90min, consume 30-60g carbs per hour.
            </div>
            <div className={styles.tip}>
              <strong>Post-Exercise:</strong> Protein-rich meal within 30-60min for recovery.
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.disclaimer}>
          <FiTarget className={styles.disclaimerIcon} />
          <p>
            These recommendations are tailored to your activity level. Always listen to your body
            and consult with a sports nutritionist or coach for personalized advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SportsEnhancement;
