import { hasAdminSupabase, getAdminSupabase } from '@/lib/supabase/admin'
import { STATIC_NEWS, type News } from '@/types'

export type AdminNews = News & {
  content_en?: string
  content_ka?: string
  is_published?: boolean
}

const COLUMNS =
  'id, slug, title_en, excerpt_en, content_en, tag_en, title_ka, excerpt_ka, content_ka, tag_ka, cover_image, author, reading_time_min, is_featured, is_published, published_at'

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
    author: row.author ?? 'Whygo Team',
    reading_time_min: row.reading_time_min ?? 5,
    is_featured: Boolean(row.is_featured),
    is_published: row.is_published ?? true,
    published_at: row.published_at ?? new Date().toISOString(),
  }
}

function fromStatic(): AdminNews[] {
  return STATIC_NEWS.map((n) => ({ ...n, content_en: '', content_ka: '', is_published: true }))
}

export async function listNews(): Promise<AdminNews[]> {
  if (!hasAdminSupabase()) return fromStatic()
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('news')
      .select(COLUMNS)
      .order('published_at', { ascending: false })
    if (error || !data || data.length === 0) return fromStatic()
    return data.map(normalize)
  } catch {
    return fromStatic()
  }
}

export async function getNewsById(id: string): Promise<AdminNews | null> {
  if (!hasAdminSupabase()) {
    const s = STATIC_NEWS.find((n) => n.id === id)
    return s ? { ...s, content_en: '', content_ka: '', is_published: true } : null
  }
  try {
    const s = getAdminSupabase()
    const { data } = await s.from('news').select(COLUMNS).eq('id', id).maybeSingle()
    if (data) return normalize(data)
  } catch {
    // fall through
  }
  const s = STATIC_NEWS.find((n) => n.id === id)
  return s ? { ...s, content_en: '', content_ka: '', is_published: true } : null
}
