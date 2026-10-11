import { hasAdminSupabase, getAdminSupabase, getContentSupabase } from '@/lib/supabase/admin'
import { countWords, MIN_INDEXABLE_WORDS } from '@/lib/seo'
import type { News } from '@/types'

export type AdminNews = News & {
  content_en?: string
  content_ka?: string
  is_published?: boolean
}

const COLUMNS =
  'id, slug, title_en, excerpt_en, content_en, tag_en, title_ka, excerpt_ka, content_ka, tag_ka, cover_image, author, reading_time_min, is_featured, is_published, published_at, destination_id, updated_at'

function normalize(row: any): AdminNews {
  return {
    id: String(row.id),
    slug: row.slug ?? '',
    title_en: row.title_en ?? '',
    excerpt_en: row.excerpt_en ?? '',
    content_en: row.content_en ?? '',
    tag_en: row.tag_en ?? '',
    title_ka: row.title_ka ?? '',
    excerpt_ka: row.excerpt_ka ?? '',
    content_ka: row.content_ka ?? '',
    tag_ka: row.tag_ka ?? '',
    cover_image: row.cover_image ?? null,
    author: row.author ?? 'WHYGO Team',
    reading_time_min: row.reading_time_min ?? 5,
    is_featured: Boolean(row.is_featured),
    // Safer default: an article missing an explicit is_published value is
    // treated as a draft, so it never accidentally leaks to the public site.
    is_published: row.is_published ?? false,
    published_at: row.published_at ?? new Date().toISOString(),
    destination_id: row.destination_id ?? null,
    updated_at: row.updated_at ?? null,
  }
}

// Public-facing list. Only ever returns published articles.
export async function listNews(): Promise<AdminNews[]> {
  if (!hasAdminSupabase()) {
    console.warn('[news] Supabase not configured — returning empty list')
    return []
  }
  try {
    const s = getContentSupabase()
    const { data, error } = await s
      .from('news')
      .select(COLUMNS)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
    if (error) {
      console.error('[news] listNews query failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[news] listNews threw', err)
    return []
  }
}

// Admin-only list. Returns every article — drafts included — so the admin
// panel can manage unpublished work. Never call this from public pages.
export async function listNewsForAdmin(): Promise<AdminNews[]> {
  if (!hasAdminSupabase()) {
    console.warn('[news] Supabase not configured — returning empty list')
    return []
  }
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('news')
      .select(COLUMNS)
      .order('published_at', { ascending: false })
    if (error) {
      console.error('[news] listNewsForAdmin query failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[news] listNewsForAdmin threw', err)
    return []
  }
}

// Admin-only lookup by id. Loads drafts so the admin can open them for
// editing. Public routes should not call this.
export async function getNewsById(id: string): Promise<AdminNews | null> {
  if (!hasAdminSupabase()) {
    console.warn('[news] Supabase not configured — cannot fetch article', id)
    return null
  }
  try {
    const s = getAdminSupabase()
    const { data, error } = await s.from('news').select(COLUMNS).eq('id', id).maybeSingle()
    if (error) {
      console.error('[news] getNewsById query failed', id, error)
      return null
    }
    return data ? normalize(data) : null
  } catch (err) {
    console.error('[news] getNewsById threw', id, err)
    return null
  }
}

// WHY-118: public lookup for /tips/[slug]. Published only; a draft 404s.
export async function getNewsBySlug(slug: string): Promise<AdminNews | null> {
  if (!hasAdminSupabase()) return null
  try {
    const s = getContentSupabase()
    const { data, error } = await s
      .from('news')
      .select(COLUMNS)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()
    if (error) {
      console.error('[news] getNewsBySlug query failed', slug, error)
      return null
    }
    return data ? normalize(data) : null
  } catch (err) {
    console.error('[news] getNewsBySlug threw', slug, err)
    return null
  }
}

// Rule 5 for articles: indexed only with a Georgian title, a Georgian
// excerpt (the meta description) and 300+ words of Georgian body. Below
// that the page is served noindex and kept out of the sitemap. Shared by
// the page and the sitemap so they can't disagree.
export function isNewsIndexable(n: AdminNews): boolean {
  return (
    Boolean(n.title_ka?.trim()) &&
    Boolean(n.excerpt_ka?.trim()) &&
    countWords(n.content_ka) >= MIN_INDEXABLE_WORDS
  )
}
