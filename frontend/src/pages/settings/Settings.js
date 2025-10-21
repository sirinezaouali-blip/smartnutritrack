import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { FiMoon, FiSun, FiGlobe, FiBell, FiShield, FiUser, FiLogOut, FiSave } from 'react-icons/fi';
import styles from './Settings.module.css';

const Settings = () => {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  
  const [settings, setSettings] = useState({
    notifications: {
      mealReminders: true,
      goalAlerts: true,
      weeklyReports: true,
      socialUpdates: false
    },
    privacy: {
      profileVisibility: 'friends',
      dataSharing: false,
      analytics: true
    }
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const themes = [
    { value: 'light', label: 'Light', icon: <FiSun /> },
    { value: 'dark', label: 'Dark', icon: <FiMoon /> },
    { value: 'system', label: 'System', icon: <FiGlobe /> }
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
    { value: 'ar', label: 'العربية' }
  ];

  const handleNotificationChange = (key) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handlePrivacyChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Save settings to backend/localStorage
      localStorage.setItem('appSettings', JSON.stringify(settings));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={styles.settings}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>
          Customize your SmartNutritrack experience
        </p>
      </div>

      {/* Appearance */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Appearance</h2>
        
        <div className={styles.settingGroup}>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Theme</label>
              <p className={styles.settingDescription}>
                Choose your preferred color scheme
              </p>
            </div>
            <div className={styles.themeSelector}>
              {themes.map(themeOption => (
                <button
                  key={themeOption.value}
                  className={`${styles.themeButton} ${theme === themeOption.value ? styles.active : ''}`}
                  onClick={() => setTheme(themeOption.value)}
                >
                  {themeOption.icon}
                  {themeOption.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Language</label>
              <p className={styles.settingDescription}>
                Select your preferred language
              </p>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={styles.languageSelect}
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <FiBell className={styles.sectionIcon} />
          Notifications
        </h2>
        
        <div className={styles.settingGroup}>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Meal Reminders</label>
              <p className={styles.settingDescription}>
                Get reminded to log your meals
              </p>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.notifications.mealReminders}
                onChange={() => handleNotificationChange('mealReminders')}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Goal Alerts</label>
              <p className={styles.settingDescription}>
                Receive alerts when you reach your goals
              </p>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.notifications.goalAlerts}
                onChange={() => handleNotificationChange('goalAlerts')}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Weekly Reports</label>
              <p className={styles.settingDescription}>
                Get weekly nutrition summary reports
              </p>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.notifications.weeklyReports}
                onChange={() => handleNotificationChange('weeklyReports')}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Social Updates</label>
              <p className={styles.settingDescription}>
                Get notified about social activity
              </p>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.notifications.socialUpdates}
                onChange={() => handleNotificationChange('socialUpdates')}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <FiShield className={styles.sectionIcon} />
          Privacy & Security
        </h2>
        
        <div className={styles.settingGroup}>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Profile Visibility</label>
              <p className={styles.settingDescription}>
                Control who can see your profile
              </p>
            </div>
            <select
              value={settings.privacy.profileVisibility}
              onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
              className={styles.privacySelect}
            >
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Data Sharing</label>
              <p className={styles.settingDescription}>
                Allow anonymized data for app improvement
              </p>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.privacy.dataSharing}
                onChange={() => handlePrivacyChange('dataSharing', !settings.privacy.dataSharing)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Analytics</label>
              <p className={styles.settingDescription}>
                Help us improve with usage analytics
              </p>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.privacy.analytics}
                onChange={() => handlePrivacyChange('analytics', !settings.privacy.analytics)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <FiUser className={styles.sectionIcon} />
          Account
        </h2>
        
        <div className={styles.settingGroup}>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Export Data</label>
              <p className={styles.settingDescription}>
                Download a copy of your data
              </p>
            </div>
            <button className={styles.actionButton}>
              Export
            </button>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Delete Account</label>
              <p className={styles.settingDescription}>
                Permanently delete your account and data
              </p>
            </div>
            <button className={styles.dangerButton}>
              Delete
            </button>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Sign Out</label>
              <p className={styles.settingDescription}>
                Sign out of your account
              </p>
            </div>
            <button className={styles.logoutButton} onClick={handleLogout}>
              <FiLogOut />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className={styles.saveSection}>
        <button 
          className={`${styles.saveButton} ${saved ? styles.saved : ''}`}
          onClick={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? (
            'Saving...'
          ) : saved ? (
            'Saved!'
          ) : (
            <>
              <FiSave />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Settings;




