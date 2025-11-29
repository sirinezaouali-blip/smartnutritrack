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

export const searchService = {
  // Search posts
  searchPosts: async (params = {}) => {
    try {
      const response = await api.get('/search/posts', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  },

  // Get trending hashtags
  getTrendingHashtags: async (limit = 10, timeframe = 'week') => {
    try {
      const response = await api.get('/search/trending-hashtags', {
        params: { limit, timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
      throw error;
    }
  },

  // Get posts by hashtag
  getPostsByHashtag: async (hashtag, params = {}) => {
    try {
      const response = await api.get(`/search/hashtag/${encodeURIComponent(hashtag)}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching posts by hashtag:', error);
      throw error;
    }
  },

  // Search users
  searchUsers: async (query, params = {}) => {
    try {
      const response = await api.get('/search/users', {
        params: { q: query, ...params }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
};

export default searchService;