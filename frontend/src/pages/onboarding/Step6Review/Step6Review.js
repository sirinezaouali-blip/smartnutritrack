import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import { FiArrowLeft, FiArrowRight, FiEdit, FiCheckCircle, FiTarget } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import { calculateHealthMetrics } from '../../../utils/calculations';
import styles from './Step6Review.module.css';

const Step6Review = () => {
  const { updateOnboarding, userProfile, loading } = useUser();
  const { user: authUser, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    // Only check authentication after loading is complete
    if (authLoading) {
      return; // Still loading, wait
    }
    
  
    // If loading is done but no user, then redirect to login
    if (!authUser) {
      console.log('No authenticated user found, redirecting to login');
      navigate('/login');
    }
  }, [authUser, authLoading, navigate]);


  const [healthMetrics, setHealthMetrics] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Load user data and calculate health metrics when component mounts

  // Calculate health metrics when user data changes
  useEffect(() => {
    if (userProfile?.onboarding?.basicInfo) {
      try {
        const { weight, height, age, gender, goal } = userProfile.onboarding.basicInfo;
        const { activityLevel } = userProfile.onboarding.lifestyle;

        if (!weight || !height || !age || !gender || !goal) {
          setHealthMetrics({ bmi: '', bmr: '', tdee: '', dailyCalories: '', proteinTarget: '', carbsTarget: '', fatsTarget: '' });
          return;
        }

        const metrics = calculateHealthMetrics({
          weight,
          height,
          age,
          gender,
          goal,
          activityLevel
        });
          console.log('Calculated Health Metrics:', metrics);
        setHealthMetrics(metrics);
      } catch (error) {
        console.error('Error calculating health metrics:', error);
        setErrors({ calculation: 'Error calculating health metrics. Please check your basic information.' });
      }
    }
  }, [userProfile]);

  // Wait for auth to load and user data to be available
  if (authLoading || (authUser && !userProfile)) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <LoadingSpinner size="large" message="Loading your information..." />
        </div>
      </div>
    );
  }

  // Don't render if no auth user (will be handled by useEffect redirect)
  if (!authLoading && !authUser) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      const result = await updateOnboarding({
        step: 6,
        data: healthMetrics
      });

      if (result.success) {
        navigate('/onboarding/confirmation');
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to complete setup. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/lifestyle');
  };

  const handleEditStep = (step) => {
    const stepRoutes = {
      1: '/onboarding/basic-info',
      2: '/onboarding/medical',
      3: '/onboarding/preferences',
      4: '/onboarding/lifestyle'
    };
    navigate(stepRoutes[step]);
  };

  const formatValue = (value, unit = '') => {
    if (value === null || value === undefined || value === '') return 'N/A';
    return `${value}${unit}`;
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { category: 'Underweight', color: '#2196F3' };
    if (bmi < 25) return { category: 'Normal', color: '#4CAF50' };
    if (bmi < 30) return { category: 'Overweight', color: '#FF9800' };
    return { category: 'Obese', color: '#F44336' };
  };

  const bmiCategory = healthMetrics ? getBMICategory(parseFloat(healthMetrics.bmi)) : null;

  return (
    <div className={styles.container}>
      <div className={styles.reviewCard}>
        {/* Progress Indicator */}
        <div className={styles.progressIndicator}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: '84%' }}></div>
          </div>
          <span className={styles.progressText}>Step 6 of 7</span>
        </div>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <FiCheckCircle />
          </div>
          <h2 className={styles.title}>Review Your Information</h2>
          <p className={styles.subtitle}>
            Please review all the information below. You can edit any section by clicking the edit button.
          </p>
        </div>

        {/* Review Content */}
        <div className={styles.reviewContent}>
          {/* Basic Information */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Basic Information</h3>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => handleEditStep(1)}
              >
                <FiEdit />
                Edit
              </button>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Age:</span>
                  <span className={styles.infoValue}>{userProfile.onboarding?.basicInfo?.age || 'N/A'} years</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Height:</span>
                  <span className={styles.infoValue}>{formatValue(userProfile.onboarding?.basicInfo?.height, ' cm')}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Weight:</span>
                  <span className={styles.infoValue}>{formatValue(userProfile.onboarding?.basicInfo?.weight, ' kg')}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Gender:</span>
                  <span className={styles.infoValue}>{userProfile.onboarding?.basicInfo?.gender || 'N/A'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Goal:</span>
                  <span className={styles.infoValue}>{userProfile.onboarding?.basicInfo?.goal || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Medical Information</h3>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => handleEditStep(2)}
              >
                <FiEdit />
                Edit
              </button>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Conditions:</span>
                  <span className={styles.infoValue}>
                    {userProfile.onboarding?.medical?.conditions?.length > 0
                      ? userProfile.onboarding.medical.conditions.join(', ')
                      : 'None'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Allergies:</span>
                  <span className={styles.infoValue}>
                    {userProfile.onboarding?.medical?.allergies?.length > 0
                      ? userProfile.onboarding.medical.allergies.join(', ')
                      : 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Dietary Preferences</h3>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => handleEditStep(3)}
              >
                <FiEdit />
                Edit
              </button>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Diet Type:</span>
                  <span className={styles.infoValue}>{userProfile.onboarding?.preferences?.dietType || 'None'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Disliked Foods:</span>
                  <span className={styles.infoValue}>
                    {userProfile.onboarding?.preferences?.dislikedFoods?.length > 0
                      ? userProfile.onboarding.preferences.dislikedFoods.join(', ')
                      : 'None'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Favorite Cuisine:</span>
                  <span className={styles.infoValue}>
                    {userProfile.onboarding?.preferences?.favoriteCuisine?.length > 0
                      ? userProfile.onboarding.preferences.favoriteCuisine.join(', ')
                      : 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lifestyle */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Lifestyle</h3>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => handleEditStep(4)}
              >
                <FiEdit />
                Edit
              </button>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Activity Level:</span>
                  <span className={styles.infoValue}>{userProfile.onboarding?.lifestyle?.activityLevel || 'N/A'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Sports:</span>
                  <span className={styles.infoValue}>
                    {userProfile.onboarding?.lifestyle?.sports?.length > 0
                      ? userProfile.onboarding.lifestyle.sports.join(', ')
                      : 'None'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Budget:</span>
                  <span className={styles.infoValue}>{userProfile.onboarding?.lifestyle?.budget || 'Medium'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Health Metrics */}
          {healthMetrics && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  <FiTarget className={styles.sectionIcon} />
                  Calculated Health Metrics
                </h3>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.metricsGrid}>
                  {/* Existing metrics */}
                  <div className={styles.metricCard}>
                    <div className={styles.metricValue}>{formatValue(healthMetrics.bmi)}</div>
                    <div className={styles.metricLabel}>BMI</div>
                    <div 
                      className={styles.metricCategory}
                      style={{ color: bmiCategory?.color }}
                    >
                      {bmiCategory?.category}
                    </div>
                  </div>
                  
                  <div className={styles.metricCard}>
                    <div className={styles.metricValue}>{formatValue(healthMetrics.bmr)}</div>
                    <div className={styles.metricLabel}>BMR</div>
                    <div className={styles.metricDescription}>calories/day</div>
                  </div>
                  
                  <div className={styles.metricCard}>
                    <div className={styles.metricValue}>{formatValue(healthMetrics.tdee)}</div>
                    <div className={styles.metricLabel}>TDEE</div>
                    <div className={styles.metricDescription}>calories/day</div>
                  </div>
                  
                  <div className={styles.metricCard}>
                    <div className={styles.metricValue}>{formatValue(healthMetrics.dailyCalories)}</div>
                    <div className={styles.metricLabel}>Daily Calories</div>
                    <div className={styles.metricDescription}>recommended</div>
                  </div>

                  {/* NEW: Macronutrient targets */}
                  <div className={styles.metricCard}>
                    <div className={styles.metricValue}>{formatValue(healthMetrics.proteinTarget)}</div>
                    <div className={styles.metricLabel}>Protein</div>
                    <div className={styles.metricDescription}>grams/day</div>
                  </div>
                  
                  <div className={styles.metricCard}>
                    <div className={styles.metricValue}>{formatValue(healthMetrics.carbsTarget)}</div>
                    <div className={styles.metricLabel}>Carbs</div>
                    <div className={styles.metricDescription}>grams/day</div>
                  </div>
                  
                  <div className={styles.metricCard}>
                    <div className={styles.metricValue}>{formatValue(healthMetrics.fatsTarget)}</div>
                    <div className={styles.metricLabel}>Fats</div>
                    <div className={styles.metricDescription}>grams/day</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calculation Error */}
          {errors.calculation && (
            <div className={styles.errorSection}>
              <div className={styles.errorMessage}>
                {errors.calculation}
              </div>
            </div>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className={styles.submitError}>
            {errors.submit}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className={styles.navigation}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBack}
            disabled={isSubmitting}
          >
            <FiArrowLeft className={styles.buttonIcon} />
            Back
          </button>
          
          <button
            type="submit"
            className={styles.nextButton}
            onClick={handleSubmit}
            disabled={isSubmitting || !healthMetrics}
          >
            {isSubmitting ? (
              <LoadingSpinner size="small" message="" />
            ) : (
              <>
                Complete Setup
                <FiArrowRight className={styles.buttonIcon} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step6Review;








