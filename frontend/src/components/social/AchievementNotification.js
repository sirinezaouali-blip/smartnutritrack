import React, { useEffect, useState } from 'react';
import { FiAward, FiX } from 'react-icons/fi';
import styles from './AchievementNotification.module.css';

const AchievementNotification = ({ achievement, onClose, autoClose = true }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show notification with a small delay for smooth animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Auto close after 5 seconds if enabled
    if (autoClose) {
      const closeTimer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(closeTimer);
    }

    return () => clearTimeout(timer);
  }, [autoClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

  if (!achievement) return null;

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#4CAF50';
      case 'rare': return '#2196F3';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FF9800';
      default: return '#4CAF50';
    }
  };

  return (
    <div className={`${styles.notification} ${isVisible ? styles.visible : ''}`}>
      <div 
        className={styles.notificationContent}
        style={{ borderLeftColor: getRarityColor(achievement.rarity) }}
      >
        <div className={styles.notificationHeader}>
          <div className={styles.achievementIcon}>
            <span className={styles.icon}>{achievement.icon}</span>
          </div>
          <div className={styles.achievementInfo}>
            <h4 className={styles.achievementName}>{achievement.name}</h4>
            <p className={styles.achievementDescription}>{achievement.description}</p>
          </div>
          <button className={styles.closeButton} onClick={handleClose}>
            <FiX />
          </button>
        </div>
        
        <div className={styles.achievementDetails}>
          <div className={styles.points}>
            <FiAward className={styles.pointsIcon} />
            <span>+{achievement.points} points</span>
          </div>
          <div className={styles.rarity} style={{ color: getRarityColor(achievement.rarity) }}>
            {achievement.rarity}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification;