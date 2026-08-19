// Server-side Cloudflare Turnstile verification. When TURNSTILE_SECRET_KEY
// is not set (dev / preview without keys), verification is skipped and any
// token — or no token — is accepted. In production both env vars should be
// set so the widget renders on the client and the server enforces it.
export async function verifyTurnstile(token: string | null, remoteIp?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false

  try {
    const body = new URLSearchParams()
    body.set('secret', secret)
    body.set('response', token)
    if (remoteIp) body.set('remoteip', remoteIp)

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    })
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }
    if (!data.success) {
      console.warn('[turnstile] verification failed', data['error-codes'])
    }
    return Boolean(data.success)
  } catch (err) {
    console.error('[turnstile] siteverify threw', err)
    return false
  }
}
