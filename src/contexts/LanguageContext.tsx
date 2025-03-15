
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, TranslationsType, languages } from '@/locales';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  availableLanguages: typeof languages;
  isRTL: boolean;
  formatDate: (date: Date, format?: string) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currencyCode?: string) => string;
}

const defaultLanguage: Language = 'en';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Always use English
  const [language, setLanguageState] = useLocalStorage<Language>('app-language', defaultLanguage);
  const [isRTL, setIsRTL] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr';
    document.documentElement.classList.remove('rtl');
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState('en'); // Force English
  };

  // Translation function with variable substitution and nested key support
  const t = (key: string, variables?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    // Navigate through nested objects
    for (const k of keys) {
      if (value && Object.prototype.hasOwnProperty.call(value, k)) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    // Handle variable substitution with both {{var}} and {var} formats
    if (variables && typeof value === 'string') {
      // Handle {{var}} format (standard)
      let result = value.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
        return variables[variable] !== undefined 
          ? String(variables[variable]) 
          : match;
      });
      
      // Also handle {var} format (alternative)
      result = result.replace(/\{(\w+)\}/g, (match, variable) => {
        return variables[variable] !== undefined 
          ? String(variables[variable]) 
          : match;
      });
      
      return result;
    }

    return value || key;
  };

  // Format date according to the current language
  const formatDate = (date: Date, format?: string): string => {
    try {
      const options: Intl.DateTimeFormatOptions = format === 'short' 
        ? { year: 'numeric', month: 'numeric', day: 'numeric' }
        : format === 'long'
          ? { year: 'numeric', month: 'long', day: 'numeric' }
          : { year: 'numeric', month: 'short', day: 'numeric' };

      return new Intl.DateTimeFormat(language, options).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return date.toLocaleDateString();
    }
  };

  // Format number according to the current language
  const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
    try {
      return new Intl.NumberFormat(language, options).format(num);
    } catch (error) {
      console.error('Error formatting number:', error);
      return num.toString();
    }
  };

  // Format currency according to the current language
  const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
    try {
      return new Intl.NumberFormat(language, {
        style: 'currency',
        currency: currencyCode
      }).format(amount);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `${currencyCode} ${amount}`;
    }
  };

  return (
    <LanguageContext.Provider 
      value={{ 
        language, 
        setLanguage, 
        t, 
        availableLanguages: { en: languages.en },
        isRTL,
        formatDate,
        formatNumber,
        formatCurrency
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
