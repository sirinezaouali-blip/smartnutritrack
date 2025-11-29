import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../utils/i18n';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
    
    // Update document language attribute
    document.documentElement.lang = language;
  }, [language]);

  const changeLanguage = (lang) => {
    if (['en', 'fr', 'ar', 'de', 'it'].includes(lang)) {
      setLanguage(lang);
    }
  };

  const getLanguageFlag = (lang) => {
    const flags = {
      en: '🇺🇸',
      fr: '🇫🇷',
      ar: '🇸🇦',
      de: '🇩🇪',
      it: '🇮🇹'
    };
    return flags[lang] || '🇺🇸';
  };

  const getLanguageName = (lang) => {
    const names = {
      en: 'English',
      fr: 'Français',
      ar: 'العربية',
      de: 'Deutsch',
      it: 'Italiano'
    };
    return names[lang] || 'English';
  };

  const t = (key, options = {}) => {
    return i18n.t(key, options);
  };

  const value = {
    language,
    changeLanguage,
    getLanguageFlag,
    getLanguageName,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};









