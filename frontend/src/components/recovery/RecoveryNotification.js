import React, { useState, useEffect } from 'react';
import { FiBell, FiX, FiCheckCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import styles from './RecoveryNotification.module.css';

const RecoveryNotification = ({
  type = 'info',
  title,
  message,
  duration = 5000,
  onClose,
  onAction
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration > 0) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            handleClose();
            return 0;
          }
          return prev - (100 / (duration / 100));
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Wait for animation
  };

  const handleAction = () => {
    if (onAction) onAction();
    handleClose();
  };

  const getNotificationConfig = () => {
    const configs = {
      success: {
        icon: FiCheckCircle,
        color: '#4CAF50',
        bgColor: '#E8F5E8',
        borderColor: '#4CAF50'
      },
      warning: {
        icon: FiAlertTriangle,
        color: '#FF9800',
        bgColor: '#FFF3E0',
        borderColor: '#FF9800'
      },
      error: {
        icon: FiAlertTriangle,
        color: '#F44336',
        bgColor: '#FFEBEE',
        borderColor: '#F44336'
      },
      info: {
        icon: FiInfo,
        color: '#2196F3',
        bgColor: '#E3F2FD',
        borderColor: '#2196F3'
      },
      recovery: {
        icon: FiBell,
        color: '#9C27B0',
        bgColor: '#F3E5F5',
        borderColor: '#9C27B0'
      }
    };
    return configs[type] || configs.info;
  };

  const config = getNotificationConfig();
  const IconComponent = config.icon;

  if (!isVisible) return null;

  return (
    <div
      className={`${styles.notification} ${styles.fadeOut}`}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor
      }}
    >
      <div className={styles.content}>
        <div className={styles.icon}>
          <IconComponent
            className={styles.iconComponent}
            style={{ color: config.color }}
          />
        </div>

        <div className={styles.text}>
          {title && (
            <h4 className={styles.title} style={{ color: config.color }}>
              {title}
            </h4>
          )}
          <p className={styles.message}>{message}</p>
        </div>

        <div className={styles.actions}>
          {onAction && (
            <button
              className={styles.actionButton}
              onClick={handleAction}
              style={{ color: config.color }}
            >
              View Plan
            </button>
          )}
          <button
            className={styles.closeButton}
            onClick={handleClose}
            style={{ color: config.color }}
          >
            <FiX />
          </button>
        </div>
      </div>

      {duration > 0 && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${progress}%`,
              backgroundColor: config.color
            }}
          />
        </div>
      )}
    </div>
  );
};

// Recovery-specific notification component
export const RecoveryAlert = ({
  exceedanceData,
  onViewRecovery,
  onDismiss
}) => {
  if (!exceedanceData?.hasExceedance) return null;

  const { level, percentage, calories } = exceedanceData;

  const getAlertConfig = () => {
    switch (level) {
      case 'large':
        return {
          type: 'error',
          title: 'Significant Calorie Exceedance',
          message: `You've exceeded your target by ${percentage.toFixed(1)}% (${calories.toFixed(0)} kcal). A recovery plan is recommended.`
        };
      case 'moderate':
        return {
          type: 'warning',
          title: 'Moderate Calorie Exceedance',
          message: `You've exceeded your target by ${percentage.toFixed(1)}% (${calories.toFixed(0)} kcal). Consider adjusting your next meals.`
        };
      case 'minor':
        return {
          type: 'info',
          title: 'Minor Calorie Exceedance',
          message: `You've exceeded your target by ${percentage.toFixed(1)}% (${calories.toFixed(0)} kcal). Small adjustment recommended.`
        };
      default:
        return {
          type: 'info',
          title: 'Calorie Status Update',
          message: 'Your meal consumption is being monitored for optimal nutrition.'
        };
    }
  };

  const config = getAlertConfig();

  return (
    <RecoveryNotification
      type={config.type}
      title={config.title}
      message={config.message}
      duration={level === 'large' ? 0 : 8000} // Large exceedances don't auto-dismiss
      onAction={onViewRecovery}
      onClose={onDismiss}
    />
  );
};

export default RecoveryNotification;
