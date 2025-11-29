const Meal = require('../models/Meal');
const aiService = require('../utils/aiService');

// @desc    Scan food barcode
// @route   POST /api/scan/barcode
// @access  Private
const scanBarcode = async (req, res) => {
  try {
    const { barcode } = req.body;
    const userId = req.userId;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: 'Barcode is required'
      });
    }

    // In a real implementation, this would call an external barcode API
    // For now, we'll search our database for meals with barcodes
    let meal = await Meal.findOne({ barcode: barcode });

    if (!meal) {
      // Simulate external API call with mock data
      meal = await simulateBarcodeAPICall(barcode);
      
      if (meal) {
        // Save the new meal to our database
        meal = await Meal.create({
          name: meal.name,
          type: meal.type || 'snack',
          calories: meal.calories,
          protein: meal.protein || 0,
          carbs: meal.carbs || 0,
          fat: meal.fat || 0,
          barcode: barcode,
          isCustom: true,
          source: 'barcode_scan'
        });
      }
    }

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found for this barcode'
      });
    }

    res.json({
      success: true,
      message: 'Barcode scanned successfully',
      data: {
        meal,
        source: meal.source || 'database'
      }
    });
  } catch (error) {
    console.error('Barcode scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error scanning barcode',
      error: error.message
    });
  }
};

// @desc    Scan food image (Dish or Fruits/Vegetables)
// @route   POST /api/scan/image
// @access  Private
// @desc    Scan food image (Dish or Fruits/Vegetables)
// @route   POST /api/scan/image
// @access  Private
const scanImage = async (req, res) => {
  console.log('🚀 SCAN IMAGE ENDPOINT HIT!');
  console.log('📦 Request body keys:', Object.keys(req.body));
  console.log('📦 Request body received');
  console.log('🖼️ Image base64 length:', req.body.imageBase64?.length);
  console.log('🔍 Scan type:', req.body.scanType);

  try {
    const { imageBase64, scanType = 'dish' } = req.body; // 'dish' or 'fruits_vegetables'
    const userId = req.userId;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    // Call the actual AI service for food recognition
    const aiResult = await aiService.scanFood(imageBuffer, 'food-scan.jpg');

    console.log('🔍 AI Service Response:', JSON.stringify(aiResult, null, 2));

    if (!aiResult.success || !aiResult.prediction) {
      return res.status(400).json({
        success: false,
        message: 'Could not identify food from image',
        error: aiResult.error || 'AI service returned no prediction'
      });
    }

    const prediction = aiResult.prediction;

    // EXTRACT THE ACTUAL PREDICTION DATA FROM NESTED STRUCTURE
    const topPrediction = prediction.top_prediction || {};
    const foodName = topPrediction.food_name || 'Unknown';
    const confidence = topPrediction.confidence || 0;
    const category = topPrediction.category || 'general';

    console.log('🎯 Extracted prediction:', { foodName, confidence, category });
    
    // Search for matching meal in database
    // Search for matching meal in database - WITH ERROR HANDLING
    let meal = null;
    try {
      if (prediction.foodName && typeof prediction.foodName === 'string') {
        meal = await Meal.findOne({
          name: { $regex: prediction.foodName, $options: 'i' }
        });
        console.log('✅ Database search completed');
      }
    } catch (dbError) {
      console.warn('⚠️ Database search failed, continuing without meal data:', dbError.message);
      meal = null;
    }

// Skip similar meals search to avoid more errors

    // Get nutrition data from AI service
    let nutritionData = null;
    try {
      console.log('🍎 Getting nutrition for:', foodName);
      nutritionData = await aiService.getNutrition(foodName);
      console.log('📊 Nutrition data:', nutritionData);
      
    } catch (nutritionError) {
      console.warn('Nutrition data fetch failed:', nutritionError.message);
      // Continue without nutrition data
    }

    res.json({
      success: true,
      message: 'Image scanned successfully',
      data: {
        prediction: {
          foodName: foodName,
          confidence: confidence,
          category: category,
        },
        meal: meal || null,
        nutrition: nutritionData,
        suggestions: null
      }
    });
  } catch (error) {
    console.error('Image scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error scanning image',
      error: error.message
    });
  }
};

// @desc    Process dish recognition
// @route   POST /api/scan/dish
// @access  Private
const recognizeDish = async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const userId = req.userId;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      });
    }

    console.log('🍽️ DISH RECOGNITION - Converting base64 to buffer');
    
    // Convert base64 to buffer for AI service
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    console.log('🔍 Calling AI service for dish recognition...');
    console.log('🌐 AI Backend URL:', `${aiService.fastApiBaseUrl}/api/scan/dish`);
    console.log('📊 Image buffer size:', imageBuffer.length, 'bytes');
    
    // Call the actual AI service that uses MobileNetV2
    const aiResult = await aiService.recognizeDish(imageBuffer);

    console.log('✅ AI Service Response:', JSON.stringify(aiResult, null, 2));

    if (!aiResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Could not recognize dish from image',
        error: aiResult.error || 'AI service failed'
      });
    }

    // Return the actual AI prediction from MobileNetV2
    res.json({
      success: true,
      message: 'Dish recognized successfully',
      data: aiResult // Return the full AI result directly
    });
  } catch (error) {
    console.error('❌ Dish recognition error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error recognizing dish',
      error: error.message
    });
  }
};

