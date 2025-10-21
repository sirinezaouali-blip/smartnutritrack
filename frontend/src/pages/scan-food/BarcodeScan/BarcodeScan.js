import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { scanBarcode, getProductInfo } from '../../../services/aiService';
import { FiCamera, FiSearch, FiRefreshCw, FiCheck, FiX, FiPlus, FiAlertTriangle } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './BarcodeScan.module.css';

const BarcodeScan = () => {
  const { userProfile } = useUser();
  const { t } = useLanguage();

  const [scannedBarcode, setScannedBarcode] = useState('');
  const [productInfo, setProductInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        setError(null);

        // Start barcode detection
        detectBarcode();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const detectBarcode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const scanFrame = () => {
      if (!isScanning) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Here you would integrate with a barcode scanning library like QuaggaJS or ZXing
      // For now, we'll simulate barcode detection
      // In a real implementation, you would:
      // 1. Use a barcode scanning library to analyze the canvas
      // 2. Extract barcode data when detected
      // 3. Call handleBarcodeDetected with the barcode

      if (isScanning) {
        requestAnimationFrame(scanFrame);
      }
    };

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      scanFrame();
    } else {
      video.addEventListener('loadeddata', scanFrame);
    }
  };

  const handleBarcodeDetected = async (barcode) => {
    setScannedBarcode(barcode);
    stopCamera();
    await lookupProduct(barcode);
  };

  const lookupProduct = async (barcode) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getProductInfo(barcode);

      if (response.success) {
        setProductInfo(response.data);
      } else {
        setError('Product not found. Try manual search or different barcode.');
      }
    } catch (error) {
      console.error('Product lookup error:', error);
      setError('Failed to lookup product information.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // This would typically search by product name
      const response = await getProductInfo(searchTerm);

      if (response.success) {
        setProductInfo(response.data);
      } else {
        setError('Product not found. Try different search terms.');
      }
    } catch (error) {
      console.error('Product search error:', error);
      setError('Failed to search for product.');
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    stopCamera();
    setScannedBarcode('');
    setProductInfo(null);
    setError(null);
    setManualEntry(false);
    setSearchTerm('');
  };

  const addToMealDiary = () => {
    if (!productInfo) return;

    // Here you would typically dispatch to add the product to the user's daily intake
    const productData = {
      name: productInfo.productName,
      brand: productInfo.brand,
      barcode: scannedBarcode,
      servingSize: productInfo.servingSize,
      calories: productInfo.nutrition.calories,
      protein: productInfo.nutrition.protein,
      carbs: productInfo.nutrition.carbs,
      fat: productInfo.nutrition.fat,
      sugar: productInfo.nutrition.sugar,
      sodium: productInfo.nutrition.sodium,
      mealType: 'snack', // Default, user can change
      source: 'barcode_scan'
    };

    console.log('Adding product to diary:', productData);
    alert('Product added to your daily intake successfully!');

    // Reset for next scan
    resetScan();
  };

  return (
    <div className={styles.barcodeScan}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Barcode Scan</h1>
          <p className={styles.subtitle}>
            Scan product barcodes to get instant nutritional information
          </p>
        </div>
      </div>

      {/* Scan Section */}
      <div className={styles.scanSection}>
        <div className={styles.scanCard}>
          {!productInfo ? (
            <>
              {!manualEntry ? (
                <>
                  {/* Camera Scanner */}
                  <div className={styles.scannerContainer}>
                    {!isScanning ? (
                      <div className={styles.scanPrompt}>
                        <div className={styles.scanIcon}>
                          <FiCamera />
                        </div>
                        <h2 className={styles.scanTitle}>Ready to scan barcode?</h2>
                        <p className={styles.scanDescription}>
                          Point your camera at a product barcode for instant nutritional info
                        </p>
                      </div>
                    ) : (
                      <div className={styles.cameraContainer}>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className={styles.camera}
                        />
                        <canvas
                          ref={canvasRef}
                          style={{ display: 'none' }}
                        />
                        <div className={styles.scanOverlay}>
                          <div className={styles.scanFrame}></div>
                          <p className={styles.scanInstruction}>
                            Position barcode within the frame
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.scanActions}>
                    {!isScanning ? (
                      <>
                        <button
                          onClick={startCamera}
                          className={styles.scanButton}
                        >
                          <FiCamera />
                          Start Scanning
                        </button>

                        <button
                          onClick={() => setManualEntry(true)}
                          className={styles.manualButton}
                        >
                          <FiSearch />
                          Manual Search
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={stopCamera}
                        className={styles.stopButton}
                      >
                        <FiX />
                        Stop Scanning
                      </button>
                    )}
                  </div>
                </>
              ) : (
                /* Manual Search */
                <div className={styles.manualSearch}>
                  <h2 className={styles.manualTitle}>Search by Product Name</h2>

                  <div className={styles.searchBox}>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Enter product name..."
                      className={styles.searchInput}
                      onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                    />
                    <button
                      onClick={handleManualSearch}
                      disabled={loading || !searchTerm.trim()}
                      className={styles.searchButton}
                    >
                      {loading ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <FiSearch />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => setManualEntry(false)}
                    className={styles.backButton}
                  >
                    <FiCamera />
                    Back to Scanner
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Product Found */
            <div className={styles.productFound}>
              <div className={styles.productHeader}>
                <FiCheck className={styles.successIcon} />
                <h2>Product Found!</h2>
              </div>

              <div className={styles.productActions}>
                <button
                  onClick={resetScan}
                  className={styles.scanAnotherButton}
                >
                  <FiRefreshCw />
                  Scan Another
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              <FiAlertTriangle />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Product Information */}
      {productInfo && (
        <div className={styles.productSection}>
          <div className={styles.productCard}>
            <div className={styles.productHeader}>
              <div className={styles.productBasic}>
                <h2 className={styles.productName}>{productInfo.productName}</h2>
                {productInfo.brand && (
                  <p className={styles.productBrand}>by {productInfo.brand}</p>
                )}
                {scannedBarcode && (
                  <p className={styles.barcode}>Barcode: {scannedBarcode}</p>
                )}
              </div>

              {productInfo.image && (
                <img
                  src={productInfo.image}
                  alt={productInfo.productName}
                  className={styles.productImage}
                />
              )}
            </div>

            <div className={styles.nutritionSection}>
              <h3>Nutrition Facts</h3>
              <p className={styles.servingSize}>
                Serving Size: {productInfo.servingSize}
              </p>

              <div className={styles.nutritionGrid}>
                <div className={styles.nutritionItem}>
                  <div className={styles.nutritionValue}>
                    {productInfo.nutrition.calories}
                  </div>
                  <div className={styles.nutritionLabel}>Calories</div>
                </div>

                <div className={styles.nutritionItem}>
                  <div className={styles.nutritionValue}>
                    {productInfo.nutrition.protein}g
                  </div>
                  <div className={styles.nutritionLabel}>Protein</div>
                </div>

                <div className={styles.nutritionItem}>
                  <div className={styles.nutritionValue}>
                    {productInfo.nutrition.carbs}g
                  </div>
                  <div className={styles.nutritionLabel}>Carbs</div>
                </div>

                <div className={styles.nutritionItem}>
                  <div className={styles.nutritionValue}>
                    {productInfo.nutrition.fat}g
                  </div>
                  <div className={styles.nutritionLabel}>Fat</div>
                </div>

                <div className={styles.nutritionItem}>
                  <div className={styles.nutritionValue}>
                    {productInfo.nutrition.sugar}g
                  </div>
                  <div className={styles.nutritionLabel}>Sugar</div>
                </div>

                <div className={styles.nutritionItem}>
                  <div className={styles.nutritionValue}>
                    {productInfo.nutrition.sodium}mg
                  </div>
                  <div className={styles.nutritionLabel}>Sodium</div>
                </div>
              </div>
            </div>

            {productInfo.ingredients && (
              <div className={styles.ingredientsSection}>
                <h3>Ingredients</h3>
                <p className={styles.ingredientsText}>
                  {productInfo.ingredients}
                </p>
              </div>
            )}

            {productInfo.allergens && productInfo.allergens.length > 0 && (
              <div className={styles.allergensSection}>
                <h3>⚠️ Allergens</h3>
                <div className={styles.allergensList}>
                  {productInfo.allergens.map((allergen, index) => (
                    <span key={index} className={styles.allergen}>
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.productActions}>
              <button
                onClick={addToMealDiary}
                className={styles.addButton}
              >
                <FiPlus />
                Add to Meal Diary
              </button>

              <button
                onClick={resetScan}
                className={styles.scanAnotherButton}
              >
                <FiCamera />
                Scan Another Product
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
            <div className={styles.tipIcon}>📱</div>
            <h4 className={styles.tipTitle}>Steady Camera</h4>
            <p className={styles.tipDescription}>
              Hold your device steady and ensure good lighting for better barcode detection.
            </p>
          </div>

          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>📦</div>
            <h4 className={styles.tipTitle}>Product Database</h4>
            <p className={styles.tipDescription}>
              Works best with packaged foods that have UPC/EAN barcodes in our database.
            </p>
          </div>

          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>🔍</div>
            <h4 className={styles.tipTitle}>Manual Search</h4>
            <p className={styles.tipDescription}>
              If scanning doesn't work, try searching by product name manually.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScan;
