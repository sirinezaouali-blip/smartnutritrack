import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { FiCheckCircle, FiArrowRight, FiHeart, FiTarget, FiUsers, FiTrendingUp } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './Step7Confirmation.module.css';

const Step7Confirmation = () => {
  const { completeOnboarding, userProfile, loading } = useUser();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Auto-complete onboarding after component mounts
    const completeSetup = async () => {
      setIsCompleting(true);
      
      try {
        const result = await completeOnboarding();
        
        if (result.success) {
          setIsCompleted(true);
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 3000);
        } else {
          setErrors({ submit: result.message });
        }
      } catch (error) {
        setErrors({ submit: 'Failed to complete setup. Please try again.' });
      } finally {
        setIsCompleting(false);
      }
    };

    // Start completion process after a short delay for better UX
    const timer = setTimeout(completeSetup, 1000);
    return () => clearTimeout(timer);
  }, [completeOnboarding, navigate]);

  const handleStartJourney = () => {
    navigate('/dashboard');
  };

  const features = [
    {
      icon: <FiTarget />,
      title: 'Personalized Goals',
      description: 'Your health metrics and goals are now set up'
    },
    {
      icon: <FiHeart />,
      title: 'Smart Recommendations',
      description: 'Get AI-powered meal suggestions tailored to you'
    },
    {
      icon: <FiTrendingUp />,
      title: 'Progress Tracking',
      description: 'Monitor your nutrition journey with detailed analytics'
    },
    {
      icon: <FiUsers />,
      title: 'Community Support',
      description: 'Connect with others on similar health journeys'
    }
  ];

  if (isCompleted) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successAnimation}>
            <div className={styles.checkmark}>
              <FiCheckCircle />
            </div>
            <div className={styles.confetti}>
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`${styles.confettiPiece} ${styles[`piece${i + 1}`]}`}></div>
              ))}
            </div>
          </div>
          
          <div className={styles.successContent}>
            <h2 className={styles.successTitle}>🎉 Welcome to SmartNutritrack!</h2>
            <p className={styles.successMessage}>
              Your personalized nutrition plan is ready! Redirecting to your dashboard...
            </p>
            
            <div className={styles.countdown}>
              <div className={styles.countdownCircle}>
                <span className={styles.countdownNumber}>3</span>
              </div>
              <p className={styles.countdownText}>Redirecting automatically</p>
            </div>
            
            <button
              className={styles.startButton}
              onClick={handleStartJourney}
            >
              Start Your Journey Now
              <FiArrowRight className={styles.buttonIcon} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.confirmationCard}>
        {/* Progress Indicator */}
        <div className={styles.progressIndicator}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: '100%' }}></div>
          </div>
          <span className={styles.progressText}>Step 7 of 7</span>
        </div>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <FiCheckCircle />
          </div>
          <h2 className={styles.title}>Setup Complete!</h2>
          <p className={styles.subtitle}>
            We're finalizing your personalized nutrition plan
          </p>
        </div>

        {/* Completion Status */}
        <div className={styles.completionSection}>
          {isCompleting ? (
            <div className={styles.loadingSection}>
              <LoadingSpinner size="large" message="Setting up your account..." />
              <div className={styles.loadingSteps}>
                <div className={styles.loadingStep}>
                  <div className={styles.stepIcon}>✅</div>
                  <span>Profile created</span>
                </div>
                <div className={styles.loadingStep}>
                  <div className={styles.stepIcon}>✅</div>
                  <span>Health metrics calculated</span>
                </div>
                <div className={styles.loadingStep}>
                  <div className={styles.stepIcon}>⏳</div>
                  <span>Personalizing recommendations</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.featuresSection}>
              <h3 className={styles.featuresTitle}>What's Next?</h3>
              <div className={styles.featuresGrid}>
                {features.map((feature, index) => (
                  <div key={index} className={styles.featureCard}>
                    <div className={styles.featureIcon}>
                      {feature.icon}
                    </div>
                    <h4 className={styles.featureTitle}>{feature.title}</h4>
                    <p className={styles.featureDescription}>{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Summary */}
        {userProfile && (
          <div className={styles.userSummary}>
            <h3 className={styles.summaryTitle}>Your Profile Summary</h3>
            <div className={styles.summaryContent}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Name:</span>
                <span className={styles.summaryValue}>
                  {userProfile.firstName} {userProfile.lastName}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Daily Calories:</span>
                <span className={styles.summaryValue}>
                  {userProfile.onboarding?.healthMetrics?.dailyCalories || 'Calculating...'}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Goal:</span>
                <span className={styles.summaryValue}>
                  {userProfile.onboarding?.basicInfo?.goal || 'Health & Wellness'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {errors.submit && (
          <div className={styles.errorSection}>
            <div className={styles.errorMessage}>
              {errors.submit}
            </div>
            <button
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Retry Setup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step7Confirmation;