// @desc    Get scan history
// @route   GET /api/scan/history
// @access  Private
const getScanHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10, type } = req.query;

    // In a real implementation, this would query a scan history collection
    // For now, return mock data
    const scanHistory = [
      {
        _id: '1',
        type: 'barcode',
        result: 'Greek Yogurt',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        success: true
      },
      {
        _id: '2',
        type: 'image',
        result: 'Apple',
        timestamp: new Date('2024-01-15T08:15:00Z'),
        success: true
      }
    ];

    res.json({
      success: true,
      data: {
        scans: scanHistory,
        total: scanHistory.length
      }
    });
  } catch (error) {
    console.error('Get scan history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching scan history',
      error: error.message
    });
  }
};

// Helper function to simulate barcode API call
const simulateBarcodeAPICall = async (barcode) => {
  // Mock barcode database
  const barcodeDatabase = {
    '123456789012': { name: 'Chocolate Protein Bar', calories: 220, protein: 20, carbs: 25, fat: 8, type: 'snack' },
    '234567890123': { name: 'Organic Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, type: 'snack' },
    '345678901234': { name: 'Greek Yogurt Cup', calories: 150, protein: 15, carbs: 12, fat: 4, type: 'breakfast' },
    '456789012345': { name: 'Granola Cereal', calories: 210, protein: 5, carbs: 40, fat: 4, type: 'breakfast' }
  };

  return barcodeDatabase[barcode] || null;
};

// Helper function to simulate CNN model prediction
const simulateCNNModelPrediction = async (imageBase64, scanType) => {
  // Mock CNN predictions based on scan type
  const fruitPredictions = [
    { foodName: 'Apple', confidence: 0.92, category: 'fruit' },
    { foodName: 'Banana', confidence: 0.88, category: 'fruit' },
    { foodName: 'Orange', confidence: 0.85, category: 'fruit' },
    { foodName: 'Carrot', confidence: 0.78, category: 'vegetable' },
    { foodName: 'Tomato', confidence: 0.82, category: 'fruit' }
  ];

  const dishPredictions = [
    { foodName: 'Chicken Salad', confidence: 0.76, category: 'meal' },
    { foodName: 'Pasta', confidence: 0.81, category: 'meal' },
    { foodName: 'Pizza', confidence: 0.89, category: 'meal' },
    { foodName: 'Sandwich', confidence: 0.73, category: 'meal' },
    { foodName: 'Soup', confidence: 0.68, category: 'meal' }
  ];

  const predictions = scanType === 'fruits_vegetables' ? fruitPredictions : dishPredictions;
  
  // Return a random prediction for simulation
  return predictions[Math.floor(Math.random() * predictions.length)];
};

// Helper function to simulate dish recognition
const simulateDishRecognition = async (imageBase64) => {
  const dishes = [
    {
      dish: 'Caesar Salad',
      confidence: 0.82,
      ingredients: ['lettuce', 'croutons', 'parmesan', 'caesar dressing'],
      estimatedCalories: 350
    },
    {
      dish: 'Grilled Chicken Breast',
      confidence: 0.88,
      ingredients: ['chicken breast', 'olive oil', 'herbs'],
      estimatedCalories: 230
    },
    {
      dish: 'Vegetable Stir Fry',
      confidence: 0.75,
      ingredients: ['broccoli', 'carrots', 'bell peppers', 'soy sauce'],
      estimatedCalories: 280
    }
  ];

  return dishes[Math.floor(Math.random() * dishes.length)];
};

// @desc    Scan fruits and vegetables using custom CNN model
// @route   POST /api/scan/fruits-vegetables
// @access  Private
const scanFruitsVegetables = async (req, res) => {
  console.log('🍎 FRUITS/VEGETABLES SCAN ENDPOINT HIT!');
  
  try {
    const { imageBase64 } = req.body;
    const userId = req.userId;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    // Call the AI service for fruits/vegetables recognition
    const aiResult = await aiService.scanFruitsVegetables(imageBuffer, 'produce.jpg');

    console.log('🔍 Fruits/Vegetables AI Response:', JSON.stringify(aiResult, null, 2));

    if (!aiResult.success || !aiResult.prediction) {
      return res.status(400).json({
        success: false,
        message: 'Could not identify produce from image',
        error: aiResult.error || 'AI service returned no prediction'
      });
    }

    res.json({
      success: true,
      message: 'Produce scanned successfully',
      data: aiResult // Return the full AI result directly
    });
  } catch (error) {
    console.error('Fruits/vegetables scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error scanning produce',
      error: error.message
    });
  }
};

// Helper function to get food suggestions
const getFoodSuggestions = async (foodName) => {
  return await Meal.find({
    $or: [
      { name: { $regex: foodName, $options: 'i' } },
      { ingredients: { $in: [new RegExp(foodName, 'i')] } }
    ]
  }).limit(5);
};

// Helper function to find similar meals
const findSimilarMeals = async (dishName) => {
  return await Meal.find({
    $or: [
      { name: { $regex: dishName, $options: 'i' } },
      { cuisine: { $regex: dishName, $options: 'i' } }
    ]
  }).limit(3);
};

module.exports = {
  scanBarcode,
  scanImage,
  recognizeDish,
  getScanHistory
};