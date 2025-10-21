import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { updateUserProfile } from '../../services/userService';
import { FiEdit, FiSave, FiX, FiUser, FiMail, FiPhone, FiCalendar, FiTarget, FiActivity } from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './Profile.module.css';

const Profile = () => {
  const { userProfile, updateProfile, updateOnboarding } = useUser();
  const { t } = useLanguage();

  const [editingSection, setEditingSection] = useState(null); // 'basic', 'health', 'preferences'
  const [isGlobalEditing, setIsGlobalEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [healthEditData, setHealthEditData] = useState({
    goal: '',
    activityLevel: ''
  });
  const [preferencesEditData, setPreferencesEditData] = useState({
    dietType: '',
    dislikedFoods: [],
    favoriteCuisine: [],
    conditions: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (userProfile) {
      setEditData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || '',
        phone: userProfile.phone || ''
      });
      setHealthEditData({
        goal: userProfile.onboarding?.basicInfo?.goal || '',
        activityLevel: userProfile.onboarding?.lifestyle?.activityLevel || ''
      });
      setPreferencesEditData({
        dietType: userProfile.onboarding?.preferences?.dietType || '',
        dislikedFoods: userProfile.onboarding?.preferences?.dislikedFoods || [],
        favoriteCuisine: userProfile.onboarding?.preferences?.favoriteCuisine || [],
        conditions: userProfile.onboarding?.medical?.conditions || []
      });
    }
  }, [userProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleHealthInputChange = (e) => {
    const { name, value } = e.target;
    setHealthEditData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePreferencesInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'dislikedFoods' || name === 'favoriteCuisine' || name === 'conditions') {
      // Handle comma-separated values
      const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
      setPreferencesEditData(prev => ({
        ...prev,
        [name]: arrayValue
      }));
    } else {
      setPreferencesEditData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!editData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!editData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!editData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(editData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateHealthForm = () => {
    const newErrors = {};

    if (!healthEditData.goal) {
      newErrors.goal = 'Health goal is required';
    }

    if (!healthEditData.activityLevel) {
      newErrors.activityLevel = 'Activity level is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePreferencesForm = () => {
    const newErrors = {};

    if (!preferencesEditData.dietType) {
      newErrors.dietType = 'Diet type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    let validationPassed = false;
    let dataToSave = {};

    // Section-specific edit mode
    if (editingSection === 'basic') {
      validationPassed = validateForm();
      dataToSave = editData;
    } else if (editingSection === 'health') {
      validationPassed = validateHealthForm();
      dataToSave = healthEditData;
    } else if (editingSection === 'preferences') {
      validationPassed = validatePreferencesForm();
      dataToSave = preferencesEditData;
    }

    if (!validationPassed) return;

    setIsSaving(true);
    setErrors({});

    try {
      let result;
      if (editingSection === 'basic') {
        result = await updateProfile(dataToSave);
      } else {
        // For health and preferences, use updateOnboarding
        const step = editingSection === 'health' ? 2 : 4; // 2 for basicInfo (health goal), 4 for preferences
        result = await updateOnboarding({ step, data: dataToSave });
      }

      if (result.success) {
        setEditingSection(null);
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      firstName: userProfile.firstName || '',
      lastName: userProfile.lastName || '',
      email: userProfile.email || '',
      phone: userProfile.phone || ''
    });
    setHealthEditData({
      goal: userProfile.onboarding?.basicInfo?.goal || '',
      activityLevel: userProfile.onboarding?.lifestyle?.activityLevel || ''
    });
    setPreferencesEditData({
      dietType: userProfile.onboarding?.preferences?.dietType || '',
      dislikedFoods: userProfile.onboarding?.preferences?.dislikedFoods || [],
      favoriteCuisine: userProfile.onboarding?.preferences?.favoriteCuisine || [],
      conditions: userProfile.onboarding?.medical?.conditions || []
    });
    setErrors({});
    setEditingSection(null);
  };

  const getHealthGoalText = (goal) => {
    const goals = {
      'maintain': 'Maintain Weight',
      'lose_weight': 'Lose Weight',
      'gain_muscle': 'Gain Muscle'
    };
    return goals[goal] || 'Not specified';
  };

  const getActivityLevelText = (level) => {
    const levels = {
      'sedentary': 'Sedentary',
      'light': 'Light Activity',
      'moderate': 'Moderate Activity',
      'active': 'Active',
      'very_active': 'Very Active'
    };
    return levels[level] || 'Not specified';
  };

  if (!userProfile) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" message="Loading profile..." />
      </div>
    );
  }

  return (
    <div className={styles.profile}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.avatar}>
            <FiUser />
          </div>
          <div className={styles.userInfo}>
            <h1 className={styles.userName}>
              {userProfile.firstName} {userProfile.lastName}
            </h1>
            <p className={styles.userEmail}>{userProfile.email}</p>
          </div>
        </div>
        
        <div className={styles.headerActions}>
          {editingSection ? (
            <div className={styles.editActions}>
              <button
                className={styles.cancelButton}
                onClick={handleCancel}
                disabled={isSaving}
              >
                <FiX />
                Cancel
              </button>
              <button
                className={styles.saveButton}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <LoadingSpinner size="small" message="" />
                ) : (
                  <>
                    <FiSave />
                    Save
                  </>
                )}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Profile Information */}
      <div className={styles.profileSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Personal Information</h2>
          {editingSection !== 'basic' && (
            <button
              className={styles.editSectionButton}
              onClick={() => setEditingSection('basic')}
            >
              <FiEdit />
              Edit
            </button>
          )}
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoField}>
            <label className={styles.fieldLabel}>
              <FiUser className={styles.fieldIcon} />
              First Name
            </label>
            {editingSection === 'basic' ? (
              <input
                type="text"
                name="firstName"
                value={editData.firstName}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
                disabled={isSaving}
              />
            ) : (
              <div className={styles.fieldValue}>{userProfile.firstName}</div>
            )}
            {errors.firstName && <span className={styles.error}>{errors.firstName}</span>}
          </div>

          <div className={styles.infoField}>
            <label className={styles.fieldLabel}>
              <FiUser className={styles.fieldIcon} />
              Last Name
            </label>
            {editingSection === 'basic' ? (
              <input
                type="text"
                name="lastName"
                value={editData.lastName}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
                disabled={isSaving}
              />
            ) : (
              <div className={styles.fieldValue}>{userProfile.lastName}</div>
            )}
            {errors.lastName && <span className={styles.error}>{errors.lastName}</span>}
          </div>

          <div className={styles.infoField}>
            <label className={styles.fieldLabel}>
              <FiMail className={styles.fieldIcon} />
              Email
            </label>
            {editingSection === 'basic' ? (
              <input
                type="email"
                name="email"
                value={editData.email}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                disabled={isSaving}
              />
            ) : (
              <div className={styles.fieldValue}>{userProfile.email}</div>
            )}
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          <div className={styles.infoField}>
            <label className={styles.fieldLabel}>
              <FiPhone className={styles.fieldIcon} />
              Phone Number
            </label>
            {editingSection === 'basic' ? (
              <input
                type="tel"
                name="phone"
                value={editData.phone}
                onChange={handleInputChange}
                className={styles.input}
                disabled={isSaving}
              />
            ) : (
              <div className={styles.fieldValue}>
                {userProfile.phone || 'Not provided'}
              </div>
            )}
          </div>

          <div className={styles.infoField}>
            <label className={styles.fieldLabel}>
              <FiCalendar className={styles.fieldIcon} />
              Member Since
            </label>
            <div className={styles.fieldValue}>
              {new Date(userProfile.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className={styles.submitError}>
            {errors.submit}
          </div>
        )}
      </div>

      {/* Health Information */}
      <div className={styles.healthSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Health Information</h2>
          {editingSection !== 'health' && (
            <button
              className={styles.editSectionButton}
              onClick={() => setEditingSection('health')}
            >
              <FiEdit />
              Edit
            </button>
          )}
        </div>

        <div className={styles.healthGrid}>
          <div className={styles.healthCard}>
            <div className={styles.healthIcon}>
              <FiTarget />
            </div>
            <div className={styles.healthContent}>
              <div className={styles.healthLabel}>Health Goal</div>
              {editingSection === 'health' ? (
                <select
                  name="goal"
                  value={healthEditData.goal}
                  onChange={handleHealthInputChange}
                  className={`${styles.input} ${errors.goal ? styles.inputError : ''}`}
                  disabled={isSaving}
                >
                  <option value="">Select Goal</option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="lose_weight">Lose Weight</option>
                  <option value="gain_muscle">Gain Muscle</option>
                </select>
              ) : (
                <div className={styles.healthValue}>
                  {getHealthGoalText(userProfile.onboarding?.basicInfo?.goal)}
                </div>
              )}
              {errors.goal && <span className={styles.error}>{errors.goal}</span>}
            </div>
          </div>

          <div className={styles.healthCard}>
            <div className={styles.healthIcon}>
              <FiActivity />
            </div>
            <div className={styles.healthContent}>
              <div className={styles.healthLabel}>Activity Level</div>
              {editingSection === 'health' ? (
                <select
                  name="activityLevel"
                  value={healthEditData.activityLevel}
                  onChange={handleHealthInputChange}
                  className={`${styles.input} ${errors.activityLevel ? styles.inputError : ''}`}
                  disabled={isSaving}
                >
                  <option value="">Select Activity Level</option>
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light Activity</option>
                  <option value="moderate">Moderate Activity</option>
                  <option value="active">Active</option>
                  <option value="very_active">Very Active</option>
                </select>
              ) : (
                <div className={styles.healthValue}>
                  {getActivityLevelText(userProfile.onboarding?.lifestyle?.activityLevel)}
                </div>
              )}
              {errors.activityLevel && <span className={styles.error}>{errors.activityLevel}</span>}
            </div>
          </div>

          <div className={styles.healthCard}>
            <div className={styles.healthIcon}>
              📊
            </div>
            <div className={styles.healthContent}>
              <div className={styles.healthLabel}>BMI</div>
              <div className={styles.healthValue}>
                {userProfile.onboarding?.healthMetrics?.bmi || 'Not calculated'}
              </div>
            </div>
          </div>

          <div className={styles.healthCard}>
            <div className={styles.healthIcon}>
              🔥
            </div>
            <div className={styles.healthContent}>
              <div className={styles.healthLabel}>Daily Calories</div>
              <div className={styles.healthValue}>
                {userProfile.onboarding?.healthMetrics?.dailyCalories || 'Not set'} kcal
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dietary Preferences */}
      <div className={styles.preferencesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Dietary Preferences</h2>
          {editingSection !== 'preferences' && (
            <button
              className={styles.editSectionButton}
              onClick={() => setEditingSection('preferences')}
            >
              <FiEdit />
              Edit
            </button>
          )}
        </div>

        <div className={styles.preferencesGrid}>
          <div className={styles.preferenceCard}>
            <div className={styles.preferenceLabel}>Diet Type</div>
            {editingSection === 'preferences' ? (
              <select
                name="dietType"
                value={preferencesEditData.dietType}
                onChange={handlePreferencesInputChange}
                className={`${styles.input} ${errors.dietType ? styles.inputError : ''}`}
                disabled={isSaving}
              >
                <option value="">Select Diet Type</option>
                <option value="omnivore">Omnivore</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="pescatarian">Pescatarian</option>
                <option value="keto">Keto</option>
                <option value="paleo">Paleo</option>
                <option value="mediterranean">Mediterranean</option>
                <option value="low_carb">Low Carb</option>
                <option value="gluten_free">Gluten Free</option>
              </select>
            ) : (
              <div className={styles.preferenceValue}>
                {userProfile.onboarding?.preferences?.dietType || 'No restrictions'}
              </div>
            )}
            {errors.dietType && <span className={styles.error}>{errors.dietType}</span>}
          </div>

          <div className={styles.preferenceCard}>
            <div className={styles.preferenceLabel}>Disliked Foods</div>
            {editingSection === 'preferences' ? (
              <input
                type="text"
                name="dislikedFoods"
                value={preferencesEditData.dislikedFoods.join(', ')}
                onChange={handlePreferencesInputChange}
                placeholder="Enter foods separated by commas"
                className={`${styles.input} ${errors.dislikedFoods ? styles.inputError : ''}`}
                disabled={isSaving}
              />
            ) : (
              <div className={styles.preferenceValue}>
                {userProfile.onboarding?.preferences?.dislikedFoods?.length > 0
                  ? userProfile.onboarding.preferences.dislikedFoods.join(', ')
                  : 'None'}
              </div>
            )}
            {errors.dislikedFoods && <span className={styles.error}>{errors.dislikedFoods}</span>}
          </div>

          <div className={styles.preferenceCard}>
            <div className={styles.preferenceLabel}>Favorite Cuisine</div>
            {editingSection === 'preferences' ? (
              <input
                type="text"
                name="favoriteCuisine"
                value={preferencesEditData.favoriteCuisine.join(', ')}
                onChange={handlePreferencesInputChange}
                placeholder="Enter cuisines separated by commas"
                className={`${styles.input} ${errors.favoriteCuisine ? styles.inputError : ''}`}
                disabled={isSaving}
              />
            ) : (
              <div className={styles.preferenceValue}>
                {userProfile.onboarding?.preferences?.favoriteCuisine?.length > 0
                  ? userProfile.onboarding.preferences.favoriteCuisine.join(', ')
                  : 'None specified'}
              </div>
            )}
            {errors.favoriteCuisine && <span className={styles.error}>{errors.favoriteCuisine}</span>}
          </div>

          <div className={styles.preferenceCard}>
            <div className={styles.preferenceLabel}>Medical Conditions</div>
            {editingSection === 'preferences' ? (
              <input
                type="text"
                name="conditions"
                value={preferencesEditData.conditions.join(', ')}
                onChange={handlePreferencesInputChange}
                placeholder="Enter conditions separated by commas"
                className={`${styles.input} ${errors.conditions ? styles.inputError : ''}`}
                disabled={isSaving}
              />
            ) : (
              <div className={styles.preferenceValue}>
                {userProfile.onboarding?.medical?.conditions?.length > 0
                  ? userProfile.onboarding.medical.conditions.join(', ')
                  : 'None'}
              </div>
            )}
            {errors.conditions && <span className={styles.error}>{errors.conditions}</span>}
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className={styles.actionsSection}>
        <h2 className={styles.sectionTitle}>Account Actions</h2>
        
        <div className={styles.actionsGrid}>
          <button className={styles.actionButton}>
            <FiEdit />
            Update Health Metrics
          </button>
          
          <button className={styles.actionButton}>
            <FiTarget />
            Change Goals
          </button>
          
          <button className={styles.actionButton}>
            <FiActivity />
            Update Activity Level
          </button>
          
          <button className={styles.actionButton}>
            <FiMail />
            Change Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;




