'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'

// Cloudflare Turnstile widget. When NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset
// (dev), the component renders nothing and the parent form submits without
// a token — the server verifier also short-circuits when TURNSTILE_SECRET_KEY
// is missing, so both sides degrade to no-op consistently.

interface Props {
  onToken: (token: string | null) => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string
          callback: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
        },
      ) => string
      remove: (widgetId: string) => void
    }
  }
}

export function TurnstileWidget({ onToken }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey) return
    let cancelled = false
    const tryRender = () => {
      if (cancelled) return
      if (!window.turnstile || !containerRef.current) {
        setTimeout(tryRender, 200)
        return
      }
      if (widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onToken(token),
        'error-callback': () => onToken(null),
        'expired-callback': () => onToken(null),
      })
    }
    tryRender()
    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // widget may already be gone
        }
        widgetIdRef.current = null
      }
    }
  }, [siteKey, onToken])

  if (!siteKey) return null

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        async
        defer
      />
      <div ref={containerRef} />
    </>
  )
}
