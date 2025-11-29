import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

class ScanService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/scan`,
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

  // Scan fruits and vegetables using custom CNN model
  async scanFruitsVegetablesFromFile(file) {
    try {
      // Create FormData for file upload (as the Python API expects)
      const formData = new FormData();
      formData.append('image', file); // Append the file directly
      
      // Call the Python AI backend DIRECTLY for fruits/vegetables
      const response = await axios.post(
        'http://localhost:8000/api/scan/food', // DIRECT Python AI endpoint
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Scan fruits/vegetables from file error:', error);
      throw error;
    }
  }

  // Scan food image using base64
  async scanImage(imageBase64, scanType = 'food') {
    try {
      const response = await this.api.post('/image', {
        imageBase64,
        scanType
      });
      return response.data;
    } catch (error) {
      console.error('Scan image error:', error);
      throw error;
    }
  }

  // Scan barcode
  async scanBarcode(barcode) {
    try {
      const response = await this.api.post('/barcode', {
        barcode
      });
      return response.data;
    } catch (error) {
      console.error('Scan barcode error:', error);
      throw error;
    }
  }

  // Recognize dish
  // Recognize dish
  async recognizeDish(imageBase64) {
    try {
      const response = await this.api.post('/dish', {
        imageBase64
      });
      return response.data;
    } catch (error) {
      console.error('Recognize dish error:', error);
      throw error;
    }
  }

  // Get scan history
  async getScanHistory(page = 1, limit = 10, type = null) {
    try {
      const params = { page, limit };
      if (type) params.type = type;
      
      const response = await this.api.get('/history', { params });
      return response.data;
    } catch (error) {
      console.error('Get scan history error:', error);
      throw error;
    }
  }

  // Utility function to convert file to base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:image/...;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
  
  // Scan image from file (converts to base64 automatically)
  async scanImageFromFile(file, scanType = 'food') {
    try {
      // Convert file to base64 first
      const imageBase64 = await this.fileToBase64(file);
      
      // Use the existing scanImage method that uses the axios instance with interceptors
      return await this.scanImage(imageBase64, scanType);
    } catch (error) {
      console.error('Scan image from file error:', error);
      throw error;
    }
  }

  // Recognize dish from file
  async recognizeDishFromFile(file) {
    try {
      // Convert file to base64 first (same as scanImageFromFile)
      const imageBase64 = await this.fileToBase64(file);
      
      // Use the existing recognizeDish method that uses the axios instance with interceptors
      return await this.recognizeDish(imageBase64);
    } catch (error) {
      console.error('Recognize dish from file error:', error);
      throw error;
    }
  }
}

const scanServiceInstance = new ScanService();

export const scanImage = (imageBase64, scanType) => scanServiceInstance.scanImage(imageBase64, scanType);
export const scanBarcode = (barcode) => scanServiceInstance.scanBarcode(barcode);
export const recognizeDish = (imageBase64) => scanServiceInstance.recognizeDish(imageBase64);
export const getScanHistory = (page, limit, type) => scanServiceInstance.getScanHistory(page, limit, type);
export const fileToBase64 = (file) => scanServiceInstance.fileToBase64(file);
export const scanImageFromFile = (file, scanType) => scanServiceInstance.scanImageFromFile(file, scanType);
export const recognizeDishFromFile = (file) => scanServiceInstance.recognizeDishFromFile(file);
export const scanFruitsVegetablesFromFile = (file) => scanServiceInstance.scanFruitsVegetablesFromFile(file);

export const scanService = scanServiceInstance;