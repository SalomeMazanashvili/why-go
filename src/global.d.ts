import type en from '../messages/en.json'

// WHY-98 PR A: translation gate. With Messages typed, every t('…') key and
// every useTranslations/getTranslations namespace is checked by tsc, so a
// deleted or misspelled key fails CI instead of rendering the raw key path
// (the WHY-83 incident: /transfers showed `inquiry.transactional.*` labels
// for three weeks). en.json is the type source; src/i18n/messageParity.ts
// makes tsc fail unless ka.json has exactly the same keys.
declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof en
  }
}
