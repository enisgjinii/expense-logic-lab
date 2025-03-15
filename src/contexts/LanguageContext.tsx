
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

// Helper to detect browser language
const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language.split('-')[0];
  return (browserLang as Language) in translations ? (browserLang as Language) : defaultLanguage;
};

const RTL_LANGUAGES: Language[] = []; // No RTL languages in current setup, but added for future expansion

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useLocalStorage<Language>('app-language', detectBrowserLanguage());
  const [isRTL, setIsRTL] = useState<boolean>(RTL_LANGUAGES.includes(language));

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    
    // Set class for RTL styling if needed
    if (isRTL) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [language, isRTL]);

  useEffect(() => {
    setIsRTL(RTL_LANGUAGES.includes(language));
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  // Advanced translation function with variable substitution and nested key support
  const t = (key: string, variables?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    // Navigate through nested objects
    for (const k of keys) {
      if (value && Object.prototype.hasOwnProperty.call(value, k)) {
        value = value[k];
      } else {
        // If key not found in current language, try English as fallback
        if (language !== 'en') {
          console.warn(`Translation key not found in ${language}: ${key}, trying English fallback`);
          let fallbackValue = translations.en;
          let found = true;
          
          for (const fallbackKey of keys) {
            if (fallbackValue && Object.prototype.hasOwnProperty.call(fallbackValue, fallbackKey)) {
              fallbackValue = fallbackValue[fallbackKey];
            } else {
              found = false;
              break;
            }
          }
          
          if (found) {
            value = fallbackValue;
          } else {
            console.warn(`Translation key not found in fallback language: ${key}`);
            return key; // Return the key as last resort
          }
        } else {
          console.warn(`Translation key not found: ${key}`);
          return key;
        }
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
        availableLanguages: languages,
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

