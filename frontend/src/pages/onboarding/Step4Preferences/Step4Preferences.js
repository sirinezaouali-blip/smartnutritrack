import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { DIET_TYPES, CUISINE_TYPES, COMMON_DISLIKED_FOODS } from '../../../utils/constants';
import { FiArrowLeft, FiArrowRight, FiPlus, FiX, FiCoffee } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './Step4Preferences.module.css';

const Step4Preferences = () => {
  const { updateOnboarding, userProfile, loading } = useUser();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [preferencesData, setPreferencesData] = useState({
    dietType: '',
    dislikedFoods: [],
    favoriteCuisine: []
  });
  
  const [customDislikedFoods, setCustomDislikedFoods] = useState([]);
  const [newDislikedFood, setNewDislikedFood] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing data if available
  useEffect(() => {
    if (userProfile?.onboarding?.preferences) {
      const preferences = userProfile.onboarding.preferences;
      setPreferencesData({
        dietType: preferences.dietType || '',
        dislikedFoods: preferences.dislikedFoods || [],
        favoriteCuisine: preferences.favoriteCuisine || []
      });
    }
  }, [userProfile]);

  const handleDietTypeChange = (dietType) => {
    setPreferencesData(prev => ({
      ...prev,
      dietType
    }));
    
    if (errors.dietType) {
      setErrors(prev => ({ ...prev, dietType: '' }));
    }
  };

  const handleDislikedFoodChange = (food) => {
    if (food === 'None') {
      // If selecting "None", clear all other foods and custom foods
      setCustomDislikedFoods([]);
      setPreferencesData(prev => ({
        ...prev,
        dislikedFoods: ['None']
      }));
    } else {
      // If selecting any other food, remove "None" if it was selected and add the food
      setPreferencesData(prev => {
        const currentDislikedFoods = prev.dislikedFoods;

        const newDislikedFoods = currentDislikedFoods.includes(food)
          ? currentDislikedFoods.filter(f => f !== food)
          : [...currentDislikedFoods.filter(f => f !== 'None'), food];

        return {
          ...prev,
          dislikedFoods: newDislikedFoods
        };
      });
    }
  };

  const handleCuisineChange = (cuisine) => {
    setPreferencesData(prev => ({
      ...prev,
      favoriteCuisine: prev.favoriteCuisine.includes(cuisine)
        ? prev.favoriteCuisine.filter(c => c !== cuisine)
        : [...prev.favoriteCuisine, cuisine]
    }));
  };

  const addCustomDislikedFood = () => {
    if (newDislikedFood.trim() && !customDislikedFoods.includes(newDislikedFood.trim())) {
      setCustomDislikedFoods(prev => [...prev, newDislikedFood.trim()]);
      setPreferencesData(prev => ({
        ...prev,
        dislikedFoods: [...prev.dislikedFoods.filter(f => f !== 'None'), newDislikedFood.trim()]
      }));
      setNewDislikedFood('');
    }
  };

  const removeCustomDislikedFood = (food) => {
    setCustomDislikedFoods(prev => prev.filter(f => f !== food));
    setPreferencesData(prev => ({
      ...prev,
      dislikedFoods: prev.dislikedFoods.filter(f => f !== food)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Diet type is required
    if (!preferencesData.dietType) {
      newErrors.dietType = 'Please select a diet type';
    }

    // Disliked foods is required - must select at least one option
    if (preferencesData.dislikedFoods.length === 0) {
      newErrors.dislikedFoods = 'Please select at least one food you dislike or choose "None"';
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
        step: 4,
        data: preferencesData
      });
      
      if (result.success) {
        navigate('/onboarding/lifestyle');
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
    navigate('/onboarding/medical');
  };

  const handleSkip = () => {
    // Set default values and continue
    setPreferencesData({
      dietType: 'none',
      dislikedFoods: [],
      favoriteCuisine: []
    });
    navigate('/onboarding/lifestyle');
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        {/* Progress Indicator */}
        <div className={styles.progressIndicator}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: '56%' }}></div>
          </div>
          <span className={styles.progressText}>Step 4 of 7</span>
        </div>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <FiCoffee />
          </div>
          <h2 className={styles.title}>Dietary Preferences</h2>
          <p className={styles.subtitle}>
            Tell us about your food preferences to get personalized recommendations
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Diet Type */}
          <div className={styles.field}>
            <label className={styles.label}>Diet Type *</label>
            <div className={styles.dietGrid}>
              {Object.values(DIET_TYPES).map(dietType => (
                <label key={dietType} className={styles.dietOption}>
                  <input
                    type="radio"
                    name="dietType"
                    value={dietType}
                    checked={preferencesData.dietType === dietType}
                    onChange={(e) => handleDietTypeChange(e.target.value)}
                    disabled={isSubmitting}
                    className={styles.radioInput}
                  />
                  <div className={styles.dietCard}>
                    <div className={styles.dietIcon}>
                      {dietType === 'vegetarian' && '🥬'}
                      {dietType === 'vegan' && '🌱'}
                      {dietType === 'gluten-free' && '🌾'}
                      {dietType === 'keto' && '🥑'}
                      {dietType === 'paleo' && '🥩'}
                      {dietType === 'mediterranean' && '🐟'}
                      {dietType === 'dairy-free' && '🥛'}
                      {dietType === 'nut-free' && '🥜'}
                      {dietType === 'none' && '🍽️'}
                    </div>
                    <div className={styles.dietContent}>
                      <div className={styles.dietTitle}>
                        {dietType === 'vegetarian' && 'Vegetarian'}
                        {dietType === 'vegan' && 'Vegan'}
                        {dietType === 'gluten-free' && 'Gluten-Free'}
                        {dietType === 'keto' && 'Keto'}
                        {dietType === 'paleo' && 'Paleo'}
                        {dietType === 'mediterranean' && 'Mediterranean'}
                        {dietType === 'dairy-free' && 'Dairy-Free'}
                        {dietType === 'nut-free' && 'Nut-Free'}
                        {dietType === 'none' && 'No Restrictions'}
                      </div>
                      <div className={styles.dietDescription}>
                        {dietType === 'vegetarian' && 'Plant-based diet with dairy and eggs'}
                        {dietType === 'vegan' && 'Plant-based diet, no animal products'}
                        {dietType === 'gluten-free' && 'No wheat, barley, or rye products'}
                        {dietType === 'keto' && 'Low carb, high fat diet'}
                        {dietType === 'paleo' && 'Whole foods, no processed items'}
                        {dietType === 'mediterranean' && 'Mediterranean style eating'}
                        {dietType === 'dairy-free' && 'No dairy products'}
                        {dietType === 'nut-free' && 'No nuts or nut products'}
                        {dietType === 'none' && 'No dietary restrictions'}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.dietType && <span className={styles.error}>{errors.dietType}</span>}
          </div>

          {/* Disliked Foods */}
          <div className={styles.field}>
            <label className={styles.label}>
              Foods I Dislike <span className={styles.required}>*</span>
            </label>
            <div className={styles.checkboxGrid}>
              {COMMON_DISLIKED_FOODS.map(food => (
                <label key={food} className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    checked={preferencesData.dislikedFoods.includes(food)}
                    onChange={() => handleDislikedFoodChange(food)}
                    disabled={isSubmitting}
                    className={styles.checkboxInput}
                  />
                  <span className={styles.checkboxLabel}>{food}</span>
                </label>
              ))}
            </div>
            
            {/* Custom Disliked Foods */}
            <div className={styles.customSection}>
              <div className={styles.customInput}>
                <input
                  type="text"
                  value={newDislikedFood}
                  onChange={(e) => setNewDislikedFood(e.target.value)}
                  placeholder="Add custom disliked food"
                  className={styles.input}
                  disabled={isSubmitting}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomDislikedFood())}
                />
                <button
                  type="button"
                  onClick={addCustomDislikedFood}
                  className={styles.addButton}
                  disabled={isSubmitting || !newDislikedFood.trim()}
                >
                  <FiPlus />
                </button>
              </div>
              
              {customDislikedFoods.length > 0 && (
                <div className={styles.customTags}>
                  {customDislikedFoods.map(food => (
                    <div key={food} className={styles.customTag}>
                      {food}
                      <button
                        type="button"
                        onClick={() => removeCustomDislikedFood(food)}
                        className={styles.removeButton}
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.dislikedFoods && <span className={styles.error}>{errors.dislikedFoods}</span>}
          </div>

          {/* Favorite Cuisine */}
          <div className={styles.field}>
            <label className={styles.label}>Favorite Cuisine (Optional)</label>
            <div className={styles.checkboxGrid}>
              {CUISINE_TYPES.map(cuisine => (
                <label key={cuisine} className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    checked={preferencesData.favoriteCuisine.includes(cuisine)}
                    onChange={() => handleCuisineChange(cuisine)}
                    disabled={isSubmitting}
                    className={styles.checkboxInput}
                  />
                  <span className={styles.checkboxLabel}>{cuisine}</span>
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

export default Step4Preferences;









