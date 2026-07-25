import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const ADMIN_COOKIE = 'whygo_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret) {
    throw new Error('ADMIN_PASSWORD is not configured')
  }
  return secret
}

function sessionToken(secret: string): string {
  return Buffer.from(`whygo-admin::${secret}`).toString('base64')
}

export function verifyPassword(password: string): boolean {
  const secret = getSecret()
  return password === secret
}

export function createSessionCookieValue(): string {
  return sessionToken(getSecret())
}

export function verifySessionCookie(value: string | undefined): boolean {
  if (!value) return false
  try {
    return value === sessionToken(getSecret())
  } catch {
    return false
  }
}

export function isAdminAuthenticated(): boolean {
  const value = cookies().get(ADMIN_COOKIE)?.value
  return verifySessionCookie(value)
}

export function requireAdmin() {
  if (!isAdminAuthenticated()) {
    redirect('/admin/login')
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_MAX_AGE,
}
