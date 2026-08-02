import { defineRouting } from 'next-intl/routing'

// Values must stay identical to the previous inline config in middleware.ts.
// WHY-76 explicitly forbids a behaviour change: same locales, same default,
// same prefix strategy. The Georgian-at-root flip is WHY-62.
export const routing = defineRouting({
  locales: ['en', 'ka'],
  defaultLocale: 'en',
  localePrefix: 'always',
})
