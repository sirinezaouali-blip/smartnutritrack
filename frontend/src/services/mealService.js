import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

class MealService {
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

  async getAllMeals(page = 1, limit = 20, filters = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      });
      const response = await this.api.get(`/meals?${params}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async searchMeals(query, filters = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters,
      });
      const response = await this.api.get(`/meals/search?${params}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getMealById(id) {
    try {
      const response = await this.api.get(`/meals/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createMeal(mealData) {
    try {
      const response = await this.api.post('/meals', mealData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateMeal(id, mealData) {
    try {
      const response = await this.api.put(`/meals/${id}`, mealData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteMeal(id) {
    try {
      const response = await this.api.delete(`/meals/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }



  // Save a meal for the user
  async saveMeal(mealData) {
    try {
      // First create the meal in the meals collection
      const mealResponse = await this.api.post('/meals', {
        name: mealData.name,
        description: mealData.description,
        type: mealData.mealType,
        calories: mealData.calories,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fat: mealData.fat,
        ingredients: mealData.ingredients,
        servingSize: mealData.servingSize,
        notes: mealData.notes
      });

      if (!mealResponse.data.success) {
        throw new Error(mealResponse.data.message || 'Failed to create meal');
      }

      const createdMeal = mealResponse.data.data;

      // Then add it to user's meal diary
      const userMealResponse = await this.api.post('/user-meals', {
        mealId: createdMeal._id,
        date: mealData.date,
        mealType: mealData.mealType,
        quantity: 1,
        notes: mealData.notes
      });

      return userMealResponse.data;
    } catch (error) {
      throw error;
    }
  }

  // Fetch meal plans for the user
  async fetchMealPlans() {
    try {
      // Since there's no backend endpoint for fetching meal plans yet,
      // return empty array to prevent errors
      return {
        success: true,
        data: []
      };
    } catch (error) {
      throw error;
    }
  }
}

const mealServiceInstance = new MealService();

// Named exports for backward compatibility
export const saveMeal = (mealData) => mealServiceInstance.saveMeal(mealData);
export const fetchMealPlans = () => mealServiceInstance.fetchMealPlans();

export const mealService = mealServiceInstance;




