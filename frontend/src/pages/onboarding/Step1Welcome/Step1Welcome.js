import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../contexts/LanguageContext';
import { FiArrowRight, FiHeart, FiTarget, FiUsers, FiTrendingUp } from 'react-icons/fi';
import styles from './Step1Welcome.module.css';

const Step1Welcome = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/onboarding/basic-info');
  };

  const benefits = [
    {
      icon: <FiTarget />,
      title: 'Track your daily nutrition',
      description: 'Monitor calories, macros, and nutrients with precision'
    },
    {
      icon: <FiHeart />,
      title: 'Get AI-powered recommendations',
      description: 'Smart meal suggestions tailored to your goals'
    },
    {
      icon: <FiTrendingUp />,
      title: 'Achieve your health goals',
      description: 'Lose weight, gain muscle, or maintain healthy lifestyle'
    },
    {
      icon: <FiUsers />,
      title: 'Join a supportive community',
      description: 'Connect with like-minded individuals on their journey'
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.welcomeCard}>
        {/* Progress Indicator */}
        <div className={styles.progressIndicator}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: '14%' }}></div>
          </div>
          <span className={styles.progressText}>Step 1 of 7</span>
        </div>

        {/* Welcome Content */}
        <div className={styles.content}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🍎</span>
            <h1 className={styles.logoText}>SmartNutritrack</h1>
          </div>

          <div className={styles.welcomeSection}>
            <h2 className={styles.title}>Welcome to Your Nutrition Journey</h2>
            <p className={styles.subtitle}>
              We'll help you create a personalized nutrition plan in just 7 simple steps.
            </p>
          </div>

          {/* Benefits */}
          <div className={styles.benefitsSection}>
            <h3 className={styles.benefitsTitle}>What you'll get:</h3>
            <div className={styles.benefitsGrid}>
              {benefits.map((benefit, index) => (
                <div key={index} className={styles.benefitCard}>
                  <div className={styles.benefitIcon}>
                    {benefit.icon}
                  </div>
                  <h4 className={styles.benefitTitle}>{benefit.title}</h4>
                  <p className={styles.benefitDescription}>{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Motivational Message */}
          <div className={styles.motivationalSection}>
            <div className={styles.motivationalCard}>
              <h3 className={styles.motivationalTitle}>Ready to Transform Your Health?</h3>
              <p className={styles.motivationalText}>
                Join thousands of users who have already started their journey to better nutrition and healthier living.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className={styles.actionSection}>
          <button 
            className={styles.getStartedButton}
            onClick={handleGetStarted}
          >
            Get Started
            <FiArrowRight className={styles.buttonIcon} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step1Welcome;









