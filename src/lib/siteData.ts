import { hasAdminSupabase, getAdminSupabase } from '@/lib/supabase/admin'

export type SiteContentRow = { key: string; value_en: string | null; value_ka: string | null }
export type SiteSettingRow = { key: string; value: string | null }

export type ContentMap = Record<string, { en: string | null; ka: string | null }>
export type SettingsMap = Record<string, string>

export const DEFAULT_SETTINGS: SettingsMap = {
  color_primary: '#FFCC00',
  color_background: '#000000',
  color_surface: '#111111',
  color_accent: '#FFCC00',
  color_text: '#FFFFFF',
  font_hero_size: '112px',
  font_section_size: '52px',
}

export const CONTENT_DEFAULTS: Record<string, { en: string; ka: string }> = {
  'hero.eyebrow': {
    en: 'Experience · Develop · Explore',
    ka: 'გამოცდილება · განვითარება · კვლევა',
  },
  'hero.line1': { en: 'GO', ka: 'WAY' },
  'hero.line2': { en: 'BEYOND', ka: 'BEYOND' },
  'hero.line3': { en: 'TRAVEL', ka: 'მოგზაურობა' },
  'hero.sub': {
    en: 'Boutique tours built around language, sport, and culinary skills. Explore the world while mastering something new.',
    ka: 'ბუტიკური ტურები ენის, სპორტისა და კულინარიის ირგვლივ. შეისწავლე სამყარო ახალი უნარების დაუფლებისას.',
  },
  'hero.cta_primary': { en: 'Explore Tours', ka: 'ტურები' },
  'hero.cta_secondary': { en: 'Our Story', ka: 'ჩვენი ისტორია' },
  'about.label': { en: 'Our Philosophy', ka: 'ჩვენი ფილოსოფია' },
  'about.title_1': { en: 'WE BUILD', ka: 'ჩვენ ვქმნით' },
  'about.title_2': { en: 'TRIPS THAT', ka: 'ტურებს,' },
  'about.title_3': { en: 'TEACH', ka: 'რომლებიც ასწავლის' },
  'about.body': {
    en: 'Whygo was born in Tbilisi with a simple belief: travel should change you. Every tour we design pairs an unforgettable destination with a real skill — a language to learn, a dish to master, a sport to play. We call it Experience + Development.',
    ka: 'Whygo დაიბადა თბილისში მარტივი რწმენით: მოგზაურობამ უნდა შეგცვალოს. ყველა ტური, რომელსაც ვქმნით, შეუხამებს დაუვიწყარ დანიშნულებას რეალური უნარ-ჩვევებს — ენა, სამზარეულო, სპორტი.',
  },
  'footer.tagline': { en: 'Experience + Development', ka: 'გამოცდილება + განვითარება' },
}

export const CONTENT_KEYS = Object.keys(CONTENT_DEFAULTS)

export async function loadSiteContent(): Promise<ContentMap> {
  const map: ContentMap = {}
  for (const key of CONTENT_KEYS) {
    map[key] = { en: CONTENT_DEFAULTS[key].en, ka: CONTENT_DEFAULTS[key].ka }
  }
  if (!hasAdminSupabase()) return map
  try {
    const supabase = getAdminSupabase()
    const { data } = await supabase.from('site_content').select('key, value_en, value_ka')
    for (const row of (data ?? []) as SiteContentRow[]) {
      map[row.key] = {
        en: row.value_en ?? map[row.key]?.en ?? null,
        ka: row.value_ka ?? map[row.key]?.ka ?? null,
      }
    }
  } catch {
    // fall back to defaults
  }
  return map
}

export async function loadSiteSettings(): Promise<SettingsMap> {
  const map: SettingsMap = { ...DEFAULT_SETTINGS }
  if (!hasAdminSupabase()) return map
  try {
    const supabase = getAdminSupabase()
    const { data } = await supabase.from('site_settings').select('key, value')
    for (const row of (data ?? []) as SiteSettingRow[]) {
      if (row.value) map[row.key] = row.value
    }
  } catch {
    // fall back to defaults
  }
  return map
}

export function pickContent(
  content: ContentMap,
  key: string,
  locale: 'en' | 'ka',
): string {
  const entry = content[key]
  if (!entry) return CONTENT_DEFAULTS[key]?.[locale] ?? ''
  if (locale === 'ka') return entry.ka || entry.en || ''
  return entry.en || entry.ka || ''
}

export function settingsToCssVars(settings: SettingsMap): Record<string, string> {
  return {
    '--brand-yellow': settings.color_primary,
    '--brand-black': settings.color_background,
    '--brand-surface': settings.color_surface,
    '--brand-accent': settings.color_accent,
    '--brand-white': settings.color_text,
    '--font-hero-size': settings.font_hero_size,
    '--font-section-size': settings.font_section_size,
  }
}
