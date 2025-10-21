import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ACTIVITY_LEVELS, SPORTS_ACTIVITIES, BUDGET_LEVELS } from '../../../utils/constants';
import { FiArrowLeft, FiArrowRight, FiActivity, FiDollarSign } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './Step5Lifestyle.module.css';

const Step5Lifestyle = () => {
  const { updateOnboarding, userProfile, loading } = useUser();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [lifestyleData, setLifestyleData] = useState({
    activityLevel: '',
    sports: [],
    budget: 'medium'
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing data if available
  useEffect(() => {
    if (userProfile?.onboarding?.lifestyle) {
      const lifestyle = userProfile.onboarding.lifestyle;
      setLifestyleData({
        activityLevel: lifestyle.activityLevel || '',
        sports: lifestyle.sports || [],
        budget: lifestyle.budget || 'medium'
      });
    }
  }, [userProfile]);

  const handleActivityLevelChange = (activityLevel) => {
    setLifestyleData(prev => ({
      ...prev,
      activityLevel
    }));
    
    if (errors.activityLevel) {
      setErrors(prev => ({ ...prev, activityLevel: '' }));
    }
  };

  const handleSportChange = (sport) => {
    setLifestyleData(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport]
    }));
  };

  const handleBudgetChange = (budget) => {
    setLifestyleData(prev => ({
      ...prev,
      budget
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Activity level is required
    if (!lifestyleData.activityLevel) {
      newErrors.activityLevel = 'Please select your activity level';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await updateOnboarding({
        step: 5,
        data: lifestyleData
      });
      
      if (result.success) {
        navigate('/onboarding/review');
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to save information. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/preferences');
  };

  const handleSkip = () => {
    // Set default values and continue
    setLifestyleData({
      activityLevel: 'moderate',
      sports: [],
      budget: 'medium'
    });
    navigate('/onboarding/review');
  };

  const getActivityLevelDescription = (level) => {
    const descriptions = {
      sedentary: 'Little or no exercise',
      light: 'Light exercise 1-3 days/week',
      moderate: 'Moderate exercise 3-5 days/week',
      active: 'Heavy exercise 6-7 days/week',
      very_active: 'Very heavy exercise, physical job'
    };
    return descriptions[level] || '';
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        {/* Progress Indicator */}
        <div className={styles.progressIndicator}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: '70%' }}></div>
          </div>
          <span className={styles.progressText}>Step 5 of 7</span>
        </div>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <FiActivity />
          </div>
          <h2 className={styles.title}>Lifestyle Information</h2>
          <p className={styles.subtitle}>
            Help us understand your daily activity level and preferences
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Activity Level */}
          <div className={styles.field}>
            <label className={styles.label}>Activity Level *</label>
            <div className={styles.activityGrid}>
              {Object.values(ACTIVITY_LEVELS).map(level => (
                <label key={level} className={styles.activityOption}>
                  <input
                    type="radio"
                    name="activityLevel"
                    value={level}
                    checked={lifestyleData.activityLevel === level}
                    onChange={(e) => handleActivityLevelChange(e.target.value)}
                    disabled={isSubmitting}
                    className={styles.radioInput}
                  />
                  <div className={styles.activityCard}>
                    <div className={styles.activityIcon}>
                      {level === 'sedentary' && '🪑'}
                      {level === 'light' && '🚶'}
                      {level === 'moderate' && '🏃'}
                      {level === 'active' && '💪'}
                      {level === 'very_active' && '🏋️'}
                    </div>
                    <div className={styles.activityContent}>
                      <div className={styles.activityTitle}>
                        {level === 'sedentary' && 'Sedentary'}
                        {level === 'light' && 'Light'}
                        {level === 'moderate' && 'Moderate'}
                        {level === 'active' && 'Active'}
                        {level === 'very_active' && 'Very Active'}
                      </div>
                      <div className={styles.activityDescription}>
                        {getActivityLevelDescription(level)}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.activityLevel && <span className={styles.error}>{errors.activityLevel}</span>}
          </div>

          {/* Sports & Activities */}
          <div className={styles.field}>
            <label className={styles.label}>Sports & Activities (Optional)</label>
            <p className={styles.fieldDescription}>
              Select activities you regularly participate in
            </p>
            <div className={styles.sportsGrid}>
              {SPORTS_ACTIVITIES.map(sport => (
                <label key={sport} className={styles.sportOption}>
                  <input
                    type="checkbox"
                    checked={lifestyleData.sports.includes(sport)}
                    onChange={() => handleSportChange(sport)}
                    disabled={isSubmitting}
                    className={styles.checkboxInput}
                  />
                  <div className={styles.sportCard}>
                    <div className={styles.sportIcon}>
                      {sport === 'Running' && '🏃'}
                      {sport === 'Swimming' && '🏊'}
                      {sport === 'Cycling' && '🚴'}
                      {sport === 'Weightlifting' && '🏋️'}
                      {sport === 'Yoga' && '🧘'}
                      {sport === 'Pilates' && '🤸'}
                      {sport === 'Basketball' && '🏀'}
                      {sport === 'Football' && '⚽'}
                      {sport === 'Tennis' && '🎾'}
                      {sport === 'Soccer' && '⚽'}
                      {sport === 'Hiking' && '🥾'}
                      {sport === 'Dancing' && '💃'}
                      {sport === 'Boxing' && '🥊'}
                      {sport === 'Martial Arts' && '🥋'}
                      {sport === 'Rock Climbing' && '🧗'}
                      {sport === 'Other' && '🏃‍♂️'}
                    </div>
                    <span className={styles.sportLabel}>{sport}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Budget Preference */}
          <div className={styles.field}>
            <label className={styles.label}>Budget Preference (Optional)</label>
            <p className={styles.fieldDescription}>
              Help us suggest meals within your budget range
            </p>
            <div className={styles.budgetGrid}>
              {Object.values(BUDGET_LEVELS).map(budget => (
                <label key={budget} className={styles.budgetOption}>
                  <input
                    type="radio"
                    name="budget"
                    value={budget}
                    checked={lifestyleData.budget === budget}
                    onChange={(e) => handleBudgetChange(e.target.value)}
                    disabled={isSubmitting}
                    className={styles.radioInput}
                  />
                  <div className={styles.budgetCard}>
                    <div className={styles.budgetIcon}>
                      {budget === 'low' && '💰'}
                      {budget === 'medium' && '💵'}
                      {budget === 'high' && '💎'}
                    </div>
                    <div className={styles.budgetContent}>
                      <div className={styles.budgetTitle}>
                        {budget === 'low' && 'Low Budget'}
                        {budget === 'medium' && 'Medium Budget'}
                        {budget === 'high' && 'High Budget'}
                      </div>
                      <div className={styles.budgetDescription}>
                        {budget === 'low' && 'Budget-friendly meal options'}
                        {budget === 'medium' && 'Balanced cost and quality'}
                        {budget === 'high' && 'Premium quality ingredients'}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
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
            
            <div className={styles.rightButtons}>
              <button
                type="button"
                className={styles.skipButton}
                onClick={handleSkip}
                disabled={isSubmitting}
              >
                Skip
              </button>
              
              <button
                type="submit"
                className={styles.nextButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <LoadingSpinner size="small" message="" />
                ) : (
                  <>
                    Next
                    <FiArrowRight className={styles.buttonIcon} />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Step5Lifestyle;




