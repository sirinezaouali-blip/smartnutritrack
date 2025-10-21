import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
const AI_BASE_URL = process.env.REACT_APP_AI_BASE_URL || 'http://localhost:8000';

class AIService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/ai`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.aiApi = axios.create({
      baseURL: AI_BASE_URL,
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

  // Food Scanning Services
  async scanFood(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await this.api.post('/scan-food', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async scanBarcode(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await this.api.post('/scan-barcode', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getNutritionData(foodName) {
    try {
      const response = await this.api.get(`/nutrition/${encodeURIComponent(foodName)}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getMealSuggestions(preferences) {
    try {
      const response = await this.api.post('/meal-suggestions', preferences);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Direct AI API calls for advanced features
  async scanFoodDirect(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await this.aiApi.post('/api/scan/food', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds for AI processing
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async scanBarcodeDirect(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await this.aiApi.post('/api/scan/barcode', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 15000,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getNutritionDirect(foodName) {
    try {
      const response = await this.aiApi.get(`/api/nutrition/${encodeURIComponent(foodName)}`, {
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getMealRecommendations(mealRequest) {
    try {
      const response = await this.aiApi.post('/api/recommend-meal', mealRequest, {
        timeout: 15000,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getMealSuggestionsDirect(userPreferences) {
    try {
      const response = await this.aiApi.post('/api/planner/suggest', userPreferences, {
        timeout: 20000,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async healthCheck() {
    try {
      const response = await this.aiApi.get('/health', {
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Utility methods for AI service integration
  async getSingleMealRecommendations(mealType, preference = '', userDailyCalories = 2000, maxResults = 10) {
    try {
      const mealRequest = {
        meal_type: mealType,
        preference: preference,
        user_daily_calories: userDailyCalories,
        max_results: maxResults,
      };

      const response = await this.getMealRecommendations(mealRequest);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getMultipleMealPlans(userDailyCalories = 2000, preferences = {}) {
    try {
      const userPreferences = {
        target_calories: userDailyCalories,
        preferences: preferences,
      };

      const response = await this.getMealSuggestionsDirect(userPreferences);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getDailyMealPlan(userId, remainingCalories, preferences = {}) {
    try {
      const userPreferences = {
        user_id: userId,
        remaining_calories: remainingCalories,
        preferences: preferences,
        plan_type: 'daily',
      };

      const response = await this.getMealSuggestionsDirect(userPreferences);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getMealPlanVariations(userDailyCalories = 2000, numberOfPlans = 3) {
    try {
      const userPreferences = {
        target_calories: userDailyCalories,
        number_of_variations: numberOfPlans,
        plan_type: 'variations',
      };

      const response = await this.getMealSuggestionsDirect(userPreferences);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Error handling and fallback methods
  async handleAIServiceError(error) {
    console.error('AI Service Error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        message: 'AI service is currently unavailable. Please try again later.',
        error: 'SERVICE_UNAVAILABLE'
      };
    }

    if (error.response?.status === 500) {
      return {
        success: false,
        message: 'AI processing failed. Please try again.',
        error: 'PROCESSING_ERROR'
      };
    }

    if (error.response?.status === 400) {
      return {
        success: false,
        message: 'Invalid request. Please check your input.',
        error: 'INVALID_REQUEST'
      };
    }

    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
      error: 'UNKNOWN_ERROR'
    };
  }

  // Check if AI services are available
  async checkAIServicesStatus() {
    try {
      const [backendHealth, aiHealth] = await Promise.allSettled([
        this.api.get('/health'),
        this.healthCheck()
      ]);

      return {
        backend: backendHealth.status === 'fulfilled',
        ai: aiHealth.status === 'fulfilled',
        backendData: backendHealth.status === 'fulfilled' ? backendHealth.value.data : null,
        aiData: aiHealth.status === 'fulfilled' ? aiHealth.value : null,
      };
    } catch (error) {
      return {
        backend: false,
        ai: false,
        error: error.message
      };
    }
  }

  // Generate daily meal plan
  async generateDailyMealPlan(requestData) {
    try {
      const response = await this.getMealSuggestionsDirect(requestData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Generate multiple meal plans
  async generateMultipleMealPlans(requestData) {
    try {
      const response = await this.getMultipleMealPlans(requestData.userDailyCalories, requestData.preferences);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get product info by barcode or search term
  async getProductInfo(identifier) {
    try {
      // Try barcode first
      if (/^\d+$/.test(identifier)) {
        const response = await this.scanBarcodeDirect(identifier);
        return response;
      } else {
        // Search by product name
        const response = await this.getNutritionDirect(identifier);
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  // Analyze dish image
  async analyzeDishImage(formData) {
    try {
      const response = await this.scanFoodDirect(formData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Analyze produce image
  async analyzeProduceImage(formData) {
    try {
      const response = await this.scanFoodDirect(formData);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

const aiServiceInstance = new AIService();

// Named exports for backward compatibility
export const generateDailyMealPlan = (requestData) => aiServiceInstance.generateDailyMealPlan(requestData);
export const generateMultipleMealPlans = (requestData) => aiServiceInstance.generateMultipleMealPlans(requestData);
export const getProductInfo = (identifier) => aiServiceInstance.getProductInfo(identifier);
export const analyzeDishImage = (formData) => aiServiceInstance.analyzeDishImage(formData);
export const analyzeProduceImage = (formData) => aiServiceInstance.analyzeProduceImage(formData);

export const aiService = aiServiceInstance;




