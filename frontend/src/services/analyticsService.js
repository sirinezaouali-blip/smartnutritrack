import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

class AnalyticsService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/analytics`,
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

  async getDailyProgress(date) {
    try {
      const response = await this.api.get(`/daily?date=${date}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getWeeklyProgress(weekStart) {
    try {
      const response = await this.api.get(`/weekly?start=${weekStart}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getMonthlyProgress(year, month) {
    try {
      const response = await this.api.get(`/monthly?year=${year}&month=${month}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getCalorieTrends(timeframe = 'week') {
    try {
      const response = await this.api.get(`/calorie-trends?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getNutrientBreakdown(timeframe = 'week') {
    try {
      const response = await this.api.get(`/nutrient-breakdown?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getMealTypeDistribution(timeframe = 'week') {
    try {
      const response = await this.api.get(`/meal-distribution?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getGoalProgress(timeframe = 'week') {
    try {
      const response = await this.api.get(`/goal-progress?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getWeightTrends() {
    try {
      const response = await this.api.get('/weight-trends');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getHealthMetricsHistory() {
    try {
      const response = await this.api.get('/health-metrics-history');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getMealFrequencyAnalysis() {
    try {
      const response = await this.api.get('/meal-frequency');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getDietaryPatternAnalysis() {
    try {
      const response = await this.api.get('/dietary-patterns');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getCuisinePreferences() {
    try {
      const response = await this.api.get('/cuisine-preferences');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getCalorieBalance(timeframe = 'week') {
    try {
      const response = await this.api.get(`/calorie-balance?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getMacroRatios(timeframe = 'week') {
    try {
      const response = await this.api.get(`/macro-ratios?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getWaterIntake(timeframe = 'week') {
    try {
      const response = await this.api.get(`/water-intake?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getExerciseCalories(timeframe = 'week') {
    try {
      const response = await this.api.get(`/exercise-calories?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getSleepAnalysis(timeframe = 'week') {
    try {
      const response = await this.api.get(`/sleep-analysis?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getStressLevels(timeframe = 'week') {
    try {
      const response = await this.api.get(`/stress-levels?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getOverallHealthScore(timeframe = 'month') {
    try {
      const response = await this.api.get(`/health-score?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getInsights(timeframe = 'week') {
    try {
      const response = await this.api.get(`/insights?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getRecommendations() {
    try {
      const response = await this.api.get('/recommendations');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getExportData(format = 'json', timeframe = 'all') {
    try {
      const response = await this.api.get(`/export?format=${format}&timeframe=${timeframe}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getDashboardSummary() {
    try {
      const response = await this.api.get('/dashboard-summary');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getComparativeAnalysis(compareWith = 'previous_week') {
    try {
      const response = await this.api.get(`/comparative?compare=${compareWith}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getAchievements() {
    try {
      const response = await this.api.get('/achievements');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getStreaks() {
    try {
      const response = await this.api.get('/streaks');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getSocialStats() {
    try {
      const response = await this.api.get('/social-stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  }


  createMealBreakdown(mealsByType) {
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    return mealTypes.map(type => {
      const meals = mealsByType[type] || [];
      return {
        calories: meals.reduce((sum, m) => sum + (m.calories || 0), 0),
        protein: meals.reduce((sum, m) => sum + (m.protein || 0), 0),
        carbs: meals.reduce((sum, m) => sum + (m.carbs || 0), 0),
        fat: meals.reduce((sum, m) => sum + (m.fat || 0), 0)
      };
    });
  }

  async fetchAnalyticsData(timeframe = 'today') {
    try {
      let response;
      if (timeframe === 'today' || timeframe === 'daily') {
        const today = new Date().toISOString().split('T')[0];
        response = await this.api.get(`/daily/${today}`);
      } else if (timeframe === 'weekly') {
        response = await this.api.get('/weekly');
      } else if (timeframe === 'monthly') {
        response = await this.api.get('/monthly');
      } else {
        throw new Error(`Unsupported timeframe: ${timeframe}`);
      }

      // Map backend response to unified frontend structure
      const backendData = response.data.data;
      let mappedData = {};

      if (timeframe === 'today' || timeframe === 'daily') {
        mappedData = {
          caloriesConsumed: backendData?.totals?.calories || 0,
          caloriesTarget: backendData?.targets?.calories || 2000,
          proteinConsumed: backendData?.totals?.protein || 0,
          proteinTarget: backendData?.targets?.protein || 150,
          carbsConsumed: backendData?.totals?.carbs || 0,
          carbsTarget: backendData?.targets?.carbs || 250,
          fatConsumed: backendData?.totals?.fat || 0,
          fatTarget: backendData?.targets?.fat || 67,
          averageCalories: backendData?.totals?.calories || 0,
          streak: 0,
          waterIntake: 0,
          mealCount: backendData?.mealCount || 0,
          weeklyProgress: null,
          // Add for chart - create breakdown by meal type
          mealBreakdown: this.createMealBreakdown(backendData?.mealsByType || {}),
          target: backendData?.targets?.calories || 2000
        };
      } else if (timeframe === 'weekly') {
        mappedData = {
          caloriesConsumed: backendData?.weeklyTotals?.calories || 0,
          caloriesTarget: (backendData?.target || 14000), // 7 days * 2000
          proteinConsumed: backendData?.weeklyTotals?.protein || 0,
          proteinTarget: 1050, // 7 * 150
          carbsConsumed: backendData?.weeklyTotals?.carbs || 0,
          carbsTarget: 1750, // 7 * 250
          fatConsumed: backendData?.weeklyTotals?.fat || 0,
          fatTarget: 469, // 7 * 67
          averageCalories: backendData?.weeklyAverage?.calories || 0,
          streak: 0, // Placeholder
          waterIntake: 0, // Placeholder
          mealCount: backendData?.dailyData?.filter(day => day.calories > 0).length || 0,
          weeklyProgress: backendData?.dailyData || null,
          // Add for chart
          dailyData: backendData?.dailyData || [],
          target: backendData?.target ? backendData.target / 7 : 2000
        };
      } else if (timeframe === 'monthly') {
        const daysInMonth = backendData?.monthlyData?.length || 30;
        mappedData = {
          caloriesConsumed: backendData?.monthlyTotals?.calories || 0,
          caloriesTarget: backendData?.target || 62000, // ~30 days * 2000
          proteinConsumed: backendData?.monthlyTotals?.protein || 0,
          proteinTarget: 4500, // ~30 * 150
          carbsConsumed: backendData?.monthlyTotals?.carbs || 0,
          carbsTarget: 7500, // ~30 * 250
          fatConsumed: backendData?.monthlyTotals?.fat || 0,
          fatTarget: 2010, // ~30 * 67
          averageCalories: backendData?.monthlyAverage?.calories || 0,
          streak: 0, // Placeholder
          waterIntake: 0, // Placeholder
          mealCount: backendData?.daysTracked || 0,
          weeklyProgress: null,
          // Add for chart
          monthlyData: backendData?.monthlyData || [],
          target: backendData?.target ? backendData.target / daysInMonth : 2000
        };
      }

      return {
        success: response.data.success,
        data: mappedData
      };
    } catch (error) {
      console.error('fetchAnalyticsData error:', error);
      // Return default data structure to prevent dashboard crash
      return {
        success: false,
        data: {
          caloriesConsumed: 0,
          caloriesTarget: 2000,
          proteinConsumed: 0,
          proteinTarget: 150,
          carbsConsumed: 0,
          carbsTarget: 250,
          fatConsumed: 0,
          fatTarget: 67,
          averageCalories: 0,
          streak: 0,
          waterIntake: 0,
          mealCount: 0,
          weeklyProgress: null
        },
        error: error.message
      };
    }
  }

  // Fetch user meals for a specific date
  async fetchUserMeals(date) {
    try {
      // Use the user-meals API instead of analytics
      const userMealsApi = axios.create({
        baseURL: `${API_BASE_URL}/api/user-meals`,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Add token to requests
      userMealsApi.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });

      // Handle token expiration
      userMealsApi.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      );

      const response = await userMealsApi.get(`/${date}`);
      return {
        success: response.data.success,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('fetchUserMeals error:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }
  // Fetch meal history
  async fetchMealHistory(page = 1, limit = 20) {
    try {
      // Use the user-meals API for meal history instead of analytics
      const userMealsApi = axios.create({
        baseURL: `${API_BASE_URL}/api/user-meals`,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Add token to requests
      userMealsApi.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });

      // Handle token expiration
      userMealsApi.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      );

      const response = await userMealsApi.get(`/history/recent`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

const analyticsServiceInstance = new AnalyticsService();

// Named exports for backward compatibility
export const fetchAnalyticsData = (timeframe) => analyticsServiceInstance.fetchAnalyticsData(timeframe);
export const fetchUserMeals = (date) => analyticsServiceInstance.fetchUserMeals(date);
export const fetchMealHistory = (page, limit) => analyticsServiceInstance.fetchMealHistory(page, limit);

export const analyticsService = analyticsServiceInstance;




