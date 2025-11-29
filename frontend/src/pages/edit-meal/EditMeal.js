import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiTrash2 } from 'react-icons/fi';
import { mealService } from '../../services/mealService';
import styles from './EditMeal.module.css';

const EditMeal = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [mealData, setMealData] = useState({
    name: '',
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    mealType: 'breakfast',
    ingredients: [],
    servingSize: '',
    servingUnit: 'g'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMeal = async () => {
      try {
        const response = await mealService.getMealById(id);
        
        if (response.success) {
          // Map backend field names to frontend field names
          setMealData({
            name: response.data.name,
            description: response.data.description || '',
            calories: response.data.calories,
            protein: response.data.protein || '',
            carbs: response.data.carbs || '',
            fats: response.data.fats || '', 
            mealType: response.data.type, 
            ingredients: response.data.ingredients || [],
            servingSize: response.data.servingSize || '',
            servingUnit: 'g'
          });
        } else {
          setError('Failed to load meal data');
        }
      } catch (error) {
        console.error('Error fetching meal:', error);
        setError('Failed to load meal data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMeal();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMealData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleIngredientChange = (index, value) => {
    const newIngredients = [...mealData.ingredients];
    newIngredients[index] = value;
    setMealData(prev => ({
      ...prev,
      ingredients: newIngredients
    }));
  };

  const addIngredient = () => {
    setMealData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const removeIngredient = (index) => {
    setMealData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!mealData.name.trim() || !mealData.calories) {
      setError('Meal name and calories are required');
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      // Prepare data for backend (map frontend field names to backend field names)
      const updateData = {
        name: mealData.name,
        description: mealData.description,
        type: mealData.mealType, // Map 'mealType' to 'type'
        calories: mealData.calories,
        protein: mealData.protein || 0,
        carbs: mealData.carbs || 0,
        fats: mealData.fats || 0, 
        ingredients: mealData.ingredients.filter(ing => ing.trim() !== ''),
        servingSize: mealData.servingSize
      };

      const response = await mealService.updateMeal(id, updateData);

      if (response.success) {
        navigate('/dashboard');
      } else {
        setError(response.message || 'Failed to save meal');
      }
    } catch (error) {
      console.error('Error saving meal:', error);
      setError(error.response?.data?.message || 'Failed to save meal');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this meal? This action cannot be undone.')) {
      try {
        const response = await mealService.deleteMeal(id);
        
        if (response.success) {
          navigate('/dashboard');
        } else {
          setError(response.message || 'Failed to delete meal');
        }
      } catch (error) {
        console.error('Error deleting meal:', error);
        setError(error.response?.data?.message || 'Failed to delete meal');
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading meal...</p>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className={styles.error}>
        <h2>Error</h2>
        <p>{error}</p>
        <div className={styles.errorActions}>
          <button onClick={() => navigate('/dashboard')} className={styles.backButton}>
            Back to Dashboard
          </button>
          <button onClick={() => setError(null)} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editMeal}>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate('/dashboard')}
          disabled={saving}
        >
          <FiArrowLeft />
          Back
        </button>
        <h1>Edit Meal</h1>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <p>{error}</p>
          <button onClick={() => setError(null)} className={styles.closeError}>
            ×
          </button>
        </div>
      )}

      <div className={styles.form}>
        <div className={styles.section}>
          <h2>Basic Information</h2>

          <div className={styles.field}>
            <label htmlFor="name">Meal Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={mealData.name}
              onChange={handleInputChange}
              placeholder="Enter meal name"
              required
              disabled={saving}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={mealData.description}
              onChange={handleInputChange}
              placeholder="Describe your meal"
              rows={3}
              disabled={saving}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="mealType">Meal Type</label>
            <select
              id="mealType"
              name="mealType"
              value={mealData.mealType}
              onChange={handleInputChange}
              disabled={saving}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Nutrition Information</h2>

          <div className={styles.nutritionGrid}>
            <div className={styles.field}>
              <label htmlFor="calories">Calories (kcal) *</label>
              <input
                type="number"
                id="calories"
                name="calories"
                value={mealData.calories}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                required
                disabled={saving}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="protein">Protein (g)</label>
              <input
                type="number"
                id="protein"
                name="protein"
                value={mealData.protein}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="0.1"
                disabled={saving}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="carbs">Carbs (g)</label>
              <input
                type="number"
                id="carbs"
                name="carbs"
                value={mealData.carbs}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="0.1"
                disabled={saving}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="fats">Fats (g)</label>
              <input
                type="number"
                id="fats"
                name="fats"
                value={mealData.fats}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="0.1"
                disabled={saving}
              />
            </div>
          </div>

          <div className={styles.servingInfo}>
            <div className={styles.field}>
              <label htmlFor="servingSize">Serving Size</label>
              <input
                type="number"
                id="servingSize"
                name="servingSize"
                value={mealData.servingSize}
                onChange={handleInputChange}
                placeholder="100"
                min="0"
                disabled={saving}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="servingUnit">Unit</label>
              <select
                id="servingUnit"
                name="servingUnit"
                value={mealData.servingUnit}
                onChange={handleInputChange}
                disabled={saving}
              >
                <option value="g">grams (g)</option>
                <option value="ml">milliliters (ml)</option>
                <option value="cup">cup</option>
                <option value="tbsp">tablespoon</option>
                <option value="tsp">teaspoon</option>
                <option value="piece">piece</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Ingredients</h2>

          {mealData.ingredients.map((ingredient, index) => (
            <div key={index} className={styles.ingredientField}>
              <input
                type="text"
                value={ingredient}
                onChange={(e) => handleIngredientChange(index, e.target.value)}
                placeholder="Enter ingredient"
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className={styles.removeIngredient}
                disabled={saving}
              >
                <FiTrash2 />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addIngredient}
            className={styles.addIngredient}
            disabled={saving}
          >
            + Add Ingredient
          </button>
        </div>

        <div className={styles.actions}>
          <button
            onClick={handleDelete}
            className={styles.deleteButton}
            disabled={saving}
          >
            <FiTrash2 />
            Delete Meal
          </button>

          <div className={styles.saveActions}>
            <button
              onClick={() => navigate('/dashboard')}
              className={styles.cancelButton}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className={styles.saveButton}
              disabled={saving || !mealData.name.trim() || !mealData.calories}
            >
              {saving ? (
                <>
                  <div className={styles.spinner}></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMeal;