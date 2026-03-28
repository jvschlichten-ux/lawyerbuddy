/**
 * i18next Configuration
 *
 * Sets up internationalization for LawyerBuddy with English and Spanish support
 * Supports both React Native (AsyncStorage) and web (localStorage) platforms
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { LanguageDetectorModule } from 'i18next';

// Import translation files
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enClient from './locales/en/client.json';
import enLawyer from './locales/en/lawyer.json';
import enLegal from './locales/en/legal.json';

import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esClient from './locales/es/client.json';
import esLawyer from './locales/es/lawyer.json';
import esLegal from './locales/es/legal.json';

/**
 * Define all supported languages
 */
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English' },
  es: { name: 'Spanish', nativeName: 'Español' },
} as const;

export const DEFAULT_LANGUAGE = 'en';

/**
 * Translation resources
 */
const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    client: enClient,
    lawyer: enLawyer,
    legal: enLegal,
  },
  es: {
    common: esCommon,
    auth: esAuth,
    client: esClient,
    lawyer: esLawyer,
    legal: esLegal,
  },
};

/**
 * Custom Language Detector that supports both React Native and web
 * Uses AsyncStorage on React Native, localStorage on web
 */
const languageDetector: LanguageDetectorModule = {
  type: 'languageDetector',
  async: true,
  init: () => {},
  detect: async (callback) => {
    try {
      // Try AsyncStorage first (React Native)
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const savedLanguage = await AsyncStorage.getItem('i18nextLng');
        if (savedLanguage) {
          callback(savedLanguage);
          return;
        }
      } catch (e) {
        // AsyncStorage not available, fall back to localStorage (web)
      }

      // Fall back to localStorage (web)
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedLanguage = window.localStorage.getItem('i18nextLng');
        if (savedLanguage) {
          callback(savedLanguage);
          return;
        }
      }

      // If no saved preference, detect from navigator
      const browserLanguage = navigator.language || (navigator as any).userLanguage;
      const detectedLanguage = browserLanguage.startsWith('es') ? 'es' : 'en';
      callback(detectedLanguage);
    } catch (e) {
      // Fallback to default language
      callback(DEFAULT_LANGUAGE);
    }
  },
  cacheUserLanguage: async (lng: string) => {
    try {
      // Try AsyncStorage first (React Native)
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('i18nextLng', lng);
        return;
      } catch (e) {
        // AsyncStorage not available, fall back to localStorage
      }

      // Fall back to localStorage (web)
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('i18nextLng', lng);
      }
    } catch (e) {
      // Silently fail if storage is not available
      console.warn('Failed to save language preference:', e);
    }
  },
};

/**
 * Initialize i18next with custom language detector
 */
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      // Use custom detector that handles both React Native and web
      order: ['custom'],
      caches: false, // Caching handled by custom detector
    },
  });

export default i18n;
