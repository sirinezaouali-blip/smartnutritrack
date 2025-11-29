import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { scanImageFromFile, recognizeDishFromFile } from '../../../services/scanService';
import { FiCamera, FiImage, FiRefreshCw, FiCheck, FiX, FiPlus } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import CameraCapture from '../../../components/common/CameraCapture/CameraCapture';
import styles from './DishScan.module.css';

const DishScan = () => {
  const { userProfile } = useUser();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Add this function RIGHT HERE
  const extractNutritionValue = (nutrientValue) => {
    if (!nutrientValue && nutrientValue !== 0) return 0;
    
    // If it's already a number, return it directly
    if (typeof nutrientValue === 'number') {
      return nutrientValue;
    }
    
    // If it's a string, extract the numeric value
    if (typeof nutrientValue === 'string') {
      const match = nutrientValue.match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    }
    
    return 0;
  };

  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setAnalysisResult(null);
      setError(null);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraCapture = () => {
    setShowCamera(true);
  };

  const handleCameraCapture = (file) => {
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setAnalysisResult(null);
      setError(null);
      setShowCamera(false);
    }
  };

  const handleCameraClose = () => {
    setShowCamera(false);
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setIsAnalyzing(true);
    setError(null);

    try {
      // Use the new scan service to analyze the dish
      const response = await recognizeDishFromFile(selectedImage);

      console.log('🔍 Full Dish API Response:', response); // Debug log

      if (response.success) {
        // Get the actual prediction data from the nested structure
        const topPrediction = response.data.prediction.predictions[0];
        const nutritionData = response.data.nutrition?.nutrients || {};

        console.log('🎯 Top Prediction:', topPrediction);
        console.log('📊 Nutrition Data:', nutritionData);

        // Transform the API response to match your frontend format
        const transformedResult = {
          dishName: topPrediction.food_name,
          confidence: topPrediction.confidence,
          category: topPrediction.category,
          cuisine: 'Various',
          nutrition: {
            calories: extractNutritionValue(nutritionData.calories),
            protein: extractNutritionValue(nutritionData.protein), 
            carbs: extractNutritionValue(nutritionData.carbs),
            fats: extractNutritionValue(nutritionData.fats)
          },
          ingredients: [],
          allergens: []
        };

        console.log('🔄 Transformed Result:', transformedResult); // Debug log
        setAnalysisResult(transformedResult);
      } else {
        setError(response.message || 'Failed to analyze the dish image');
      }
    } catch (error) {
      console.error('Dish analysis error:', error);
      setError('Failed to analyze the dish. Please try again.');
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
    }
  };

  const resetScan = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addMealToDiary = () => {
    if (!analysisResult) return;

    // Here you would typically dispatch to add the meal to the user's daily intake
    const mealData = {
      name: analysisResult.dishName,
      calories: analysisResult.nutrition.calories,
      protein: analysisResult.nutrition.protein,
      carbs: analysisResult.nutrition.carbs,
      fats: analysisResult.nutrition.fats,
      mealType: 'lunch', // Default, user can change
      image: imagePreview,
      source: 'dish_scan',
      confidence: analysisResult.confidence
    };

    console.log('Adding meal to diary:', mealData);
    console.log('🔍 DEBUG - Fat value before passing to AddMeal:', analysisResult.nutrition.fats);
    console.log('📊 Full nutrition data:', analysisResult.nutrition);
    console.log('🎯 Full meal data being passed:', mealData);
    
    // Navigate to add meal page with the scanned data
    navigate('/add-meal', { 
      state: { 
        scannedMeal: mealData,
        imagePreview: imagePreview,
        fromScan: true
      } 
    });
  };

  return (
    <div className={styles.dishScan}>
      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={handleCameraClose}
        />
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Scan Dish</h1>
          <p className={styles.subtitle}>
            Take a photo of your meal to get instant nutritional information
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div className={styles.uploadSection}>
        <div className={styles.uploadCard}>
          {!imagePreview ? (
            <>
              <div className={styles.uploadPrompt}>
                <div className={styles.uploadIcon}>
                  <FiCamera />
                </div>
                <h2 className={styles.uploadTitle}>Ready to scan your dish?</h2>
                <p className={styles.uploadDescription}>
                  Take a clear photo of your prepared meal for accurate analysis
                </p>
              </div>

              <div className={styles.uploadOptions}>
                <button
                  onClick={triggerCameraCapture}
                  className={styles.uploadButton}
                >
                  <FiCamera />
                  Take Photo
                </button>

                <button
                  onClick={triggerFileSelect}
                  className={styles.uploadButton}
                >
                  <FiImage />
                  Choose from Gallery
                </button>
              </div>
            </>
          ) : (
            <div className={styles.imagePreview}>
              <img
                src={imagePreview}
                alt="Dish preview"
                className={styles.previewImage}
              />

              <div className={styles.previewActions}>
                {!analysisResult && !isAnalyzing && (
                  <button
                    onClick={analyzeImage}
                    disabled={loading}
                    className={styles.analyzeButton}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="small" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FiCheck />
                        Analyze Dish
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={resetScan}
                  className={styles.resetButton}
                  disabled={loading}
                >
                  <FiRefreshCw />
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {error && (
            <div className={styles.errorMessage}>
              <FiX />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className={styles.resultsSection}>
          <div className={styles.resultsCard}>
            <div className={styles.resultsHeader}>
              <h2 className={styles.resultsTitle}>Analysis Results</h2>
              <div className={styles.confidenceScore}>
                Confidence: {Math.round(analysisResult.confidence * 100)}%
              </div>
            </div>

            <div className={styles.dishInfo}>
              <div className={styles.dishName}>
                <h3>{analysisResult.dishName}</h3>
                <p className={styles.dishCategory}>
                  {analysisResult.category} • {analysisResult.cuisine || 'Various cuisines'}
                </p>
              </div>

              <div className={styles.nutritionGrid}>
                <div className={styles.nutritionItem}>
                  <div className={styles.nutritionValue}>
                    {analysisResult.nutrition.calories}
                  </div>
                  <div className={styles.nutritionLabel}>Calories</div>
                  <div className={styles.nutritionUnit}>kcal</div>
                </div>

                <div className={styles.nutritionItem}>
                  <div className={styles.nutritionValue}>
                    {analysisResult.nutrition.protein}
                  </div>
                  <div className={styles.nutritionLabel}>Protein</div>
                  <div className={styles.nutritionUnit}>g</div>
                </div>

                <div className={styles.nutritionItem}>
                  <div className={styles.nutritionValue}>
                    {analysisResult.nutrition.carbs}
                  </div>
                  <div className={styles.nutritionLabel}>Carbs</div>
                  <div className={styles.nutritionUnit}>g</div>
                </div>

                <div className={styles.nutritionItem}>
                  <div className={styles.nutritionValue}>
                    {analysisResult.nutrition.fats}
                  </div>
                  <div className={styles.nutritionLabel}>Fats</div>
                  <div className={styles.nutritionUnit}>g</div>
                </div>
              </div>

              {analysisResult.ingredients && analysisResult.ingredients.length > 0 && (
                <div className={styles.ingredientsSection}>
                  <h4>Detected Ingredients:</h4>
                  <div className={styles.ingredientsList}>
                    {analysisResult.ingredients.map((ingredient, index) => (
                      <span key={index} className={styles.ingredient}>
                        {ingredient.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.allergens && analysisResult.allergens.length > 0 && (
                <div className={styles.allergensSection}>
                  <h4>⚠️ Potential Allergens:</h4>
                  <div className={styles.allergensList}>
                    {analysisResult.allergens.map((allergen, index) => (
                      <span key={index} className={styles.allergen}>
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.resultsActions}>
              <button
                onClick={addMealToDiary}
                className={styles.addMealButton}
              >
                <FiPlus />
                Add to Meal Diary
              </button>

              <button
                onClick={resetScan}
                className={styles.scanAnotherButton}
              >
                <FiCamera />
                Scan Another Dish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className={styles.tipsSection}>
        <h2 className={styles.sectionTitle}>Scanning Tips</h2>
        <div className={styles.tipsGrid}>
          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>📸</div>
            <h4 className={styles.tipTitle}>Clear Photos</h4>
            <p className={styles.tipDescription}>
              Take well-lit, clear photos of your entire dish for best results.
            </p>
          </div>

          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>🍽️</div>
            <h4 className={styles.tipTitle}>Whole Dish</h4>
            <p className={styles.tipDescription}>
              Include the entire meal in the frame, not just individual ingredients.
            </p>
          </div>

          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>🔍</div>
            <h4 className={styles.tipTitle}>Common Foods</h4>
            <p className={styles.tipDescription}>
              Best results with common dishes. Specialty or custom meals may need manual entry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DishScan;