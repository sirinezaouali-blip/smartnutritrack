import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { validateAge, validateHeight, validateWeight } from '../../../utils/validators';
import { GENDERS, HEALTH_GOALS } from '../../../utils/constants';
import { FiArrowLeft, FiArrowRight, FiUser, FiMaximize, FiActivity, FiTarget } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './Step2BasicInfo.module.css';

const Step2BasicInfo = () => {
  const { updateOnboarding, userProfile, loading } = useUser();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    age: '',
    height: '',
    weight: '',
    gender: '',
    goal: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing data if available
  useEffect(() => {
    if (userProfile?.onboarding?.basicInfo) {
      const basicInfo = userProfile.onboarding.basicInfo;
      setFormData({
        age: basicInfo.age?.toString() || '',
        height: basicInfo.height?.toString() || '',
        weight: basicInfo.weight?.toString() || '',
        gender: basicInfo.gender || '',
        goal: basicInfo.goal || ''
      });
    }
  }, [userProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Age validation
    const ageValidation = validateAge(formData.age);
    if (!ageValidation.isValid) {
      newErrors.age = ageValidation.error;
    }
    
    // Height validation
    const heightValidation = validateHeight(formData.height);
    if (!heightValidation.isValid) {
      newErrors.height = heightValidation.error;
    }
    
    // Weight validation
    const weightValidation = validateWeight(formData.weight);
    if (!weightValidation.isValid) {
      newErrors.weight = weightValidation.error;
    }
    
    // Gender validation
    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }
    
    // Goal validation
    if (!formData.goal) {
      newErrors.goal = 'Please select your health goal';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const basicInfo = {
        age: parseInt(formData.age),
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        gender: formData.gender,
        goal: formData.goal
      };
      
      const result = await updateOnboarding({
        step: 2,
        data: basicInfo
      });
      
      if (result.success) {
        navigate('/onboarding/medical');
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
    navigate('/onboarding/welcome');
  };

  const calculateBMI = () => {
    if (formData.height && formData.weight) {
      const heightM = parseFloat(formData.height) / 100;
      const weight = parseFloat(formData.weight);
      const bmi = (weight / (heightM * heightM)).toFixed(1);
      return bmi;
    }
    return null;
  };

  const bmi = calculateBMI();

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        {/* Progress Indicator */}
        <div className={styles.progressIndicator}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: '28%' }}></div>
          </div>
          <span className={styles.progressText}>Step 2 of 7</span>
        </div>

        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Basic Information</h2>
          <p className={styles.subtitle}>
            Help us understand your current health status and goals
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Age Field */}
          <div className={styles.field}>
            <label htmlFor="age" className={styles.label}>
              <FiUser className={styles.labelIcon} />
              Age <span className={styles.required}>*</span>
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className={`${styles.input} ${errors.age ? styles.inputError : ''}`}
              placeholder="Enter your age"
              min="15"
              max="100"
              disabled={isSubmitting}
              required
            />
            {errors.age && <span className={styles.error}>{errors.age}</span>}
            {!formData.age && !errors.age && (
              <span className={styles.hint}>Age is required to calculate your nutritional needs</span>
            )}
          </div>

          {/* Height Field */}
          <div className={styles.field}>
            <label htmlFor="height" className={styles.label}>
              <FiMaximize className={styles.labelIcon} />
              Height (cm) <span className={styles.required}>*</span>
            </label>
            <input
              type="number"
              id="height"
              name="height"
              value={formData.height}
              onChange={handleChange}
              className={`${styles.input} ${errors.height ? styles.inputError : ''}`}
              placeholder="Enter your height"
              min="100"
              max="250"
              step="0.1"
              disabled={isSubmitting}
              required
            />
            {errors.height && <span className={styles.error}>{errors.height}</span>}
            {!formData.height && !errors.height && (
              <span className={styles.hint}>Height is required to calculate your BMI and nutritional needs</span>
            )}
          </div>

          {/* Weight Field */}
          <div className={styles.field}>
            <label htmlFor="weight" className={styles.label}>
              <FiActivity className={styles.labelIcon} />
              Weight (kg) <span className={styles.required}>*</span>
            </label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              className={`${styles.input} ${errors.weight ? styles.inputError : ''}`}
              placeholder="Enter your weight"
              min="30"
              max="300"
              step="0.1"
              disabled={isSubmitting}
              required
            />
            {errors.weight && <span className={styles.error}>{errors.weight}</span>}
            {!formData.weight && !errors.weight && (
              <span className={styles.hint}>Weight is required to calculate your BMI and nutritional needs</span>
            )}
          </div>

          {/* BMI Display */}
          {bmi && (
            <div className={styles.bmiDisplay}>
              <div className={styles.bmiCard}>
                <span className={styles.bmiLabel}>Your BMI:</span>
                <span className={styles.bmiValue}>{bmi}</span>
                <span className={styles.bmiCategory}>
                  {bmi < 18.5 ? 'Underweight' : 
                   bmi < 25 ? 'Normal' : 
                   bmi < 30 ? 'Overweight' : 'Obese'}
                </span>
              </div>
            </div>
          )}

          {/* Gender Field */}
          <div className={styles.field}>
            <label className={styles.label}>
              Gender
            </label>
            <div className={styles.radioGroup}>
              {Object.values(GENDERS).map(gender => (
                <label key={gender} className={styles.radioOption}>
                  <input
                    type="radio"
                    name="gender"
                    value={gender}
                    checked={formData.gender === gender}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioLabel}>
                    {gender === GENDERS.MALE ? 'Male' : 
                     gender === GENDERS.FEMALE ? 'Female' : 'Other'}
                  </span>
                </label>
              ))}
            </div>
            {errors.gender && <span className={styles.error}>{errors.gender}</span>}
          </div>

          {/* Goal Field */}
          <div className={styles.field}>
            <label className={styles.label}>
              <FiTarget className={styles.labelIcon} />
              Health Goal
            </label>
            <div className={styles.goalOptions}>
              {Object.values(HEALTH_GOALS).map(goal => (
                <label key={goal} className={styles.goalOption}>
                  <input
                    type="radio"
                    name="goal"
                    value={goal}
                    checked={formData.goal === goal}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={styles.radioInput}
                  />
                  <div className={styles.goalCard}>
                    <div className={styles.goalIcon}>
                      {goal === HEALTH_GOALS.MAINTAIN && '⚖️'}
                      {goal === HEALTH_GOALS.LOSE_WEIGHT && '📉'}
                      {goal === HEALTH_GOALS.GAIN_MUSCLE && '💪'}
                    </div>
                    <div className={styles.goalContent}>
                      <div className={styles.goalTitle}>
                        {goal === HEALTH_GOALS.MAINTAIN && 'Maintain Weight'}
                        {goal === HEALTH_GOALS.LOSE_WEIGHT && 'Lose Weight'}
                        {goal === HEALTH_GOALS.GAIN_MUSCLE && 'Gain Muscle'}
                      </div>
                      <div className={styles.goalDescription}>
                        {goal === HEALTH_GOALS.MAINTAIN && 'Keep your current weight and improve overall health'}
                        {goal === HEALTH_GOALS.LOSE_WEIGHT && 'Lose weight safely and sustainably'}
                        {goal === HEALTH_GOALS.GAIN_MUSCLE && 'Build muscle mass and strength'}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.goal && <span className={styles.error}>{errors.goal}</span>}
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
        </form>
      </div>
    </div>
  );
};

export default Step2BasicInfo;









