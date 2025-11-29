import React from 'react';
import { FiTrendingUp, FiAlertCircle, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
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
  // Safe value formatting function
  const formatValue = (value) => {
    if (value === null || value === undefined) return '--';
    return value.toLocaleString();
  };

  // Safe percentage calculation
  const percentage = target && target > 0 ? Math.min((current / target) * 100, 100) : 0;
  
  // Safe remaining calculation
  const remaining = target ? Math.max(target - current, 0) : 0;

  // Calculate how much over target (negative means under target)
  const overTarget = target ? current - target : 0;

  // Get warning status based on how much over target
  const getWarningStatus = () => {
    if (!target || overTarget <= 0) return null;
    
    const overPercentage = (overTarget / target) * 100;
    
    if (overPercentage >= 50) {
      return { 
        type: 'danger', 
        icon: <FiAlertCircle className={styles.warningIcon} />,
        message: `You've exceeded your ${title.toLowerCase()} target by ${Math.round(overPercentage)}%!`,
        color: '#F44336'
      };
    } else if (overPercentage >= 25) {
      return { 
        type: 'warning', 
        icon: <FiAlertTriangle className={styles.warningIcon} />,
        message: `You're ${Math.round(overPercentage)}% over your ${title.toLowerCase()} target`,
        color: '#FF9800'
      };
    } else {
      return { 
        type: 'info', 
        icon: <FiAlertTriangle className={styles.warningIcon} />,
        message: `Slightly over ${title.toLowerCase()} target`,
        color: '#FFC107'
      };
    }
  };

  // Get encouragement message when under target
  const getEncouragementMessage = () => {
    if (!target || overTarget > 0) return null;
    
    const remainingPercentage = (remaining / target) * 100;
    
    if (remainingPercentage >= 75) {
      return `You have ${formatValue(remaining)}${unit} ${title.toLowerCase()} remaining for today`;
    } else if (remainingPercentage >= 50) {
      return `Good progress! ${formatValue(remaining)}${unit} ${title.toLowerCase()} to go`;
    } else if (remainingPercentage >= 25) {
      return `Almost there! Only ${formatValue(remaining)}${unit} ${title.toLowerCase()} left`;
    } else {
      return `Great job! You're close to your ${title.toLowerCase()} goal`;
    }
  };

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

  const warningStatus = getWarningStatus();
  const encouragementMessage = getEncouragementMessage();

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
            {formatValue(current)}
          </div>
          <div className={styles.targetValue}>
            / {formatValue(target)} {unit}
          </div>
        </div>

        {/* Warning Message - Shows when over target */}
        {warningStatus && (
          <div 
            className={`${styles.warningMessage} ${styles[warningStatus.type]}`}
            style={{ borderColor: warningStatus.color }}
          >
            <div className={styles.warningContent}>
              {warningStatus.icon}
              <span className={styles.warningText}>{warningStatus.message}</span>
            </div>
          </div>
        )}

        {/* Encouragement Message - Shows when under target */}
        {encouragementMessage && !warningStatus && (
          <div className={styles.encouragementMessage}>
            <div className={styles.encouragementContent}>
              <FiTrendingUp className={styles.encouragementIcon} />
              <span className={styles.encouragementText}>{encouragementMessage}</span>
            </div>
          </div>
        )}

        <div className={styles.percentageInfo}>
          <div className={styles.percentageItem}>
            <span className={styles.percentageLabel}>Needed {title.toLowerCase()} per day:</span>
            <span className={styles.percentageValue}>{formatValue(target)} {unit}</span>
          </div>
          <div className={styles.percentageItem}>
            <span className={styles.percentageLabel}>Consumed:</span>
            <span className={styles.percentageValue}>{formatValue(current)} {unit}</span>
          </div>
          <div className={styles.percentageItem}>
            <span className={styles.percentageLabel}>Remaining:</span>
            <span className={styles.percentageValue}>{formatValue(remaining)} {unit}</span>
          </div>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.circularProgress}>
            <svg className={styles.progressCircle} viewBox="0 0 100 100">
              <circle
                className={styles.progressCircleBg}
                cx="50"
                cy="50"
                r="40"
                strokeWidth="20"
                fill="none"
              />
              <circle
                className={styles.progressCircleFill}
                cx="50"
                cy="50"
                r="40"
                strokeWidth="20"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
                style={{ 
                  stroke: warningStatus ? warningStatus.color : getStatusColor(),
                  strokeWidth: warningStatus ? '22' : '20'
                }}
                transform="rotate(-90 50 50)"
                fill="none"
              />
            </svg>
            <div className={styles.percentage}>
              {target ? `${Math.round(percentage)}%` : '--'}
            </div>
          </div>
        </div>

        {message && !warningStatus && (
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



