import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiTrash2 } from 'react-icons/fi';
import { analyticsService } from '../../services/analyticsService';
import styles from './EditUserMeal.module.css';

const EditUserMeal = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // This will be the UserMeal ID

  const [userMealData, setUserMealData] = useState({
    mealId: null,
    mealName: '',
    quantity: 1,
    mealType: 'breakfast',
    notes: '',
    date: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserMeal = async () => {
      try {
        // Fetch the user meal data using the new API endpoint
        const response = await fetch(`${(process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api/user-meals/single/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load meal data');
        }

        const result = await response.json();
        if (result.success) {
          setUserMealData({
            mealId: result.data.mealId._id,
            mealName: result.data.mealId.name,
            quantity: result.data.quantity,
            mealType: result.data.mealType,
            notes: result.data.notes || '',
            date: result.data.date
          });
        } else {
          throw new Error(result.message || 'Failed to load meal data');
        }
      } catch (error) {
        console.error('Error fetching user meal:', error);
        setError('Failed to load meal data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserMeal();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserMealData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!userMealData.quantity || userMealData.quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Update user meal via API
      const response = await fetch(`${(process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api/user-meals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          quantity: userMealData.quantity,
          mealType: userMealData.mealType,
          notes: userMealData.notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      const result = await response.json();
      if (result.success) {
        navigate('/dashboard');
      } else {
        throw new Error(result.message || 'Failed to save changes');
      }

    } catch (error) {
      console.error('Error saving user meal:', error);
      setError(error.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to remove this meal from your diary? This action cannot be undone.')) {
      try {
        // Delete user meal via API
        const response = await fetch(`${(process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api/user-meals/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete meal');
        }

        const result = await response.json();
        if (result.success) {
          navigate('/dashboard');
        } else {
          throw new Error(result.message || 'Failed to delete meal');
        }
      } catch (error) {
        console.error('Error deleting user meal:', error);
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
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editUserMeal}>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate('/dashboard')}
          disabled={saving}
        >
          <FiArrowLeft />
          Back
        </button>
        <h1>Edit Meal Entry</h1>
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
          <h2>Meal Information</h2>

          <div className={styles.field}>
            <label>Meal Name</label>
            <input
              type="text"
              value={userMealData.mealName}
              disabled={true}
              className={styles.disabledInput}
            />
            <small className={styles.helpText}>Meal name cannot be changed. Edit the meal definition separately if needed.</small>
          </div>

          <div className={styles.field}>
            <label htmlFor="mealType">Meal Type</label>
            <select
              id="mealType"
              name="mealType"
              value={userMealData.mealType}
              onChange={handleInputChange}
              disabled={saving}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="quantity">Quantity</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={userMealData.quantity}
              onChange={handleInputChange}
              placeholder="1"
              min="0.1"
              step="0.1"
              disabled={saving}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={userMealData.notes}
              onChange={handleInputChange}
              placeholder="Add any notes about this meal..."
              rows={3}
              disabled={saving}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button
            onClick={handleDelete}
            className={styles.deleteButton}
            disabled={saving}
          >
            <FiTrash2 />
            Remove from Diary
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
              disabled={saving}
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

export default EditUserMeal;
