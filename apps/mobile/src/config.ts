/**
 * App Configuration
 *
 * Platform-aware configuration including:
 * - Custom language detector for i18n (AsyncStorage on React Native, localStorage fallback)
 * - Environment variables
 * - API endpoints
 */

import { LanguageDetector } from 'i18next';
import { Platform } from 'react-native';

/**
 * Custom Language Detector Module for i18next
 *
 * Platform-aware implementation:
 * 1. React Native (iOS/Android): Uses AsyncStorage for persistence
 * 2. Web fallback: Uses localStorage
 * 3. Browser detection: Falls back to browser language preference
 * 4. Default: English ('en') if all else fails
 *
 * This handles the limitation that localStorage doesn't exist in React Native
 */
export const LanguageDetectorModule: LanguageDetector = {
  type: 'backend',
  async: true,
  init: () => {
    // No initialization needed
  },
  detect: async (callback: (language: string | null) => void) => {
    try {
      // Try React Native AsyncStorage first
      if (Platform.OS !== 'web') {
        try {
          const AsyncStorage = await import('@react-native-async-storage/async-storage').then(
            (module) => module.default
          );
          const savedLanguage = await AsyncStorage.getItem('appLanguage');
          if (savedLanguage) {
            callback(savedLanguage);
            return;
          }
        } catch (error) {
          console.warn('AsyncStorage not available, falling back to browser detection', error);
        }
      }

      // Try localStorage (web or web-based React Native environments)
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const savedLanguage = localStorage.getItem('appLanguage');
        if (savedLanguage) {
          callback(savedLanguage);
          return;
        }

        // Detect browser language preference
        const browserLanguage = (
          navigator.language || (navigator as any).userLanguage
        ).substring(0, 2);

        const supportedLanguages = ['en', 'es'];
        if (supportedLanguages.includes(browserLanguage)) {
          callback(browserLanguage);
          return;
        }
      }

      // Default to English if all detection fails
      callback('en');
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('en'); // Fallback to English on error
    }
  },
  cacheUserLanguage: async (lng: string) => {
    try {
      // Save to React Native AsyncStorage
      if (Platform.OS !== 'web') {
        try {
          const AsyncStorage = await import('@react-native-async-storage/async-storage').then(
            (module) => module.default
          );
          await AsyncStorage.setItem('appLanguage', lng);
          return;
        } catch (error) {
          console.warn('AsyncStorage not available, trying localStorage', error);
        }
      }

      // Save to localStorage (web fallback)
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('appLanguage', lng);
      }
    } catch (error) {
      console.error('Error caching language preference:', error);
    }
  },
};

/**
 * API Configuration
 */
export const API_CONFIG = {
  // Backend API base URL
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',

  // Supabase configuration
  SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL || '',
  SUPABASE_PUBLIC_KEY: process.env.REACT_APP_SUPABASE_PUBLIC_KEY || '',

  // Timeouts
  REQUEST_TIMEOUT: 30000, // 30 seconds
  FILE_UPLOAD_TIMEOUT: 120000, // 2 minutes

  // Endpoints
  ENDPOINTS: {
    AUTH: {
      SIGNUP: '/auth/lawyer-signup',
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      INVITE_VALIDATE: '/auth/invite/:token',
      INVITE_ACCEPT: '/auth/invite/accept',
      REFRESH: '/auth/refresh',
      ME: '/auth/me',
    },
    CASES: {
      LIST: '/cases',
      CREATE: '/cases',
      GET: '/cases/:id',
      UPDATE: '/cases/:id',
      INVITE: '/cases/:id/invite',
      EXPORT: '/cases/:id/export',
      CHECKLIST: '/cases/:id/checklist',
    },
    EVENTS: {
      CREATE: '/events',
      LIST: '/events/:caseId',
      GET: '/events/:caseId/:eventId',
      UPDATE: '/events/:caseId/:eventId',
      DOWNLOAD: '/events/:caseId/:eventId/attachments/:attachmentId/download',
    },
    MESSAGES: {
      SEND: '/messages',
      LIST: '/messages/:caseId',
      GET: '/messages/:caseId/:messageId',
      MARK_READ: '/messages/:caseId/:messageId/read',
      DELETE: '/messages/:caseId/:messageId',
    },
  },
};

/**
 * App Constants
 */
export const APP_CONSTANTS = {
  // Media constraints
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100 MB
  MAX_IMAGE_SIZE: 50 * 1024 * 1024, // 50 MB
  MAX_VIDEO_SIZE: 500 * 1024 * 1024, // 500 MB
  SUPPORTED_IMAGES: ['image/jpeg', 'image/png', 'image/webp'],
  SUPPORTED_VIDEO: ['video/mp4', 'video/quicktime', 'video/webm'],

  // Location
  GPS_ACCURACY_THRESHOLD: 50, // meters
  LOCATION_TIMEOUT: 30000, // 30 seconds
  LOCATION_WATCH_INTERVAL: 5000, // 5 seconds

  // Message encryption
  ENCRYPTION_ALGORITHM: 'AES-256-GCM',
  SIGNED_URL_EXPIRY: 600, // 10 minutes (600 seconds)

  // Limits
  MAX_MESSAGE_LENGTH: 10000,
  MAX_EVENT_NARRATIVE: 2000,
  MAX_ATTORNEY_NOTE: 5000,

  // Timeouts and retries
  AUTH_TOKEN_REFRESH: 55 * 60 * 1000, // Refresh token 5 minutes before expiry
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second

  // Supported languages
  SUPPORTED_LANGUAGES: ['en', 'es'],
  DEFAULT_LANGUAGE: 'en',
};

/**
 * Deep Link Schemes
 */
export const DEEP_LINK_SCHEMES = {
  APP_SCHEME: 'lawyerbuddy://',
  INVITE_PATTERN: 'lawyerbuddy://invite/:token',
  WEB_SCHEME: 'https://lawyerbuddy.app/',
  WEB_INVITE_PATTERN: 'https://lawyerbuddy.app/invite/:token',
};
