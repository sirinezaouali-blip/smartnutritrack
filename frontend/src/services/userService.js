import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

class UserService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/users`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle token expiration
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async getCurrentUser() {
    try {
      const response = await this.api.get('/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await this.api.put('/profile', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateOnboarding(onboardingData) {
    try {
    
      const response = await this.api.patch('/onboarding', onboardingData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async completeOnboarding() {
    try {
      const response = await this.api.post('/onboarding/complete');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updatePreferences(preferences) {
    try {
      const response = await this.api.put('/preferences', preferences);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateBasicInfo(basicInfo) {
    try {
      const response = await this.api.put('/basic-info', basicInfo);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateMedicalInfo(medicalInfo) {
    try {
      const response = await this.api.put('/medical-info', medicalInfo);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateLifestyleInfo(lifestyleInfo) {
    try {
      const response = await this.api.put('/lifestyle-info', lifestyleInfo);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getHealthMetrics() {
    try {
      const response = await this.api.get('/health-metrics');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async recalculateHealthMetrics() {
    try {
      const response = await this.api.post('/health-metrics/recalculate');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getProgressData(timeframe = 'week') {
    try {
      const response = await this.api.get(`/progress?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getMealHistory(page = 1, limit = 20) {
    try {
      const response = await this.api.get(`/meal-history?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getTodayMeals() {
    try {
      const response = await this.api.get('/today-meals');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getWeeklyProgress() {
    try {
      const response = await this.api.get('/weekly-progress');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getAnalyticsData(timeframe = 'month') {
    try {
      const response = await this.api.get(`/analytics?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async exportData(format = 'json') {
    try {
      const response = await this.api.get(`/export?format=${format}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteAccount() {
    try {
      const response = await this.api.delete('/account');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(profileData) {
    try {
      const response = await this.api.put('/profile', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

const userServiceInstance = new UserService();

// Named exports for backward compatibility
export const updateUserProfile = (profileData) => userServiceInstance.updateUserProfile(profileData);

export const userService = userServiceInstance;









