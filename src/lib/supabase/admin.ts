import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function hasAdminSupabase(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}

let cached: SupabaseClient | null = null

export function getAdminSupabase(): SupabaseClient {
  if (!hasAdminSupabase()) {
    throw new Error(
      'Supabase admin client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    )
  }
  if (!cached) {
    cached = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )
  }
  return cached
}

// WHY-103: public content reads go through this client so every Supabase GET
// lands in the Data Cache under one tag. Admin writes call revalidateContent()
// (src/lib/revalidate.ts), which expires the tag, so a publish shows up on
// the page, its index and /sitemap.xml without a deploy. The 1h cap matches
// the pages' ISR window.
//
// Only public read functions use this. Admin auth, rate limiting, inquiries
// and the *ForAdmin lists stay on getAdminSupabase(), which is uncached.
export const CONTENT_TAG = 'content'

let cachedContent: SupabaseClient | null = null

export function getContentSupabase(): SupabaseClient {
  if (!hasAdminSupabase()) {
    throw new Error(
      'Supabase admin client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    )
  }
  if (!cachedContent) {
    cachedContent = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false },
        global: {
          fetch: (input, init) =>
            fetch(input, { ...init, next: { revalidate: 3600, tags: [CONTENT_TAG] } }),
        },
      },
    )
  }
  return cachedContent
}
