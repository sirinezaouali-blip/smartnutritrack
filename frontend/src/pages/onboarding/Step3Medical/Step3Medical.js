import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { MEDICAL_CONDITIONS, FOOD_ALLERGIES } from '../../../utils/constants';
import { FiArrowLeft, FiArrowRight, FiPlus, FiX, FiHeart } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './Step3Medical.module.css';

const Step3Medical = () => {
  const { updateOnboarding, userProfile, loading } = useUser();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [medicalData, setMedicalData] = useState({
    conditions: [],
    allergies: [],
    hasNoneConditions: false,
    hasNoneAllergies: false
  });
  
  const [customConditions, setCustomConditions] = useState([]);
  const [customAllergies, setCustomAllergies] = useState([]);
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing data if available
  useEffect(() => {
    if (userProfile?.onboarding?.medical) {
      const medical = userProfile.onboarding.medical;
      setMedicalData({
        conditions: medical.conditions || [],
        allergies: medical.allergies || [],
        hasNoneConditions: medical.hasNone || false,
        hasNoneAllergies: medical.hasNone || false
      });
    }
  }, [userProfile]);

  const handleConditionChange = (condition) => {
    if (condition === 'None') {
      // If selecting "None", clear all other conditions and custom conditions
      setCustomConditions([]);
      setMedicalData(prev => ({
        ...prev,
        conditions: ['None'],
        hasNoneConditions: true
      }));
    } else {
      // If selecting any other condition, remove "None" if it was selected
      setMedicalData(prev => {
        const currentConditions = prev.conditions;

        const newConditions = currentConditions.includes(condition)
          ? currentConditions.filter(c => c !== condition)
          : [...currentConditions.filter(c => c !== 'None'), condition];

        return {
          ...prev,
          conditions: newConditions,
          hasNoneConditions: false
        };
      });
    }

    if (errors.conditions) {
      setErrors(prev => ({ ...prev, conditions: '' }));
    }
  };

  const handleAllergyChange = (allergy) => {
    if (allergy === 'None') {
      // If selecting "None", clear all other allergies and custom allergies
      setCustomAllergies([]);
      setMedicalData(prev => ({
        ...prev,
        allergies: ['None'],
        hasNoneAllergies: true
      }));
    } else {
      // If selecting any other allergy, remove "None" if it was selected
      setMedicalData(prev => {
        const currentAllergies = prev.allergies;

        const newAllergies = currentAllergies.includes(allergy)
          ? currentAllergies.filter(a => a !== allergy)
          : [...currentAllergies.filter(a => a !== 'None'), allergy];

        return {
          ...prev,
          allergies: newAllergies,
          hasNoneAllergies: false
        };
      });
    }

    if (errors.allergies) {
      setErrors(prev => ({ ...prev, allergies: '' }));
    }
  };

  const addCustomCondition = () => {
    if (newCondition.trim() && !customConditions.includes(newCondition.trim())) {
      setCustomConditions(prev => [...prev, newCondition.trim()]);
      setMedicalData(prev => ({
        ...prev,
        conditions: [...prev.conditions.filter(c => c !== 'None'), newCondition.trim()],
        hasNoneConditions: false
      }));
      setNewCondition('');
    }
  };

  const addCustomAllergy = () => {
    if (newAllergy.trim() && !customAllergies.includes(newAllergy.trim())) {
      setCustomAllergies(prev => [...prev, newAllergy.trim()]);
      setMedicalData(prev => ({
        ...prev,
        allergies: [...prev.allergies.filter(a => a !== 'None'), newAllergy.trim()],
        hasNoneAllergies: false
      }));
      setNewAllergy('');
    }
  };

  const removeCustomCondition = (condition) => {
    setCustomConditions(prev => prev.filter(c => c !== condition));
    setMedicalData(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c !== condition)
    }));
  };

  const removeCustomAllergy = (allergy) => {
    setCustomAllergies(prev => prev.filter(a => a !== allergy));
    setMedicalData(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // At least one selection is required (either conditions or none, allergies or none)
    if (medicalData.conditions.length === 0 && !medicalData.hasNoneConditions) {
      newErrors.conditions = 'Please select medical conditions or choose "None"';
    }
    
    if (medicalData.allergies.length === 0 && !medicalData.hasNoneAllergies) {
      newErrors.allergies = 'Please select allergies or choose "None"';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const medicalInfo = {
        conditions: medicalData.conditions,
        allergies: medicalData.allergies,
        hasNone: medicalData.hasNoneConditions && medicalData.hasNoneAllergies
      };
      
      const result = await updateOnboarding({
        step: 3,
        data: medicalInfo
      });
      
      if (result.success) {
        navigate('/onboarding/preferences');
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
    navigate('/onboarding/basic-info');
  };

  const handleSkip = () => {
    // Set default values and continue
    setMedicalData({
      conditions: [],
      allergies: [],
      hasNoneConditions: true,
      hasNoneAllergies: true
    });
    navigate('/onboarding/preferences');
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        {/* Progress Indicator */}
        <div className={styles.progressIndicator}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: '42%' }}></div>
          </div>
          <span className={styles.progressText}>Step 3 of 7</span>
        </div>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <FiHeart />
          </div>
          <h2 className={styles.title}>Medical Information</h2>
          <p className={styles.subtitle}>
            Help us provide personalized recommendations based on your health needs
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Medical Conditions */}
          <div className={styles.field}>
            <label className={styles.label}>Medical Conditions</label>
            <div className={styles.checkboxGrid}>
              {MEDICAL_CONDITIONS.map(condition => (
                <label key={condition} className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    checked={condition === 'None' ? medicalData.hasNoneConditions : medicalData.conditions.includes(condition)}
                    onChange={() => handleConditionChange(condition)}
                    disabled={isSubmitting}
                    className={styles.checkboxInput}
                  />
                  <span className={styles.checkboxLabel}>{condition}</span>
                </label>
              ))}
            </div>
            
            {/* Custom Conditions */}
            <div className={styles.customSection}>
              <div className={styles.customInput}>
                <input
                  type="text"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  placeholder="Add custom condition"
                  className={styles.input}
                  disabled={isSubmitting}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCondition())}
                />
                <button
                  type="button"
                  onClick={addCustomCondition}
                  className={styles.addButton}
                  disabled={isSubmitting || !newCondition.trim()}
                >
                  <FiPlus />
                </button>
              </div>
              
              {customConditions.length > 0 && (
                <div className={styles.customTags}>
                  {customConditions.map(condition => (
                    <div key={condition} className={styles.customTag}>
                      {condition}
                      <button
                        type="button"
                        onClick={() => removeCustomCondition(condition)}
                        className={styles.removeButton}
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {errors.conditions && <span className={styles.error}>{errors.conditions}</span>}
          </div>

          {/* Food Allergies */}
          <div className={styles.field}>
            <label className={styles.label}>Food Allergies</label>
            <div className={styles.checkboxGrid}>
              {FOOD_ALLERGIES.map(allergy => (
                <label key={allergy} className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    checked={allergy === 'None' ? medicalData.hasNoneAllergies : medicalData.allergies.includes(allergy)}
                    onChange={() => handleAllergyChange(allergy)}
                    disabled={isSubmitting}
                    className={styles.checkboxInput}
                  />
                  <span className={styles.checkboxLabel}>{allergy}</span>
                </label>
              ))}
            </div>
            
            {/* Custom Allergies */}
            <div className={styles.customSection}>
              <div className={styles.customInput}>
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Add custom allergy"
                  className={styles.input}
                  disabled={isSubmitting}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAllergy())}
                />
                <button
                  type="button"
                  onClick={addCustomAllergy}
                  className={styles.addButton}
                  disabled={isSubmitting || !newAllergy.trim()}
                >
                  <FiPlus />
                </button>
              </div>
              
              {customAllergies.length > 0 && (
                <div className={styles.customTags}>
                  {customAllergies.map(allergy => (
                    <div key={allergy} className={styles.customTag}>
                      {allergy}
                      <button
                        type="button"
                        onClick={() => removeCustomAllergy(allergy)}
                        className={styles.removeButton}
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {errors.allergies && <span className={styles.error}>{errors.allergies}</span>}
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

export default Step3Medical;









