import ka from '../../../../messages/ka.json'

// WHY-79 preview only. Headline length stand-ins, taken from founder
// Georgian already in messages/ka.json (no new Georgian is written): they
// test how each direction holds a one-line and a three-line headline. The
// real headline is still the WHY-79 placeholder (`home.hero_title`).
export const HEADLINES = {
  // Measured: one line at 380px and 1440px.
  one: ka.contact.title_3,
  // Measured: three lines at 380px and at 1440px.
  three: ka.contact.reply_note,
} as const
export type HeadlineKey = keyof typeof HEADLINES | 'placeholder'
export const HEADLINE_KEYS: HeadlineKey[] = ['placeholder', 'one', 'three']

export const VARIANTS = [
  { key: 'flight', label: 'A — Flight geometry' },
  { key: 'routes', label: 'B — Route arcs' },
  { key: 'scale', label: 'C — Scale' },
  { key: 'grid', label: 'Today — yellow grid (for comparison)' },
] as const
