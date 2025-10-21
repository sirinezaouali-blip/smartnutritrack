import React from 'react';
import { FiTrendingUp, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import styles from './ProgressCard.module.css';

const ProgressCard = ({ 
  title, 
  current, 
  target, 
  unit, 
  icon, 
  color = 'primary', 
  status = 'neutral',
  message = ''
}) => {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  
  const getStatusIcon = () => {
    switch (status) {
      case 'excellent':
        return <FiCheckCircle className={styles.statusIcon} />;
      case 'good':
        return <FiTrendingUp className={styles.statusIcon} />;
      case 'low':
        return <FiAlertCircle className={styles.statusIcon} />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'excellent':
        return '#4CAF50';
      case 'good':
        return '#8BC34A';
      case 'okay':
        return '#FF9800';
      case 'low':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  return (
    <div className={`${styles.progressCard} ${styles[`color${color.charAt(0).toUpperCase() + color.slice(1)}`]}`}>
      <div className={styles.cardHeader}>
        <div className={styles.titleSection}>
          <div className={styles.iconContainer}>
            {icon}
          </div>
          <h3 className={styles.title}>{title}</h3>
        </div>
        {getStatusIcon()}
      </div>
      
      <div className={styles.cardContent}>
        <div className={styles.valueSection}>
          <div className={styles.currentValue}>
            {current.toLocaleString()}
          </div>
          <div className={styles.targetValue}>
            / {target.toLocaleString()} {unit}
          </div>
        </div>
        
        <div className={styles.progressSection}>
          <div className={styles.circularProgress}>
            <svg className={styles.progressCircle} viewBox="0 0 100 100">
              <circle
                className={styles.progressCircleBg}
                cx="50"
                cy="50"
                r="45"
                strokeWidth="8"
              />
              <circle
                className={styles.progressCircleFill}
                cx="50"
                cy="50"
                r="45"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
                style={{ stroke: getStatusColor() }}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className={styles.percentage}>
              {Math.round(percentage)}%
            </div>
          </div>
        </div>
        
        {message && (
          <div 
            className={styles.statusMessage}
            style={{ color: getStatusColor() }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressCard;




