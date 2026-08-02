import crypto from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAdminSupabase, hasAdminSupabase } from '@/lib/supabase/admin'

export const ADMIN_COOKIE = 'whygo_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const SCRYPT_KEYLEN = 64

// Sentinel admin id used when the caller authenticated with the ADMIN_PASSWORD
// env var — a bootstrap escape hatch so a fresh install with no DB admins
// (or one that lost access to every DB admin account) can still sign in.
export const ENV_ADMIN_ID = 'env:root'
export const ENV_ADMIN_EMAIL = 'root'

// ----- password hashing -----

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex')
  return `scrypt$${salt}$${hash}`
}

function verifyPasswordHash(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const [, salt, hash] = parts
  try {
    const computed = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex')
    const a = Buffer.from(computed, 'hex')
    const b = Buffer.from(hash, 'hex')
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

// ----- session cookie signing -----

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET (or ADMIN_PASSWORD) must be configured')
  }
  return secret
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('hex')
}

export function createSessionCookieValue(adminId: string): string {
  const sig = sign(adminId)
  return Buffer.from(`${adminId}:${sig}`).toString('base64url')
}

export function getSessionAdminId(value: string | undefined): string | null {
  if (!value) return null
  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8')
    const idx = decoded.lastIndexOf(':')
    if (idx <= 0) return null
    const payload = decoded.slice(0, idx)
    const sig = decoded.slice(idx + 1)
    if (!payload || !sig) return null
    const expected = sign(payload)
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length) return null
    if (!crypto.timingSafeEqual(a, b)) return null
    return payload
  } catch {
    return null
  }
}

export function verifySessionCookie(value: string | undefined): boolean {
  return getSessionAdminId(value) !== null
}

// ----- login flow -----

export interface AdminAuthResult {
  ok: boolean
  adminId?: string
  email?: string
  error?: string
}

function normEmail(v: string): string {
  return v.trim().toLowerCase()
}

export async function authenticate(emailInput: string, password: string): Promise<AdminAuthResult> {
  if (!password) return { ok: false, error: 'Password required' }
  const email = normEmail(emailInput || '')
  const envPassword = process.env.ADMIN_PASSWORD

  // Bootstrap admin: match the env password when the email field is empty or
  // uses the sentinel value. Lets a fresh deploy log in before any DB admin
  // is seeded.
  const envEmails = new Set(['', ENV_ADMIN_EMAIL, 'admin'])
  if (envPassword && envEmails.has(email)) {
    if (password === envPassword) {
      return { ok: true, adminId: ENV_ADMIN_ID, email: ENV_ADMIN_EMAIL }
    }
    if (!hasAdminSupabase()) return { ok: false, error: 'Invalid credentials' }
  }

  if (!email) return { ok: false, error: 'Email required' }
  if (!hasAdminSupabase()) return { ok: false, error: 'Invalid credentials' }

  try {
    const s = getAdminSupabase()
    const { data } = await s
      .from('admins')
      .select('id, email, password_hash, is_active')
      .eq('email', email)
      .maybeSingle()
    if (!data || !data.is_active) return { ok: false, error: 'Invalid credentials' }
    if (!verifyPasswordHash(password, data.password_hash)) {
      return { ok: false, error: 'Invalid credentials' }
    }
    // best-effort last_login stamp
    s.from('admins')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.id)
      .then(() => {})
    return { ok: true, adminId: data.id, email: data.email }
  } catch {
    return { ok: false, error: 'Server error' }
  }
}

// ----- request-time helpers -----

export async function currentAdminId(): Promise<string | null> {
  const value = (await cookies()).get(ADMIN_COOKIE)?.value
  return getSessionAdminId(value)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await currentAdminId()) !== null
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
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
