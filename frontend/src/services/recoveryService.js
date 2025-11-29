import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

class RecoveryService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api`,
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

  async assessRecovery(currentMeal, consumptionData) {
    try {
      const response = await this.api.post('/recovery/assess', {
        currentMeal,
        consumptionData
      });
      return response.data;
    } catch (error) {
      console.error('Recovery assessment error:', error);
      throw error;
    }
  }

  async generateMultiDayPlan(totalExcess, remainingDays = 3) {
    try {
      const response = await this.api.post('/recovery/multi-day-plan', {
        totalExcess,
        remainingDays
      });
      return response.data;
    } catch (error) {
      console.error('Multi-day plan generation error:', error);
      throw error;
    }
  }
}

const recoveryServiceInstance = new RecoveryService();

export const recoveryService = recoveryServiceInstance;
