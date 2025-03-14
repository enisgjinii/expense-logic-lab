
import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n/i18n';

export type Language = 'en' | 'sq' | 'tr' | 'de' | 'fr' | 'ar';

export interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (lang: Language) => void;
  languages: { code: Language; name: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    (localStorage.getItem('appLanguage') as Language) || 'en'
  );

  const languages = [
    { code: 'en' as Language, name: 'English' },
    { code: 'sq' as Language, name: 'Albanian' },
    { code: 'tr' as Language, name: 'Turkish' },
    { code: 'de' as Language, name: 'German' },
    { code: 'fr' as Language, name: 'French' },
    { code: 'ar' as Language, name: 'Arabic' },
  ];

  const changeLanguage = (lang: Language) => {
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    localStorage.setItem('appLanguage', lang);
    
    // Set the document direction for RTL languages (Arabic)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    // Add or remove RTL class for styling adjustments
    if (lang === 'ar') {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  };

  // Initialize document direction on load
  useEffect(() => {
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    if (currentLanguage === 'ar') {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};
