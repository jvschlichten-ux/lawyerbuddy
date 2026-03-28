/**
 * LawyerBuddy — Mobile App (React Native + Expo)
 *
 * iOS and Android application
 * Built with React Native, Expo SDK 51, and React Navigation
 *
 * PHASE 9 — Navigation & Deep Linking:
 * ✅ app.json: Configured with deep link schemes, permissions, and intent filters
 * ✅ RootNavigator.tsx: Role-based routing (client portal vs lawyer portal)
 * ✅ linking.ts: Deep link handling for invite tokens (lawyerbuddy://invite/:token)
 * ✅ App.tsx: Main app entry point with i18n and navigation setup
 * ✅ config.ts: Platform-aware configuration and language detection
 *
 * Navigation Flow:
 * 1. App loads → RootNavigator checks auth state (JWT in SecureStore)
 * 2. Not authenticated → Auth stack (WelcomeScreen, LoginScreen, InviteAcceptanceScreen)
 * 3. Authenticated as client → Client portal (Dashboard, LogEvent, Messages)
 * 4. Authenticated as lawyer → Lawyer portal (Dashboard, EventReview, Checklist, Export)
 * 5. Deep link invite (lawyerbuddy://invite/ABC123) → InviteAcceptanceScreen (no auth required)
 *
 * Deep Link Patterns:
 * - Invite acceptance: lawyerbuddy://invite/ABC123DEF456
 * - Client dashboard: lawyerbuddy://client/dashboard
 * - Case details: lawyerbuddy://client/case/UUID
 * - Lawyer dashboard: lawyerbuddy://lawyer/dashboard
 */

export const APP_VERSION = '1.0.0';
export const APP_NAME = 'LawyerBuddy';
export const APP_NAME_ES = 'Tu Abogado';

// Export navigation components for testing/development
export { RootNavigator } from './navigation/RootNavigator';
export { linking, parseInviteToken, generateInviteDeepLink, generateInviteWebLink } from './navigation/linking';

// Export app config
export { API_CONFIG, APP_CONSTANTS, DEEP_LINK_SCHEMES, LanguageDetectorModule } from './config';
