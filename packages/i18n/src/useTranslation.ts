/**
 * useTranslation Hook Wrapper
 *
 * Custom hook that wraps react-i18next's useTranslation
 * Provides a consistent interface for using translations throughout the app
 */

import { useTranslation as useI18nTranslation, UseTranslationOptions } from 'react-i18next';

/**
 * useTranslation Hook
 *
 * Usage:
 * const { t } = useTranslation('client');
 * const label = t('event_title_label');
 *
 * @param namespace - Translation namespace (common, auth, client, lawyer, legal)
 * @param options - Optional i18next configuration
 * @returns Object with t function and other i18n utilities
 */
export function useTranslation(
  namespace?: string,
  options?: UseTranslationOptions
) {
  return useI18nTranslation(namespace, options);
}

export default useTranslation;
