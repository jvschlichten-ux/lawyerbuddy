# @lawyerbuddy/i18n

Internationalization (i18n) setup for LawyerBuddy with English and Spanish support.

## Features

- ✅ Dual language support: English (en) and Spanish (es - Latin American)
- ✅ Auto-detection of device/browser language
- ✅ Manual language switching with persistence
- ✅ 5 translation namespaces covering all app features
- ✅ React hooks and components for easy integration

## Installation

```bash
pnpm install @lawyerbuddy/i18n
```

## Usage

### 1. Initialize i18n in your app

```typescript
import i18n from '@lawyerbuddy/i18n';

// i18n is automatically initialized and ready to use
```

### 2. Use translations with the hook

```typescript
import { useTranslation } from '@lawyerbuddy/i18n';

function MyComponent() {
  const { t } = useTranslation('client');

  return <h1>{t('home_title')}</h1>;
}
```

### 3. Add the language switcher

```typescript
import { LanguageSwitcher } from '@lawyerbuddy/i18n';

function Header() {
  return (
    <div>
      <h1>My App</h1>
      <LanguageSwitcher variant="compact" />
    </div>
  );
}
```

## Translation Namespaces

### common
- Global buttons, labels, errors, navigation
- Used by all screens

### auth
- Authentication screens (login, signup, password reset, invite acceptance)
- WelcomeScreen, LoginScreen, SignupScreen, ForgotPasswordScreen, InviteAcceptScreen

### client
- Client portal screens
- Event logging, case progress, documents, messaging

### lawyer
- Lawyer portal screens
- Dashboard, case management, checklist builder, event review, messaging

### legal
- Legal terminology and categories
- Event categories, severity levels, legal factors, case types, privacy levels

## File Structure

```
packages/i18n/
├── src/
│   ├── config.ts                    # i18next configuration
│   ├── useTranslation.ts            # Hook wrapper
│   ├── index.ts                     # Package exports
│   ├── components/
│   │   └── LanguageSwitcher.tsx     # Language switcher component
│   └── locales/
│       ├── en/                      # English translations
│       │   ├── common.json
│       │   ├── auth.json
│       │   ├── client.json
│       │   ├── lawyer.json
│       │   └── legal.json
│       └── es/                      # Spanish translations
│           ├── common.json
│           ├── auth.json
│           ├── client.json
│           ├── lawyer.json
│           └── legal.json
├── package.json
├── tsconfig.json
└── README.md
```

## Language Persistence

The selected language is automatically saved to:
- **Web**: `localStorage` (key: `i18nextLng`)
- **Mobile**: `AsyncStorage` (via react-i18next's localStorage adapter)

Language preference persists across app sessions.

## Adding New Translations

1. Add the key to both English and Spanish files:
   ```json
   {
     "new_key": "English text",
     "another_key": "More English text"
   }
   ```

2. Use in your component:
   ```typescript
   const { t } = useTranslation('namespace');
   t('new_key');
   ```

## Translation Guidelines

- **Plain language**: Avoid legal jargon. Use "What happened?" not "Narrative Description"
- **Consistency**: Use the same terms across translations
- **Context**: Consider the user's perspective (client vs. lawyer)
- **Accessibility**: Clear, simple language suitable for all reading levels
- **Latin American Spanish**: Use Mexico/Colombia/Argentina Spanish, not Spain Spanish

## Supported Languages

| Code | Language | Native Name |
|------|----------|------------|
| en   | English  | English    |
| es   | Spanish  | Español    |

## API Reference

### `useTranslation(namespace)`

Custom hook for accessing translations.

```typescript
const { t, i18n } = useTranslation('client');

// Translate a key
t('home_title')

// Get current language
i18n.language // 'en' or 'es'

// Change language
i18n.changeLanguage('es')

// Get all languages
i18n.languages // ['en', 'es']
```

### `<LanguageSwitcher />`

Component for switching languages.

```typescript
// Compact version (2 buttons)
<LanguageSwitcher variant="compact" />

// Full version (full labels)
<LanguageSwitcher
  variant="full"
  onChange={(lang) => console.log(`Language changed to: ${lang}`)}
/>
```

## License

Proprietary — GreyNoise Intelligence
