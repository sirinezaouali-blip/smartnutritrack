const axios = require('axios');
const FormData = require('form-data');

const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'http://localhost:5001';

// @desc    Scan food image (fruits/vegetables or dishes)
// @route   POST /api/ai/scan-food
// @access  Private
const scanFood = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }

    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Forward to AI backend
    const response = await axios.post(
      `${AI_BACKEND_URL}/api/scan/fruits-vegetables`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000
      }
    );

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Scan food error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scan food image',
      error: error.message
    });
  }
};

// @desc    Scan barcode
// @route   POST /api/ai/scan-barcode
// @access  Private
const scanBarcode = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }

    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Forward to AI backend
    const response = await axios.post(
      `${AI_BACKEND_URL}/api/scan/barcode`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 15000
      }
    );

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Scan barcode error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scan barcode',
      error: error.message
    });
  }
};

// @desc    Get nutrition data for food item
// @route   GET /api/ai/nutrition/:foodName
// @access  Private
const getNutritionData = async (req, res) => {
  try {
    const { foodName } = req.params;

    if (!foodName) {
      return res.status(400).json({
        success: false,
        message: 'Food name is required'
      });
    }

    // Could call external nutrition API or AI backend
    // For now, return from database or AI backend
    res.json({
      success: true,
      message: 'Nutrition data endpoint - implement as needed',
      data: {
        foodName,
        note: 'Use CNN service or external API for nutrition data'
      }
    });
  } catch (error) {
    console.error('Get nutrition data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nutrition data',
      error: error.message
    });
  }
};

// @desc    Get meal suggestions from AI
// @route   POST /api/ai/meal-suggestions
// @access  Private
const getMealSuggestions = async (req, res) => {
  try {
    const { preferences } = req.body;
    const userId = req.userId;

    // Forward to AI backend with user context
    const response = await axios.post(
      `${AI_BACKEND_URL}/api/planner/single-meal`,
      {
        user_id: userId,
        meal_type: preferences?.mealType || 'lunch',
        target_calories: preferences?.targetCalories || 500,
        limit: preferences?.limit || 20
      },
      {
        timeout: 20000
      }
    );

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Get meal suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meal suggestions',
      error: error.message
    });
  }
};

// @desc    Health check for AI services
// @route   GET /api/ai/health
// @access  Public
const healthCheck = async (req, res) => {
  try {
    const response = await axios.get(`${AI_BACKEND_URL}/health`, {
      timeout: 5000
    });

    res.json({
      success: true,
      aiBackend: response.data,
      message: 'AI services are running'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'AI services unavailable',
      error: error.message
    });
  }
};

module.exports = {
  scanFood,
  scanBarcode,
  getNutritionData,
  getMealSuggestions,
  healthCheck
};
