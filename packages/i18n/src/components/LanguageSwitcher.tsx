/**
 * LanguageSwitcher Component
 *
 * Allows users to switch between English and Spanish
 * Saves language preference to AsyncStorage (mobile) or localStorage (web)
 */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../config';

interface LanguageSwitcherProps {
  /**
   * Style variant for the switcher
   * @default 'compact'
   */
  variant?: 'compact' | 'full';

  /**
   * Callback fired when language changes
   */
  onChange?: (languageCode: string) => void;
}

/**
 * LanguageSwitcher Component
 *
 * Renders a language switcher that allows users to toggle between English and Spanish.
 * The selected language is persisted to local storage.
 *
 * @example
 * // Compact version (suitable for headers)
 * <LanguageSwitcher variant="compact" />
 *
 * @example
 * // Full version with labels (suitable for settings)
 * <LanguageSwitcher variant="full" onChange={(lang) => console.log(lang)} />
 */
export function LanguageSwitcher({
  variant = 'compact',
  onChange,
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation('common');

  const handleLanguageChange = useCallback(
    (languageCode: string) => {
      i18n.changeLanguage(languageCode);
      if (onChange) {
        onChange(languageCode);
      }
    },
    [i18n, onChange]
  );

  if (variant === 'compact') {
    return (
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
          <button
            key={code}
            onClick={() => handleLanguageChange(code)}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: i18n.language === code ? '2px solid #007AFF' : '1px solid #ccc',
              backgroundColor: i18n.language === code ? '#007AFF' : '#f5f5f5',
              color: i18n.language === code ? '#fff' : '#333',
              fontSize: '14px',
              fontWeight: i18n.language === code ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  // Full variant with language names
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
        <button
          key={code}
          onClick={() => handleLanguageChange(code)}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            border: i18n.language === code ? '2px solid #007AFF' : '1px solid #ddd',
            backgroundColor: i18n.language === code ? '#E8F4FF' : '#f9f9f9',
            color: '#333',
            fontSize: '16px',
            fontWeight: i18n.language === code ? '600' : '400',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s ease',
          }}
        >
          {i18n.language === code && '✓ '}
          {lang.nativeName} ({lang.name})
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
