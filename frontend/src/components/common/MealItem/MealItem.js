import React, { useState } from 'react';
import { FiClock, FiCalendar, FiMoreVertical, FiEdit, FiTrash2 } from 'react-icons/fi';
import styles from './MealItem.module.css';

const MealItem = ({
  meal,
  showTime = false,
  showDate = false,
  showCalories = true,
  showMacros = false,
  compact = false,
  onEdit,
  onDelete,
  onClick
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            <h4 className={styles.mealName}>{meal.name}</h4>
            {meal.description && (
              <p className={styles.mealDescription}>{meal.description}</p>
            )}
          </div>
        </div>
        
        <div className={styles.mealActions}>
          {showCalories && (
            <div className={styles.calories}>
              {meal.calories} kcal
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

      {showMacros && meal.nutrition && (
        <div className={styles.macrosInfo}>
          <div className={styles.macroItem}>
            <span className={styles.macroLabel}>Protein:</span>
            <span className={styles.macroValue}>{meal.nutrition.protein}g</span>
          </div>
          <div className={styles.macroItem}>
            <span className={styles.macroLabel}>Carbs:</span>
            <span className={styles.macroValue}>{meal.nutrition.carbs}g</span>
          </div>
          <div className={styles.macroItem}>
            <span className={styles.macroLabel}>Fats:</span>
            <span className={styles.macroValue}>{meal.nutrition.fats}g</span>
          </div>
        </div>
      )}

      {meal.ingredients && meal.ingredients.length > 0 && (
        <div className={styles.ingredientsInfo}>
          <div className={styles.ingredientsLabel}>Ingredients:</div>
          <div className={styles.ingredientsList}>
            {meal.ingredients.slice(0, 3).map((ingredient, index) => (
              <span key={index} className={styles.ingredient}>
                {ingredient}
                {index < Math.min(meal.ingredients.length, 3) - 1 && ', '}
              </span>
            ))}
            {meal.ingredients.length > 3 && (
              <span className={styles.moreIngredients}>
                +{meal.ingredients.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MealItem;




