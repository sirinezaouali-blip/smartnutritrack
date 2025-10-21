import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

class AuthService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/auth`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if available
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

  async login(email, password) {
    try {
      const response = await this.api.post('/login', {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await this.api.post('/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(email, code) {
    try {
      const response = await this.api.post('/verify-email', { 
        email, 
        verificationCode: code 
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async resendVerificationCode() {
    try {
      const response = await this.api.post('/resend-verification');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async forgotPassword(email) {
    try {
      const response = await this.api.post('/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const response = await this.api.post('/reset-password', {
        token,
        password: newPassword,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await this.api.get('/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updatePassword(currentPassword, newPassword) {
    try {
      const response = await this.api.put('/password', {
        currentPassword,
        newPassword,
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

  logout() {
    localStorage.removeItem('token');
  }
}

export const authService = new AuthService();




