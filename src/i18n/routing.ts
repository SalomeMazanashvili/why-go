import { defineRouting } from 'next-intl/routing'

// WHY-62: Georgian is the default locale. Under `as-needed`, Georgian is
// served unprefixed (/, /tours, /tips) and English at /en/*. Language toggle
// preserves the current path.
//
// WHY-82: localeDetection: false. next-intl defaults it to true, which reads
// Accept-Language and redirects English-browser visitors to /en, silently
// undoing WHY-62 for the large share of Georgian users running English-
// language devices. Georgian must win unconditionally at /; English is only
// reachable by explicit /en/* URL or the toggle.
export const routing = defineRouting({
  locales: ['en', 'ka'],
  defaultLocale: 'ka',
  localePrefix: 'as-needed',
  localeDetection: false,
})
