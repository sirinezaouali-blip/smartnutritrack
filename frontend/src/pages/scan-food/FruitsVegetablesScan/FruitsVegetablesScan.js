import React, { useState, useRef } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { analyzeProduceImage } from '../../../services/aiService';
import { FiCamera, FiImage, FiRefreshCw, FiCheck, FiX, FiPlus, FiMinus } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import CameraCapture from '../../../components/common/CameraCapture/CameraCapture';
import styles from './FruitsVegetablesScan.module.css';

const FruitsVegetablesScan = () => {
  const { userProfile } = useUser();
  const { t } = useLanguage();

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
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('userId', userProfile?.id || 'anonymous');
      formData.append('quantity', quantity.toString());
      formData.append('unit', unit);

      const response = await analyzeProduceImage(formData);

      if (response.success) {
        setAnalysisResult(response.data);
      } else {
        setError('Failed to analyze the produce image');
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

    // Here you would typically dispatch to add the produce to the user's daily intake
    const produceData = {
      name: analysisResult.produceName,
      quantity: quantity,
      unit: unit,
      calories: analysisResult.nutrition.calories,
      protein: analysisResult.nutrition.protein,
      carbs: analysisResult.nutrition.carbs,
      fat: analysisResult.nutrition.fat,
      fiber: analysisResult.nutrition.fiber,
      vitamins: analysisResult.nutrition.vitamins,
      mealType: 'snack', // Default, user can change
      image: imagePreview,
      source: 'produce_scan'
    };

    console.log('Adding produce to diary:', produceData);
    alert('Produce added to your daily intake successfully!');

    // Reset for next scan
    resetScan();
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
                    {analysisResult.nutrition.calories}
                  </div>
                  <div className={styles.nutritionLabel}>Calories</div>
                  <div className={styles.nutritionUnit}>kcal</div>
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
                    {analysisResult.nutrition.fiber}
                  </div>
                  <div className={styles.nutritionLabel}>Fiber</div>
                  <div className={styles.nutritionUnit}>g</div>
                </div>

                <div className={styles.nutritionItem}>
                  <div className={styles.nutritionValue}>
                    {analysisResult.nutrition.protein}
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
