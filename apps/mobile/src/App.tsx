/**
 * LawyerBuddy — Main App Component
 *
 * Entry point for the React Native application
 * Handles:
 * - i18n initialization (language detection + persistence)
 * - Navigation setup with deep link support
 * - Global error handling
 *
 * Navigation Flow:
 * 1. User opens app → RootNavigator checks auth state
 * 2. If logged out → Auth stack (WelcomeScreen, LoginScreen, InviteAcceptanceScreen)
 * 3. If logged in as client → Client portal (Dashboard, LogEvent, Messages)
 * 4. If logged in as lawyer → Lawyer portal (Dashboard, EventReview, Checklist, Export)
 * 5. If user taps invite link → InviteAcceptanceScreen (no auth required)
 */

import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Sentry from 'sentry-expo';
import { RootNavigator } from './navigation/RootNavigator';

// i18n configuration (multilingual support: English + Spanish)
import enCommon from '../../../packages/i18n/src/locales/en/common.json';
import esCommon from '../../../packages/i18n/src/locales/es/common.json';
import enLawyer from '../../../packages/i18n/src/locales/en/lawyer.json';
import esLawyer from '../../../packages/i18n/src/locales/es/lawyer.json';
import enAuth from '../../../packages/i18n/src/locales/en/auth.json';
import esAuth from '../../../packages/i18n/src/locales/es/auth.json';
import enLegal from '../../../packages/i18n/src/locales/en/legal.json';
import esLegal from '../../../packages/i18n/src/locales/es/legal.json';

// Import custom language detector (platform-aware: AsyncStorage for React Native, localStorage fallback)
import { LanguageDetectorModule } from './config';

/**
 * Initialize Sentry for error tracking
 * (Optional: Configure if Sentry project exists)
 */
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enableInExpoDevelopment: true,
    tracesSampleRate: 1.0,
  });
}

/**
 * Initialize i18n (internationalization)
 * Supports: English (en), Spanish (es)
 * Language preference stored in device storage (AsyncStorage/localStorage)
 */
i18n
  .use(LanguageDetectorModule) // Custom language detection (platform-aware)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    resources: {
      en: {
        common: enCommon,
        lawyer: enLawyer,
        auth: enAuth,
        legal: enLegal,
      },
      es: {
        common: esCommon,
        lawyer: esLawyer,
        auth: esAuth,
        legal: esLegal,
      },
    },
    ns: ['common', 'lawyer', 'auth', 'legal'],
    defaultNS: 'common',
  });

/**
 * Main App Component
 *
 * Structure:
 * SafeAreaProvider (handles notches, status bar, home indicator)
 *   └─ RootNavigator (handles auth state + role-based routing)
 */
export default function App() {
  useEffect(() => {
    // Global error handler
    const errorHandler = (error: Error) => {
      console.error('Unhandled error:', error);
      // In production, this would report to Sentry or other error tracking
    };

    // Add error listener (if using error boundaries)
    // This is a placeholder for global error handling setup

    return () => {
      // Cleanup
    };
  }, []);

  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}

/**
 * Sentry Error Boundary (optional)
 * Catches errors in component tree
 */
export const AppErrorBoundary = Sentry.withErrorBoundary(App, {
  fallback: <ErrorFallback />,
  showDialog: true,
});

function ErrorFallback() {
  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}
