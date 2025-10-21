import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Check if user is authenticated on app load
  useEffect(() => {
  const checkAuth = async () => {
    try {
      console.log('🔍 Checking auth with token:', !!token);
      if (token) {
        const userData = await authService.getCurrentUser();
        console.log('✅ User data from /api/auth/me:', userData);
        
        if (userData.success) {
          console.log('🔍 Onboarding status:', userData.data.onboarding?.completed);
          console.log('🔍 Full onboarding object:', userData.data.onboarding);
          setUser(userData.data);
        } else {
          console.log('❌ Auth endpoint failed:', userData.message);
        }
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  checkAuth();
}, [token]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);
      
      if (response.success) {
        // Backend returns: { success, data: { id, firstName, ..., token } }
        const { token: authToken, ...userData } = response.data;
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('token', authToken);
        return { success: true, user: userData };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      setLoading(true);
      const response = await authService.verifyEmail(email, code);
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, message: error.response?.data?.message || 'Verification failed' };
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    try {
      const response = await authService.resendVerificationCode();
      return { success: response.success, message: response.message };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to resend code' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const isOnboardingComplete = () => {
    return user?.onboarding?.completed === true;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    verifyEmail,
    resendVerificationCode,
    logout,
    updateUser,
    isAuthenticated,
    isOnboardingComplete
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

