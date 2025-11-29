import React from 'react';
import { FiFilter, FiX } from 'react-icons/fi';
import styles from './CategoryFilter.module.css';

const CategoryFilter = ({ activeCategories, onCategoryChange, onClearFilters }) => {
  const categories = [
    { id: 'progress', label: 'Progress', icon: '📊', color: '#4CAF50' },
    { id: 'achievement', label: 'Achievements', icon: '🏆', color: '#FF9800' },
    { id: 'meal_share', label: 'Meals', icon: '🍽️', color: '#2196F3' },
    { id: 'workout', label: 'Workouts', icon: '💪', color: '#F44336' },
    { id: 'question', label: 'Questions', icon: '❓', color: '#9C27B0' },
    { id: 'tip', label: 'Tips', icon: '💡', color: '#009688' },
    { id: 'motivation', label: 'Motivation', icon: '🔥', color: '#FF5722' }
  ];

  const handleCategoryToggle = (categoryId) => {
    if (activeCategories.includes(categoryId)) {
      // Remove category
      onCategoryChange(activeCategories.filter(id => id !== categoryId));
    } else {
      // Add category
      onCategoryChange([...activeCategories, categoryId]);
    }
  };

  const hasActiveFilters = activeCategories.length > 0;

  return (
    <div className={styles.categoryFilter}>
      <div className={styles.filterHeader}>
        <div className={styles.filterTitle}>
          <FiFilter className={styles.filterIcon} />
          <span>Filter Posts</span>
        </div>
        {hasActiveFilters && (
          <button 
            className={styles.clearButton}
            onClick={onClearFilters}
          >
            <FiX />
            Clear
          </button>
        )}
      </div>

      <div className={styles.categoriesGrid}>
        {categories.map(category => (
          <button
            key={category.id}
            className={`${styles.categoryButton} ${
              activeCategories.includes(category.id) ? styles.active : ''
            }`}
            onClick={() => handleCategoryToggle(category.id)}
            style={{
              '--category-color': category.color
            }}
          >
            <span className={styles.categoryIcon}>{category.icon}</span>
            <span className={styles.categoryLabel}>{category.label}</span>
          </button>
        ))}
      </div>

      {hasActiveFilters && (
        <div className={styles.activeFilters}>
          <span className={styles.activeFiltersText}>
            Showing: {activeCategories.map(id => 
              categories.find(cat => cat.id === id)?.label
            ).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;