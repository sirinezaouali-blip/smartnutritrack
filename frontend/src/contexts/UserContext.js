import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { userService } from '../services/userService';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const { user: authUser, updateUser: updateAuthUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update user profile when auth user changes
  useEffect(() => {
    if (authUser) {
      setUserProfile(authUser);
    }
  }, [authUser]);

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userService.updateProfile(profileData);
      
      if (response.success) {
        const updatedUser = response.data;
        setUserProfile(updatedUser);
        updateAuthUser(updatedUser);
        return { success: true, user: updatedUser };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateOnboarding = async (onboardingData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await userService.updateOnboarding(onboardingData);

      if (response.success) {
        const updatedUser = response.data;
        setUserProfile(updatedUser);
        updateAuthUser(updatedUser);
        return { success: true, user: updatedUser };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Update onboarding error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update onboarding';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await userService.completeOnboarding();

      if (response.success) {
        const updatedUser = response.data;
        setUserProfile(updatedUser);
        updateAuthUser(updatedUser);
        return { success: true, user: updatedUser };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Complete onboarding error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to complete onboarding';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getHealthMetrics = () => {
    if (!userProfile?.onboarding?.healthMetrics) {
      return null;
    }
    return userProfile.onboarding.healthMetrics;
  };

  const getDailyCalories = () => {
    const metrics = getHealthMetrics();
    return metrics?.dailyCalories || 2000;
  };

  const getCalorieTargets = () => {
    const metrics = getHealthMetrics();
    return {
      calories: metrics?.dailyCalories || 2000,
      protein: metrics?.proteinTarget || 150,
      carbs: metrics?.carbsTarget || 250,
      fats: metrics?.fatsTarget || 65
    };
  };

  const getDietaryPreferences = () => {
    return userProfile?.onboarding?.preferences || {};
  };

  const getMedicalInfo = () => {
    return userProfile?.onboarding?.medical || {};
  };

  const getLifestyleInfo = () => {
    return userProfile?.onboarding?.lifestyle || {};
  };

  const getBasicInfo = () => {
    return userProfile?.onboarding?.basicInfo || {};
  };

  const refreshUserData = async () => {
    try {
      setLoading(true);
      const response = await userService.getCurrentUser();

      if (response.success) {
        const updatedUser = response.data;
        setUserProfile(updatedUser);
        updateAuthUser(updatedUser);
        return { success: true, user: updatedUser };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Refresh user data error:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to refresh user data' };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    userProfile,
    loading,
    error,
    updateProfile,
    updateOnboarding,
    completeOnboarding,
    getHealthMetrics,
    getDailyCalories,
    getCalorieTargets,
    getDietaryPreferences,
    getMedicalInfo,
    getLifestyleInfo,
    getBasicInfo,
    refreshUserData,
    clearError: () => setError(null)
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

