// WHY-120: article URLs are Latin, decided 2026-10-11. Links are shared in
// WhatsApp and Instagram DMs, where a Georgian URL turns into an unreadable
// percent-encoded string (/tips/%E1%83%91%E1%83%90…). Lowercase a–z, 0–9 and
// single hyphens, 3–60 characters, no leading or trailing hyphen.
export const SLUG_PATTERN = '[a-z0-9]+(?:-[a-z0-9]+)*'
const SLUG_RE = new RegExp(`^${SLUG_PATTERN}$`)
export const SLUG_MIN = 3
export const SLUG_MAX = 60

export function slugError(slug: unknown): string | null {
  if (typeof slug !== 'string' || slug.length === 0) return 'Slug is required'
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX) {
    return `Slug must be ${SLUG_MIN}–${SLUG_MAX} characters`
  }
  if (!SLUG_RE.test(slug)) {
    return 'Slug: Latin lowercase letters, digits and single hyphens only (e.g. barcelona-airport-transfer). No Georgian letters, spaces or a hyphen at either end.'
  }
  return null
}

// Georgian → Latin, the national romanisation system (2002), so a slug can
// be suggested from the Georgian title. Ejectives and aspirates fold
// together (თ/ტ → t, ფ/პ → p, ქ/კ → k, ც/წ → ts, ჩ/ჭ → ch), as on road signs.
const KA_TO_LATIN: Record<string, string> = {
  ა: 'a', ბ: 'b', გ: 'g', დ: 'd', ე: 'e', ვ: 'v', ზ: 'z', თ: 't', ი: 'i', კ: 'k',
  ლ: 'l', მ: 'm', ნ: 'n', ო: 'o', პ: 'p', ჟ: 'zh', რ: 'r', ს: 's', ტ: 't', უ: 'u',
  ფ: 'p', ქ: 'k', ღ: 'gh', ყ: 'q', შ: 'sh', ჩ: 'ch', ც: 'ts', ძ: 'dz', წ: 'ts', ჭ: 'ch',
  ხ: 'kh', ჯ: 'j', ჰ: 'h',
}

// A suggestion, not a rule: the editor shortens it to the 3–6 words that matter.
export function suggestSlug(title: string): string {
  return [...title.toLowerCase()]
    .map((c) => KA_TO_LATIN[c] ?? c)
    .join('')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX)
    .replace(/-+$/, '')
}
