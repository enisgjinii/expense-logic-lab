
import enTranslations from './en';
import sqTranslations from './sq';
import deTranslations from './de';

export type Language = 'en' | 'sq' | 'de';

export const languages = {
  en: {
    name: 'English',
    nativeName: 'English',
    code: 'en'
  },
  sq: {
    name: 'Albanian',
    nativeName: 'Shqip',
    code: 'sq'
  },
  de: {
    name: 'German',
    nativeName: 'Deutsch',
    code: 'de'
  }
};

export const translations = {
  en: enTranslations,
  sq: sqTranslations,
  de: deTranslations
};

export type TranslationsType = typeof enTranslations;
