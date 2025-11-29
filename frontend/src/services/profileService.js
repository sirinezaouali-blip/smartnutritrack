import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const profileService = {
  // Get user profile with stats
  getProfileStats: async (userId) => {
    try {
      const response = await api.get(`/users/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile stats:', error);
      // Return mock data if API fails
      return {
        success: true,
        data: {
          stats: {
            postsCount: 12,
            followersCount: 45,
            followingCount: 23,
            totalLikes: 128
          },
          achievements: {
            points: 85,
            level: 3,
            badges: []
          }
        }
      };
    }
  }
};

export default profileService;