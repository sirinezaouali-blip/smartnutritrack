import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { FiCamera, FiSearch, FiArrowRight, FiStar, FiX } from 'react-icons/fi';
import { FaQrcode } from 'react-icons/fa';
import styles from './ScanFood.module.css';

const ScanFood = () => {
  const { userProfile } = useUser();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);

  const scanMethods = [
    {
      title: 'Dish Recognition',
      description: 'Take a photo of your prepared meal to get instant nutrition information',
      icon: <FiCamera />,
      link: '/scan-food/dish',
      color: 'primary',
      features: ['AI-powered recognition', 'Instant nutrition data', 'Works with any dish'],
      image: '🍽️',
      popular: true
    },
    {
      title: 'Fruits & Vegetables',
      description: 'Scan fresh produce to get accurate nutritional information',
      icon: <FiSearch />,
      link: '/scan-food/fruits-vegetables',
      color: 'secondary',
      features: ['Fresh produce detection', 'Seasonal information', 'Storage tips'],
      image: '🥗',
      popular: false
    },
    {
      title: 'Barcode Scanner',
      description: 'Scan product barcodes for packaged food nutrition facts',
      icon: <FaQrcode />,
      link: '/scan-food/barcode',
      color: 'tertiary',
      features: ['Instant product lookup', 'Brand database', 'Allergen information'],
      image: '📱',
      popular: true
    }
  ];

  const recentScans = [
    { name: 'Grilled Chicken Salad', type: 'Dish', calories: 320, date: '2 hours ago' },
    { name: 'Banana', type: 'Fruit', calories: 105, date: 'Yesterday' },
    { name: 'Greek Yogurt', type: 'Barcode', calories: 150, date: 'Yesterday' }
  ];

  const tips = [
    {
      icon: '💡',
      title: 'Best Photo Tips',
      description: 'Take photos in good lighting with the food clearly visible'
    },
    {
      icon: '🎯',
      title: 'Accuracy Matters',
      description: 'Include the entire portion size for more accurate calorie estimates'
    },
    {
      icon: '⚡',
      title: 'Quick Access',
      description: 'Use the quick scan button for frequently scanned items'
    }
  ];

  return (
    <div className={styles.scanFood}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Scan Food</h1>
          <p className={styles.subtitle}>
            Get instant nutrition information using AI-powered food recognition
          </p>
        </div>
        
        <div className={styles.headerStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>156</span>
            <span className={styles.statLabel}>Items Scanned</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>98%</span>
            <span className={styles.statLabel}>Accuracy Rate</span>
          </div>
        </div>
      </div>

      {/* Scan Methods */}
      <div className={styles.scanMethodsSection}>
        <h2 className={styles.sectionTitle}>Choose Scanning Method</h2>
        <div className={styles.scanMethodsGrid}>
          {scanMethods.map((method, index) => (
            <div
              key={index}
              className={styles.scanMethodCard}
              onClick={() => {
                setSelectedMethod(method);
                setShowSelectionModal(true);
              }}
            >
              <div className={styles.cardHeader}>
                <div className={`${styles.methodIcon} ${styles[`color${method.color.charAt(0).toUpperCase() + method.color.slice(1)}`]}`}>
                  {method.icon}
                </div>
                <div className={styles.methodImage}>
                  {method.image}
                </div>
                {method.popular && (
                  <div className={styles.popularBadge}>
                    <FiStar />
                    Popular
                  </div>
                )}
              </div>

              <div className={styles.cardContent}>
                <h3 className={styles.methodTitle}>{method.title}</h3>
                <p className={styles.methodDescription}>{method.description}</p>

                <ul className={styles.methodFeatures}>
                  {method.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className={styles.methodFeature}>
                      <span className={styles.featureBullet}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.cardAction}>
                <span className={styles.actionText}>Start Scanning</span>
                <FiArrowRight className={styles.actionIcon} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selection Modal */}
      {showSelectionModal && selectedMethod && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Choose Scan Option</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowSelectionModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.selectedMethod}>
                <div className={styles.selectedIcon}>
                  {selectedMethod.icon}
                </div>
                <div className={styles.selectedInfo}>
                  <h4>{selectedMethod.title}</h4>
                  <p>{selectedMethod.description}</p>
                </div>
              </div>

              <div className={styles.scanOptions}>
                <button
                  className={styles.scanOption}
                  onClick={() => {
                    setShowSelectionModal(false);
                    navigate(selectedMethod.link);
                  }}
                >
                  <FiCamera />
                  <div className={styles.optionContent}>
                    <span className={styles.optionTitle}>Take Photo</span>
                    <span className={styles.optionDescription}>Use camera to capture food</span>
                  </div>
                </button>

                <button
                  className={styles.scanOption}
                  onClick={() => {
                    setShowSelectionModal(false);
                    navigate(selectedMethod.link);
                  }}
                >
                  <FiSearch />
                  <div className={styles.optionContent}>
                    <span className={styles.optionTitle}>Choose from Gallery</span>
                    <span className={styles.optionDescription}>Select existing photo</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Scans */}
      <div className={styles.recentSection}>
        <h2 className={styles.sectionTitle}>Recent Scans</h2>
        <div className={styles.recentList}>
          {recentScans.map((scan, index) => (
            <div key={index} className={styles.recentItem}>
              <div className={styles.recentIcon}>
                {scan.type === 'Dish' && '🍽️'}
                {scan.type === 'Fruit' && '🍎'}
                {scan.type === 'Barcode' && '📱'}
              </div>
              <div className={styles.recentContent}>
                <div className={styles.recentName}>{scan.name}</div>
                <div className={styles.recentDetails}>
                  <span className={styles.recentType}>{scan.type}</span>
                  <span className={styles.recentCalories}>{scan.calories} kcal</span>
                  <span className={styles.recentDate}>{scan.date}</span>
                </div>
              </div>
              <button className={styles.recentAction}>
                <FiArrowRight />
              </button>
            </div>
          ))}
        </div>
        
        <div className={styles.recentActions}>
          <button className={styles.viewAllButton}>
            View All Scans
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>Your Scanning Stats</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiCamera />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>42</div>
              <div className={styles.statLabel}>Dishes Scanned</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiSearch />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>38</div>
              <div className={styles.statLabel}>Fruits & Vegetables</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FaQrcode />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>76</div>
              <div className={styles.statLabel}>Barcode Scans</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiStar />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>2,847</div>
              <div className={styles.statLabel}>Total Calories Logged</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className={styles.tipsSection}>
        <h2 className={styles.sectionTitle}>Scanning Tips</h2>
        <div className={styles.tipsGrid}>
          {tips.map((tip, index) => (
            <div key={index} className={styles.tipCard}>
              <div className={styles.tipIcon}>{tip.icon}</div>
              <h4 className={styles.tipTitle}>{tip.title}</h4>
              <p className={styles.tipDescription}>{tip.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Features */}
      <div className={styles.aiFeaturesSection}>
        <div className={styles.aiFeaturesContent}>
          <div className={styles.aiFeaturesText}>
            <h2 className={styles.aiFeaturesTitle}>Powered by Advanced AI</h2>
            <p className={styles.aiFeaturesDescription}>
              Our AI technology can recognize thousands of food items with high accuracy, 
              providing detailed nutritional information instantly.
            </p>
            <ul className={styles.aiFeaturesList}>
              <li>Machine Learning Food Recognition</li>
              <li>Real-time Nutrition Analysis</li>
              <li>Portion Size Estimation</li>
              <li>Allergen Detection</li>
            </ul>
          </div>
          <div className={styles.aiFeaturesImage}>
            <div className={styles.aiVisualization}>
              <div className={styles.aiNode}>
                <span className={styles.aiIcon}>🧠</span>
                <span className={styles.aiLabel}>AI Engine</span>
              </div>
              <div className={styles.aiConnections}>
                <div className={styles.aiConnection}></div>
                <div className={styles.aiConnection}></div>
                <div className={styles.aiConnection}></div>
              </div>
              <div className={styles.aiOutputs}>
                <div className={styles.aiOutput}>
                  <span className={styles.outputIcon}>📊</span>
                  <span className={styles.outputLabel}>Nutrition</span>
                </div>
                <div className={styles.aiOutput}>
                  <span className={styles.outputIcon}>⚖️</span>
                  <span className={styles.outputLabel}>Portion</span>
                </div>
                <div className={styles.aiOutput}>
                  <span className={styles.outputIcon}>🏷️</span>
                  <span className={styles.outputLabel}>Label</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanFood;









