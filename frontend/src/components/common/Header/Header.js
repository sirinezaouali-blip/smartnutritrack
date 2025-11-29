import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { FiMenu, FiX, FiShoppingCart, FiSun, FiMoon, FiGlobe } from 'react-icons/fi';
import styles from './Header.module.css';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme, getCurrentTheme } = useTheme();
  const { language, changeLanguage, getLanguageFlag, getLanguageName } = useLanguage();
  const navigate = useNavigate();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const toggleLanguage = () => {
    setIsLanguageOpen(!isLanguageOpen);
  };

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    setIsLanguageOpen(false);
  };

  const isDarkMode = getCurrentTheme() === 'dark';

  if (!isAuthenticated()) {
    return null; // Don't show header for unauthenticated users
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link to="/dashboard" className={styles.logo}>
          <span className={styles.logoIcon}>🍎</span>
          <span className={styles.logoText}>SmartNutritrack</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          <Link to="/dashboard" className={styles.navLink}>Dashboard</Link>
          <Link to="/meal-planner" className={styles.navLink}>Meal Planner</Link>
          <Link to="/scan-food" className={styles.navLink}>Scan Food</Link>
          <Link to="/analytics" className={styles.navLink}>Analytics</Link>
          <Link to="/social" className={styles.navLink}>Social</Link></nav>

        {/* Right Side Actions */}
        <div className={styles.actions}>
          {/* Cart Icon */}
          <button
            className={styles.actionButton}
            title="Cart"
            onClick={() => navigate('/cart')}
          >
            <FiShoppingCart />
            <span className={styles.badge}>0</span>
          </button>

          {/* Language Selector */}
          <div className={styles.languageSelector}>
            <button 
              className={styles.actionButton} 
              onClick={toggleLanguage}
              title="Change Language"
            >
              <span className={styles.flag}>{getLanguageFlag(language)}</span>
            </button>
            
            {isLanguageOpen && (
              <div className={styles.languageDropdown}>
                {['en', 'fr', 'ar', 'de', 'it'].map(lang => (
                  <button
                    key={lang}
                    className={`${styles.languageOption} ${language === lang ? styles.active : ''}`}
                    onClick={() => handleLanguageChange(lang)}
                  >
                    <span className={styles.flag}>{getLanguageFlag(lang)}</span>
                    <span className={styles.languageName}>{getLanguageName(lang)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button 
            className={styles.actionButton} 
            onClick={toggleTheme}
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            {isDarkMode ? <FiSun /> : <FiMoon />}
          </button>

          {/* Profile Dropdown */}
          <div className={styles.profileSection}>
            <button 
              className={styles.profileButton} 
              onClick={toggleProfile}
              title="User Profile"
            >
              <div className={styles.profileAvatar}>
                {user?.firstName?.charAt(0) || 'U'}
              </div>
              <span className={styles.profileName}>
                {user?.firstName || 'User'}
              </span>
            </button>

            {isProfileOpen && (
              <div className={styles.profileDropdown}>
                <div className={styles.profileInfo}>
                  <div className={styles.profileAvatarLarge}>
                    {user?.firstName?.charAt(0) || 'U'}
                  </div>
                  <div className={styles.profileDetails}>
                    <div className={styles.profileNameLarge}>
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className={styles.profileEmail}>
                      {user?.email}
                    </div>
                  </div>
                </div>
                
                <div className={styles.profileActions}>
                  <Link 
                    to="/profile" 
                    className={styles.profileAction}
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link 
                    to="/settings" 
                    className={styles.profileAction}
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Settings
                  </Link>
                  <Link 
                    to="/meal-history" 
                    className={styles.profileAction}
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Meal History
                  </Link>
                  <button 
                    className={styles.profileAction}
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className={styles.mobileMenuButton} 
            onClick={toggleMenu}
            title="Menu"
          >
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className={styles.mobileNav}>
          <Link 
            to="/dashboard" 
            className={styles.mobileNavLink}
            onClick={() => setIsMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link 
            to="/meal-planner" 
            className={styles.mobileNavLink}
            onClick={() => setIsMenuOpen(false)}
          >
            Meal Planner
          </Link>
          <Link 
            to="/scan-food" 
            className={styles.mobileNavLink}
            onClick={() => setIsMenuOpen(false)}
          >
            Scan Food
          </Link>
          <Link 
            to="/add-meal" 
            className={styles.mobileNavLink}
            onClick={() => setIsMenuOpen(false)}
          >
            Add Meal
          </Link>
          <Link 
            to="/analytics" 
            className={styles.mobileNavLink}
            onClick={() => setIsMenuOpen(false)}
          >
            Analytics
          </Link>
          <Link 
            to="/profile" 
            className={styles.mobileNavLink}
            onClick={() => setIsMenuOpen(false)}
          >
            Profile
          </Link>
          <Link 
            to="/social" 
            className={styles.mobileNavLink}
            onClick={() => setIsMenuOpen(false)}
          >
            Social
          </Link>
          <Link 
            to="/settings" 
            className={styles.mobileNavLink}
            onClick={() => setIsMenuOpen(false)}
          >
            Settings
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;









