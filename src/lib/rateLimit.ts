import { getAdminSupabase, hasAdminSupabase } from '@/lib/supabase/admin'

// Supabase-backed per-key rate limiter. Two roundtrips per hit (read + write);
// small race window is acceptable for spam-limiting a public form. When
// Supabase is not configured, requests are allowed through — the caller is
// responsible for other spam controls in that environment.
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  if (!hasAdminSupabase()) return { allowed: true, remaining: max }
  const s = getAdminSupabase()
  const now = new Date()
  const nowIso = now.toISOString()

  const { data, error } = await s
    .from('rate_limits')
    .select('count, window_start')
    .eq('key', key)
    .maybeSingle()

  if (error) {
    console.error('[rateLimit] read failed', key, error)
    return { allowed: true, remaining: max }
  }

  if (!data) {
    const { error: insertError } = await s
      .from('rate_limits')
      .insert({ key, count: 1, window_start: nowIso })
    if (insertError) console.error('[rateLimit] insert failed', key, insertError)
    return { allowed: true, remaining: max - 1 }
  }

  const windowStart = new Date(data.window_start).getTime()
  const windowExpired = now.getTime() - windowStart > windowMs

  if (windowExpired) {
    const { error: resetError } = await s
      .from('rate_limits')
      .update({ count: 1, window_start: nowIso })
      .eq('key', key)
    if (resetError) console.error('[rateLimit] reset failed', key, resetError)
    return { allowed: true, remaining: max - 1 }
  }

  if (data.count >= max) return { allowed: false, remaining: 0 }

  const { error: incError } = await s
    .from('rate_limits')
    .update({ count: data.count + 1 })
    .eq('key', key)
  if (incError) console.error('[rateLimit] increment failed', key, incError)
  return { allowed: true, remaining: max - (data.count + 1) }
}

// Extracts the caller IP from Vercel / proxy headers, falling back to a
// stable-but-non-identifying bucket so a missing header doesn't collapse
// every visitor into the same rate-limit key.
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const real = headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}
