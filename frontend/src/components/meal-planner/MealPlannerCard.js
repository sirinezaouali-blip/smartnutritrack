import React, { useState } from 'react';
import { FiTarget, FiTrendingUp, FiShield, FiInfo } from 'react-icons/fi';
import { ScientificRecoveryEngine } from '../../utils/scientificRecoveryEngine';
import styles from './MealPlannerCard.module.css';

const MealPlannerCard = ({
  type,
  title,
  description,
  icon,
  isActive,
  tooltip,
  onClick,
  currentMeal,
  cardStates
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getCardIcon = () => {
    switch (type) {
      case 'multipleDaily':
        return <FiTarget className={styles.cardIcon} />;
      case 'lowCarbHighProtein':
        return <FiTrendingUp className={styles.cardIcon} />;
      case 'freeSingle':
        return <FiShield className={styles.cardIcon} />;
      default:
        return icon;
    }
  };

  const getCardColor = () => {
    if (!isActive) return '#9E9E9E'; // Gray for inactive

    switch (type) {
      case 'multipleDaily':
        return '#4CAF50'; // Green
      case 'lowCarbHighProtein':
        return '#FF9800'; // Orange
      case 'freeSingle':
        return '#2196F3'; // Blue
      default:
        return '#4CAF50';
    }
  };

  const getStatusText = () => {
    if (type === 'freeSingle') return 'Always Available';
    return isActive ? 'Active' : 'Inactive';
  };

  const getStatusColor = () => {
    if (type === 'freeSingle') return '#4CAF50';
    return isActive ? '#4CAF50' : '#F44336';
  };

  return (
    <div
      className={`${styles.card} ${!isActive ? styles.inactive : ''}`}
      onClick={isActive ? onClick : undefined}
      style={{
        borderColor: getCardColor(),
        cursor: isActive ? 'pointer' : 'not-allowed'
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={styles.cardHeader}>
        <div className={styles.iconContainer}>
          {getCardIcon()}
        </div>
        <div className={styles.statusIndicator}>
          <span
            className={styles.statusDot}
            style={{ backgroundColor: getStatusColor() }}
          ></span>
          <span className={styles.statusText}>{getStatusText()}</span>
        </div>
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDescription}>{description}</p>

        {currentMeal && (
          <div className={styles.currentMeal}>
            <FiInfo className={styles.infoIcon} />
            <span>Current: {currentMeal.charAt(0).toUpperCase() + currentMeal.slice(1)}</span>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && tooltip && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipContent}>
            {tooltip}
          </div>
          <div className={styles.tooltipArrow}></div>
        </div>
      )}

      {/* Overlay for inactive cards */}
      {!isActive && type !== 'freeSingle' && (
        <div className={styles.inactiveOverlay}>
          <div className={styles.overlayContent}>
            <FiInfo className={styles.overlayIcon} />
            <span>Check tooltip for details</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlannerCard;
