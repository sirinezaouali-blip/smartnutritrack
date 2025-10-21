import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { saveMeal } from '../../services/mealService';
import { FiArrowLeft, FiSave, FiPlus, FiX } from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './AddMeal.module.css';

const AddMeal = () => {
  const { userProfile } = useUser();
  const navigate = useNavigate();
  
  const [mealData, setMealData] = useState({
    name: '',
    description: '',
    mealType: 'breakfast',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    ingredients: [],
    servingSize: '',
    notes: ''
  });
  
  const [newIngredient, setNewIngredient] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { value: 'lunch', label: 'Lunch', icon: '🌞' },
    { value: 'dinner', label: 'Dinner', icon: '🌙' },
    { value: 'snack', label: 'Snack', icon: '🍎' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMealData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addIngredient = () => {
    if (newIngredient.trim() && !mealData.ingredients.includes(newIngredient.trim())) {
      setMealData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient.trim()]
      }));
      setNewIngredient('');
    }
  };

  const removeIngredient = (index) => {
    setMealData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!mealData.name.trim()) {
      newErrors.name = 'Meal name is required';
    }
    
    if (!mealData.calories || mealData.calories <= 0) {
      newErrors.calories = 'Valid calorie amount is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const mealToSave = {
        ...mealData,
        calories: parseInt(mealData.calories),
        protein: parseFloat(mealData.protein) || 0,
        carbs: parseFloat(mealData.carbs) || 0,
        fat: parseFloat(mealData.fat) || 0,
        date: new Date().toISOString(),
        userId: userProfile.id
      };
      
      const result = await saveMeal(mealToSave);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to save meal. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className={styles.container}>
      <div className={styles.addMealCard}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backButton} onClick={handleBack}>
            <FiArrowLeft />
            Back to Dashboard
          </button>
          
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Add Meal</h1>
            <p className={styles.subtitle}>
              Log a new meal to track your nutrition
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Basic Information */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Basic Information</h3>
            
            <div className={styles.field}>
              <label htmlFor="name" className={styles.label}>
                Meal Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={mealData.name}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                placeholder="Enter meal name"
                disabled={isSubmitting}
              />
              {errors.name && <span className={styles.error}>{errors.name}</span>}
            </div>

            <div className={styles.field}>
              <label htmlFor="description" className={styles.label}>
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={mealData.description}
                onChange={handleInputChange}
                className={styles.textarea}
                placeholder="Describe your meal..."
                rows="3"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Meal Type *</label>
              <div className={styles.mealTypeGrid}>
                {mealTypes.map(type => (
                  <label key={type.value} className={styles.mealTypeOption}>
                    <input
                      type="radio"
                      name="mealType"
                      value={type.value}
                      checked={mealData.mealType === type.value}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className={styles.radioInput}
                    />
                    <div className={styles.mealTypeCard}>
                      <span className={styles.mealTypeIcon}>{type.icon}</span>
                      <span className={styles.mealTypeLabel}>{type.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Nutrition Information */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Nutrition Information</h3>
            
            <div className={styles.nutritionGrid}>
              <div className={styles.field}>
                <label htmlFor="calories" className={styles.label}>
                  Calories *
                </label>
                <input
                  type="number"
                  id="calories"
                  name="calories"
                  value={mealData.calories}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.calories ? styles.inputError : ''}`}
                  placeholder="0"
                  min="0"
                  disabled={isSubmitting}
                />
                {errors.calories && <span className={styles.error}>{errors.calories}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="protein" className={styles.label}>
                  Protein (g)
                </label>
                <input
                  type="number"
                  id="protein"
                  name="protein"
                  value={mealData.protein}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="carbs" className={styles.label}>
                  Carbohydrates (g)
                </label>
                <input
                  type="number"
                  id="carbs"
                  name="carbs"
                  value={mealData.carbs}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="fat" className={styles.label}>
                  Fats (g)
                </label>
                <input
                  type="number"
                  id="fat"
                  name="fat"
                  value={mealData.fat}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="servingSize" className={styles.label}>
                  Serving Size
                </label>
                <input
                  type="text"
                  id="servingSize"
                  name="servingSize"
                  value={mealData.servingSize}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="e.g., 1 cup, 200g"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Ingredients</h3>
            
            <div className={styles.ingredientsInput}>
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                placeholder="Add ingredient..."
                className={styles.input}
                disabled={isSubmitting}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
              />
              <button
                type="button"
                onClick={addIngredient}
                className={styles.addButton}
                disabled={isSubmitting || !newIngredient.trim()}
              >
                <FiPlus />
              </button>
            </div>
            
            {mealData.ingredients.length > 0 && (
              <div className={styles.ingredientsList}>
                {mealData.ingredients.map((ingredient, index) => (
                  <div key={index} className={styles.ingredientItem}>
                    <span className={styles.ingredientName}>{ingredient}</span>
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className={styles.removeButton}
                      disabled={isSubmitting}
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Notes</h3>
            
            <div className={styles.field}>
              <textarea
                id="notes"
                name="notes"
                value={mealData.notes}
                onChange={handleInputChange}
                className={styles.textarea}
                placeholder="Any additional notes about this meal..."
                rows="3"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className={styles.submitError}>
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <div className={styles.submitSection}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoadingSpinner size="small" message="" />
              ) : (
                <>
                  <FiSave />
                  Save Meal
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMeal;




