import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { fetchUserMeals, fetchMealHistory, deleteUserMeal } from '../../services/analyticsService';
import { FiSearch, FiFilter, FiCalendar, FiClock, FiTrash2, FiEdit, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import MealItem from '../../components/common/MealItem/MealItem';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './MealHistory.module.css';
import { useNavigate } from 'react-router-dom';

const MealHistory = () => {
  const { userProfile } = useUser();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [mealHistory, setMealHistory] = useState([]);
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [mealsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('date-desc');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    const loadMealHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchMealHistory(page, limit);
        console.log('🔍 MEAL HISTORY API RESPONSE:', response); // ADD THIS LINE
        
        if (response.success) {
          console.log('🔍 MEAL HISTORY DATA:', response.data); // ADD THIS LINE
          setMealHistory(response.data || []);
          setFilteredMeals(response.data || []);
        } else {
          setError('Failed to load meal history');
        }
      } catch (error) {
        console.error('Meal history loading error:', error);
        setError('Failed to load meal history');
      } finally {
        setLoading(false);
      }
    };

    loadMealHistory();
  }, []);

  useEffect(() => {
    let filtered = [...mealHistory];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(meal => {
        const mealName = meal.mealId?.name || meal.name || '';
        return mealName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Meal type filter
    if (selectedMealType !== 'all') {
      filtered = filtered.filter(meal => meal.mealType === selectedMealType);
    }

    // Date filter
    if (selectedDate) {
      filtered = filtered.filter(meal => {
        const mealDate = new Date(meal.createdAt).toISOString().split('T')[0];
        return mealDate === selectedDate;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'calories-desc':
          return b.calories - a.calories;
        case 'calories-asc':
          return a.calories - b.calories;
        case 'name-asc':
          return (a.mealId?.name || a.name || '').localeCompare(b.mealId?.name || b.name || '');
        case 'name-desc':
          return (b.mealId?.name || b.name || '').localeCompare(a.mealId?.name || a.name || '');
        default:
          return 0;
      }
    });

    setFilteredMeals(filtered);
    setCurrentPage(1);
  }, [mealHistory, searchTerm, selectedMealType, selectedDate, sortBy]);

  const mealTypes = [
    { value: 'all', label: 'All Meals' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'snack', label: 'Snack' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' }
  ];

  const sortOptions = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'calories-desc', label: 'Highest Calories' },
    { value: 'calories-asc', label: 'Lowest Calories' },
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' }
  ];

  // Pagination
  const indexOfLastMeal = currentPage * mealsPerPage;
  const indexOfFirstMeal = indexOfLastMeal - mealsPerPage;
  const currentMeals = filteredMeals.slice(indexOfFirstMeal, indexOfLastMeal);
  const totalPages = Math.ceil(filteredMeals.length / mealsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDeleteMeal = async (meal) => {
    if (window.confirm(`Are you sure you want to delete "${meal.name}"?`)) {
      try {
        // Use the deleteUserMeal service
        const deleteResponse = await deleteUserMeal(meal._id);
        
        if (deleteResponse.success) {
          // Remove from both arrays using _id
          setMealHistory(prev => prev.filter(m => m._id !== meal._id));
          setFilteredMeals(prev => prev.filter(m => m._id !== meal._id));
        } else {
          alert('Failed to delete meal. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting meal:', error);
        alert('Error deleting meal. Please try again.');
      }
    }
  };

  const handleEditMeal = (meal) => {
  // Navigate to edit user meal page
    navigate(`/edit-user-meal/${meal._id}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMealType('all');
    setSelectedDate('');
    setSortBy('date-desc');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" message="Loading meal history..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mealHistory}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Meal History</h1>
          <p className={styles.subtitle}>
            View and manage your complete meal tracking history
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.filtersGrid}>
          {/* Search */}
          <div className={styles.filterGroup}>
            <div className={styles.searchBox}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search meals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* Meal Type Filter */}
          <div className={styles.filterGroup}>
            <select
              value={selectedMealType}
              onChange={(e) => setSelectedMealType(e.target.value)}
              className={styles.filterSelect}
            >
              {mealTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className={styles.filterGroup}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={styles.dateInput}
              placeholder="Filter by date"
            />
          </div>

          {/* Sort */}
          <div className={styles.filterGroup}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.filterSelect}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className={styles.filterGroup}>
            <button
              onClick={clearFilters}
              className={styles.clearButton}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className={styles.resultsSummary}>
        <p>
          Showing {currentMeals.length} of {filteredMeals.length} meals
          {searchTerm && ` matching "${searchTerm}"`}
          {selectedMealType !== 'all' && ` of type ${mealTypes.find(t => t.value === selectedMealType)?.label}`}
          {selectedDate && ` on ${new Date(selectedDate).toLocaleDateString()}`}
        </p>
      </div>

      {/* Meals List */}
      <div className={styles.mealsSection}>
        {currentMeals.length > 0 ? (
          <div className={styles.mealsList}>
            {currentMeals.map((meal) => (
              <div key={meal.id} className={styles.mealHistoryItem}>
                <MealItem
                  meal={meal}
                  showTime={true}
                  showCalories={true}
                  showDate={true}
                  showMacros={true}
                  compact={false}
                />
                <div className={styles.mealActions}>
                  <button
                    onClick={() => handleEditMeal(meal)}
                    className={styles.actionButton}
                    title="Edit meal"
                  >
                    <FiEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteMeal(meal)}  
                    className={styles.actionButton}
                    title="Delete meal"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h3>No meals found</h3>
            <p>
              {mealHistory.length === 0
                ? "You haven't logged any meals yet. Start tracking your nutrition!"
                : "Try adjusting your filters to see more results."
              }
            </p>
            {mealHistory.length > 0 && (
              <button onClick={clearFilters} className={styles.emptyActionButton}>
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={styles.pageButton}
          >
            <FiChevronLeft />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
            <button
              key={number}
              onClick={() => paginate(number)}
              className={`${styles.pageButton} ${currentPage === number ? styles.active : ''}`}
            >
              {number}
            </button>
          ))}

          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={styles.pageButton}
          >
            <FiChevronRight />
          </button>
        </div>
      )}

      {/* Stats Summary */}
      {mealHistory.length > 0 && (
        <div className={styles.statsSection}>
          <h2 className={styles.sectionTitle}>History Summary</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FiCalendar />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>
                  {mealHistory.length}
                </div>
                <div className={styles.statLabel}>Total Meals</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FiClock />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>
                  {Math.round(mealHistory.reduce((sum, meal) => sum + meal.calories, 0) / mealHistory.length)}
                </div>
                <div className={styles.statLabel}>Avg Calories/Meal</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                📅
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>
                  {new Set(mealHistory.map(meal => new Date(meal.createdAt).toDateString())).size}
                </div>
                <div className={styles.statLabel}>Days Logged</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealHistory;
