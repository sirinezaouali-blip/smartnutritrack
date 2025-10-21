const express = require('express');
const multer = require('multer');
const {
    scanFood,
    scanBarcode,
    getNutritionData,
    getMealSuggestions,
    healthCheck
} = require('../controllers/aiController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Configure multer for file uploads (in-memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Public route
router.get('/health', healthCheck);

// Protected routes
router.use(authMiddleware);
router.post('/scan-food', upload.single('image'), scanFood);
router.post('/scan-barcode', upload.single('image'), scanBarcode);
router.get('/nutrition/:foodName', getNutritionData);
router.post('/meal-suggestions', getMealSuggestions);

module.exports = router;