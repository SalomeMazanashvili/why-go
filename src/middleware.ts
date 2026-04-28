import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['en', 'ka'],
  defaultLocale: 'en',
  localePrefix: 'always',
})

export const config = {
  matcher: ['/((?!_next|_vercel|api|.*\\..*).*)'],
}
