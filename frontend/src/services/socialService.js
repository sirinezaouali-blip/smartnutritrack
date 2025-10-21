import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Social API service
export const socialService = {
  // Get social feed
  getFeed: async (params = {}) => {
    try {
      const response = await api.get('/social/feed', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching feed:', error);
      throw error;
    }
  },

  // Create a new post
  createPost: async (postData) => {
    try {
      const response = await api.post('/social/posts', postData);
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Upload image for post
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/social/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  // Get user's posts
  getMyPosts: async (params = {}) => {
    try {
      const response = await api.get('/social/posts/my', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching my posts:', error);
      throw error;
    }
  },

  // Get post by ID
  getPostById: async (postId) => {
    try {
      const response = await api.get(`/social/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  // Like/unlike a post
  toggleLike: async (postId) => {
    try {
      const response = await api.post(`/social/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  // Add comment to post
  addComment: async (postId, commentData) => {
    try {
      const response = await api.post(`/social/posts/${postId}/comment`, commentData);
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Share a post
  sharePost: async (postId) => {
    try {
      const response = await api.post(`/social/posts/${postId}/share`);
      return response.data;
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  },

  // Delete a post
  deletePost: async (postId) => {
    try {
      const response = await api.delete(`/social/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  // Report a post
  reportPost: async (postId, reportData) => {
    try {
      const response = await api.post(`/social/posts/${postId}/report`, reportData);
      return response.data;
    } catch (error) {
      console.error('Error reporting post:', error);
      throw error;
    }
  },

  // Upload image for post
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/social/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  // Share a post
  sharePost: async (postId) => {
    try {
      const response = await api.post(`/social/posts/${postId}/share`);
      return response.data;
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  },

  // Update a post
  updatePost: async (postId, updateData) => {
    try {
      const response = await api.put(`/social/posts/${postId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  // Delete a post
  deletePost: async (postId) => {
    try {
      const response = await api.delete(`/social/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  // Get trending posts
  getTrendingPosts: async (limit = 10) => {
    try {
      const response = await api.get('/social/trending', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending posts:', error);
      throw error;
    }
  },

  // Get most engaged posts
  getMostEngagedPosts: async (limit = 10, timeframe = 'week') => {
    try {
      const response = await api.get('/social/most-engaged', { params: { limit, timeframe } });
      return response.data;
    } catch (error) {
      console.error('Error fetching most engaged posts:', error);
      throw error;
    }
  },

  // Toggle comment like
  toggleCommentLike: async (postId, commentId) => {
    try {
      const response = await api.post(`/social/posts/${postId}/comments/${commentId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  },

  // Follow a user
  followUser: async (userId) => {
    try {
      const response = await api.post(`/users/follow/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  },

  // Unfollow a user
  unfollowUser: async (userId) => {
    try {
      const response = await api.delete(`/users/follow/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  },

  // Get user's followers
  getFollowers: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/followers`);
      return response.data;
    } catch (error) {
      console.error('Error fetching followers:', error);
      throw error;
    }
  },

  // Get users that a user is following
  getFollowing: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/following`);
      return response.data;
    } catch (error) {
      console.error('Error fetching following:', error);
      throw error;
    }
  },

  // Get follow suggestions
  getFollowSuggestions: async (limit = 10) => {
    try {
      const response = await api.get('/users/follow-suggestions', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching follow suggestions:', error);
      throw error;
    }
  }
};

export default socialService;
