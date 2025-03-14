
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import translationEN from './translations/en.json';
import translationSQ from './translations/sq.json';
import translationTR from './translations/tr.json';
import translationDE from './translations/de.json';
import translationFR from './translations/fr.json';
import translationAR from './translations/ar.json';

// Resources object containing all translations
const resources = {
  en: {
    translation: translationEN
  },
  sq: {
    translation: translationSQ
  },
  tr: {
    translation: translationTR
  },
  de: {
    translation: translationDE
  },
  fr: {
    translation: translationFR
  },
  ar: {
    translation: translationAR
  }
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('appLanguage') || 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
