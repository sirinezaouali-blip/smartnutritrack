import React, { useState } from 'react';
import { FiClock, FiCalendar, FiMoreVertical, FiEdit, FiTrash2 } from 'react-icons/fi';
import styles from './MealItem.module.css';

const MealItem = ({
  meal,
  showTime = false,
  showDate = false,
  showCalories = true,
  showMacros = true, // Changed to true by default
  compact = false,
  onEdit,
  onDelete,
  onClick
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getMealTypeIcon = (mealType) => {
    const icons = {
      breakfast: '🌅',
      lunch: '🌞',
      dinner: '🌙',
      snack: '🍎'
    };
    return icons[mealType] || '🍽️';
  };

  const getMealTypeColor = (mealType) => {
    const colors = {
      breakfast: '#FF9800',
      lunch: '#4CAF50',
      dinner: '#2196F3',
      snack: '#9C27B0'
    };
    return colors[mealType] || '#757575';
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onEdit) onEdit(meal);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onDelete) onDelete(meal);
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDetails = (e) => {
    e.stopPropagation();
    setShowFullDetails(!showFullDetails);
  };

  // Get meal data from either meal.mealId (populated) or directly from meal
  const mealDetails = meal.mealId || meal;

  return (
    <div 
      className={`${styles.mealItem} ${compact ? styles.compact : ''}`}
      onClick={onClick}
    >
      <div className={styles.mealHeader}>
        <div className={styles.mealType}>
          <span 
            className={styles.mealIcon}
            style={{ backgroundColor: getMealTypeColor(meal.mealType) }}
          >
            {getMealTypeIcon(meal.mealType)}
          </span>
          <div className={styles.mealInfo}>
            <h4 className={styles.mealName}>{mealDetails.name}</h4>
            <div className={styles.mealTypeBadge}>
              {meal.mealType}
            </div>
          </div>
        </div>
        
        <div className={styles.mealActions}>
          {showCalories && (
            <div className={styles.calories}>
              {meal.calories || mealDetails.calories} kcal
            </div>
          )}
          
          {(onEdit || onDelete) && (
            <div className={styles.actionMenu}>
              <button
                className={styles.actionButton}
                onClick={toggleMenu}
              >
                <FiMoreVertical />
              </button>
              {isMenuOpen && (
                <div className={styles.dropdown}>
                  {onEdit && (
                    <button className={styles.dropdownItem} onClick={handleEdit}>
                      <FiEdit className={styles.dropdownIcon} />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button className={styles.dropdownItem} onClick={handleDelete}>
                      <FiTrash2 className={styles.dropdownIcon} />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {mealDetails.description && (
        <div className={styles.description}>
          {mealDetails.description}
        </div>
      )}

      {/* Nutrition Information */}
      <div className={styles.nutritionGrid}>
        <div className={styles.nutritionItem}>
          <span className={styles.nutritionLabel}>Protein:</span>
          <span className={styles.nutritionValue}>{meal.protein || mealDetails.protein || 0}g</span>
        </div>
        <div className={styles.nutritionItem}>
          <span className={styles.nutritionLabel}>Carbs:</span>
          <span className={styles.nutritionValue}>{meal.carbs || mealDetails.carbs || 0}g</span>
        </div>
        <div className={styles.nutritionItem}>
          <span className={styles.nutritionLabel}>Fats:</span>
          <span className={styles.nutritionValue}>{meal.fats || mealDetails.fats || 0}g</span>
        </div>
      </div>

      {/* Time Information */}
      {(showTime || showDate) && (
        <div className={styles.timeInfo}>
          {showTime && (
            <div className={styles.timeItem}>
              <FiClock className={styles.timeIcon} />
              <span>{formatTime(meal.createdAt)}</span>
            </div>
          )}
          {showDate && (
            <div className={styles.timeItem}>
              <FiCalendar className={styles.timeIcon} />
              <span>{formatDate(meal.createdAt)}</span>
            </div>
          )}
        </div>
      )}

      {/* Expandable Details */}
      <button className={styles.detailsToggle} onClick={toggleDetails}>
        {showFullDetails ? 'Show Less' : 'Show More Details'}
      </button>

      {showFullDetails && (
        <div className={styles.expandedDetails}>
          {/* Ingredients */}
          {mealDetails.ingredients && mealDetails.ingredients.length > 0 && (
            <div className={styles.detailSection}>
              <div className={styles.detailLabel}>Ingredients:</div>
              <div className={styles.ingredientsList}>
                {mealDetails.ingredients.map((ingredient, index) => (
                  <span key={index} className={styles.ingredient}>
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Serving Size */}
          {mealDetails.servingSize && (
            <div className={styles.detailSection}>
              <div className={styles.detailLabel}>Serving Size:</div>
              <div className={styles.detailValue}>{mealDetails.servingSize}</div>
            </div>
          )}

          {/* Notes */}
          {meal.notes && (
            <div className={styles.detailSection}>
              <div className={styles.detailLabel}>Notes:</div>
              <div className={styles.detailValue}>{meal.notes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MealItem;



