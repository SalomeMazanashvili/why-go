import { defineRouting } from 'next-intl/routing'

// WHY-62: Georgian is the default locale. Under `as-needed`, Georgian is
// served unprefixed (/, /tours, /tips) and English at /en/*. Language toggle
// preserves the current path.
export const routing = defineRouting({
  locales: ['en', 'ka'],
  defaultLocale: 'ka',
  localePrefix: 'as-needed',
})
