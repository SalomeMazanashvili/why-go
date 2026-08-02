import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export const ADMIN_COOKIE = 'whygo_admin_session'

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login' || pathname.startsWith('/api/admin/login')) {
      return NextResponse.next()
    }
    const token = req.cookies.get(ADMIN_COOKIE)?.value
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  return intlMiddleware(req)
}

export const config = {
  matcher: ['/((?!_next|_vercel|api|whisky-tour|.*\\..*).*)'],
}
