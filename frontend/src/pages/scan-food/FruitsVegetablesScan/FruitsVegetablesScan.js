import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { scanImageFromFile } from '../../../services/scanService';
import { FiCamera, FiImage, FiRefreshCw, FiCheck, FiX, FiPlus, FiMinus } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import CameraCapture from '../../../components/common/CameraCapture/CameraCapture';
import styles from './FruitsVegetablesScan.module.css';
import { scanFruitsVegetablesFromFile } from '../../../services/scanService';



// Add this function RIGHT AFTER THE IMPORTS (around line 10)
const extractNutritionValue = (nutrientValue) => {
  if (!nutrientValue && nutrientValue !== 0) return 0;
  
  // If it's already a number, return it directly
  if (typeof nutrientValue === 'number') {
    return nutrientValue;
  }
  
  // If it's a string, extract the numeric value from formats like "1.7g/100g", "89 kcal", etc.
  if (typeof nutrientValue === 'string') {
    // Handle different string formats
    const match = nutrientValue.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }
  
  return 0;
};

const FruitsVegetablesScan = () => {
  const { userProfile } = useUser();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('medium'); // small, medium, large, grams
  const [showCamera, setShowCamera] = useState(false);

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
      // USE THE NEW DIRECT ENDPOINT
      const response = await scanFruitsVegetablesFromFile(selectedImage);

      console.log('🔍 Full API Response:', response);

      if (response.success) {
        const result = response;
        
        console.log('📊 AI Result structure:', result);
        console.log('🎯 Prediction data:', result.prediction);
        console.log('🍎 Nutrition data:', result.nutrition);

        // Transform the response with CORRECT data mapping

        const transformedResult = {
          produceName: result.prediction?.top_prediction?.food_name || 'Unknown Produce',
          confidence: result.prediction?.top_prediction?.confidence || 0.8,
          category: result.prediction?.top_prediction?.category || 'fruit',
          season: 'Year-round',
          nutrition: {
            // FIXED: Use extractNutritionValue to convert strings to numbers
            calories: extractNutritionValue(result.nutrition?.nutrients?.calories),
            protein: extractNutritionValue(result.nutrition?.nutrients?.protein),
            carbs: extractNutritionValue(result.nutrition?.nutrients?.carbs),
            fats: extractNutritionValue(result.nutrition?.nutrients?.fats),
            fiber: extractNutritionValue(result.nutrition?.nutrients?.fiber),
            vitamins: [
              { name: 'Vitamin C', amount: '8.7', unit: 'mg' },
              { name: 'Potassium', amount: '358', unit: 'mg' },
              { name: 'Vitamin B6', amount: '0.4', unit: 'mg' }
            ]
          },
          healthBenefits: [
            'Rich in vitamins and minerals',
            'Good source of dietary fiber',
            'Low in calories',
            'Supports digestive health'
          ],
          storageTips: 'Store in a cool, dry place. Refrigerate if needed.'
        };

        console.log('🔄 Transformed result:', transformedResult);
        setAnalysisResult(transformedResult);
      } else {
        setError(response.message || 'Failed to analyze the produce image');
      }
    } catch (error) {
      console.error('Produce analysis error:', error);
      setError('Failed to analyze the produce. Please try again.');
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
    setQuantity(1);
    setUnit('medium');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const adjustQuantity = (delta) => {
    setQuantity(prev => Math.max(0.1, prev + delta));
  };

  const addToMealDiary = () => {
    if (!analysisResult) return;

    // Calculate adjusted nutrition based on quantity
    const adjustedCalories = Math.round(analysisResult.nutrition.calories * quantity);
    const adjustedProtein = Math.round(analysisResult.nutrition.protein * quantity * 10) / 10;
    const adjustedCarbs = Math.round(analysisResult.nutrition.carbs * quantity * 10) / 10;
    const adjustedFats = Math.round(analysisResult.nutrition.fats * quantity * 10) / 10;

    const produceData = {
      name: analysisResult.produceName,
      quantity: quantity,
      unit: unit,
      calories: adjustedCalories,
      protein: adjustedProtein,
      carbs: adjustedCarbs,
      fats: adjustedFats,
      fiber: analysisResult.nutrition.fiber,
      vitamins: analysisResult.nutrition.vitamins,
      mealType: 'snack', // Default, user can change
      image: imagePreview,
      source: 'produce_scan',
      confidence: analysisResult.confidence
    };

    console.log('📤 Passing scanned data to Add Meal:', produceData);
    
    // Navigate to add meal page with the scanned data
    navigate('/add-meal', { 
      state: { 
        scannedMeal: produceData,
        imagePreview: imagePreview,
        fromScan: true
      } 
    });
  };

  const unitOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'grams', label: 'Grams' }
  ];

  return (
    <div className={styles.fruitsVegetablesScan}>
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
          <h1 className={styles.title}>Scan Fruits & Vegetables</h1>
          <p className={styles.subtitle}>
            Identify and track nutritional information for fresh produce
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
                <h2 className={styles.uploadTitle}>Ready to scan produce?</h2>
                <p className={styles.uploadDescription}>
                  Take a clear photo of your fruits or vegetables for accurate identification
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
                alt="Produce preview"
                className={styles.previewImage}
              />

              {/* Quantity and Unit Selection */}
              <div className={styles.quantitySection}>
                <h3>Specify Quantity</h3>
                <div className={styles.quantityControls}>
                  <div className={styles.quantityInput}>
                    <button
                      onClick={() => adjustQuantity(-0.1)}
                      className={styles.quantityButton}
                    >
                      <FiMinus />
                    </button>
                    <span className={styles.quantityValue}>
                      {quantity.toFixed(1)}
                    </span>
                    <button
                      onClick={() => adjustQuantity(0.1)}
                      className={styles.quantityButton}
                    >
                      <FiPlus />
                    </button>
                  </div>

                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className={styles.unitSelect}
                  >
                    {unitOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                        Analyze Produce
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

            <div className={styles.produceInfo}>
              <div className={styles.produceName}>
                <h3>{analysisResult.produceName}</h3>
                <p className={styles.produceCategory}>
                  {analysisResult.category} • {analysisResult.season || 'Year-round'}
                </p>
              </div>

              <div className={styles.quantityDisplay}>
                <span className={styles.quantityText}>
                  {quantity} {unit === 'grams' ? 'g' : unit}
                </span>
              </div>

              <div className={styles.nutritionGrid}>
                <div className={styles.nutritionItem}>
                  <div className={styles.nutritionValue}>
                    {Math.round(analysisResult.nutrition.calories * quantity)}
                  </div>
                  <div className={styles.nutritionLabel}>Calories</div>
                  <div className={styles.nutritionUnit}>kcal</div>
                </div>

                <div className={styles.nutritionItem}>
                  <div className={styles.nutritionValue}>
                    {(analysisResult.nutrition.carbs * quantity).toFixed(1)}
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

                <div className={styles.nutritionItem}>
                  <div className={styles.nutritionValue}>
                    {(analysisResult.nutrition.protein * quantity).toFixed(1)}
                  </div>
                  <div className={styles.nutritionLabel}>Protein</div>
                  <div className={styles.nutritionUnit}>g</div>
                </div>
              </div>

              {analysisResult.nutrition.vitamins && analysisResult.nutrition.vitamins.length > 0 && (
                <div className={styles.vitaminsSection}>
                  <h4>Key Vitamins & Minerals:</h4>
                  <div className={styles.vitaminsList}>
                    {analysisResult.nutrition.vitamins.map((vitamin, index) => (
                      <span key={index} className={styles.vitamin}>
                        {vitamin.name}: {vitamin.amount}{vitamin.unit}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.healthBenefits && analysisResult.healthBenefits.length > 0 && (
                <div className={styles.benefitsSection}>
                  <h4>Health Benefits:</h4>
                  <ul className={styles.benefitsList}>
                    {analysisResult.healthBenefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysisResult.storageTips && (
                <div className={styles.storageSection}>
                  <h4>Storage Tips:</h4>
                  <p className={styles.storageText}>{analysisResult.storageTips}</p>
                </div>
              )}
            </div>

            <div className={styles.resultsActions}>
              <button
                onClick={addToMealDiary}
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
                Scan Another Item
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
            <h4 className={styles.tipTitle}>Single Item</h4>
            <p className={styles.tipDescription}>
              Focus on one fruit or vegetable at a time for best identification results.
            </p>
          </div>

          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>🔍</div>
            <h4 className={styles.tipTitle}>Clear View</h4>
            <p className={styles.tipDescription}>
              Ensure the produce is well-lit and clearly visible in the photo.
            </p>
          </div>

          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>⚖️</div>
            <h4 className={styles.tipTitle}>Accurate Quantity</h4>
            <p className={styles.tipDescription}>
              Specify the correct quantity and size for accurate nutritional calculations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FruitsVegetablesScan;