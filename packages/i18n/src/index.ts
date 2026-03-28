/**
 * @lawyerbuddy/i18n
 *
 * Internationalization setup for LawyerBuddy
 * Supports English (en) and Spanish (es - Latin American)
 */

// Export i18n configuration
export { default as i18n } from './config';
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './config';

// Export hook
export { useTranslation } from './useTranslation';

// Export components
export { LanguageSwitcher } from './components/LanguageSwitcher';
