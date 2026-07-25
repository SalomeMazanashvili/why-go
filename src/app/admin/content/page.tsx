import { requireAdmin } from '@/lib/adminAuth'
import { loadSiteContent, CONTENT_DEFAULTS } from '@/lib/siteData'
import { hasAdminSupabase } from '@/lib/supabase/admin'
import ContentEditor from './ContentEditor'

export const dynamic = 'force-dynamic'

const GROUPS: { label: string; keys: string[] }[] = [
  { label: 'Hero section', keys: ['hero.eyebrow', 'hero.line1', 'hero.line2', 'hero.line3', 'hero.sub', 'hero.cta_primary', 'hero.cta_secondary'] },
  { label: 'About section', keys: ['about.label', 'about.title_1', 'about.title_2', 'about.title_3', 'about.body'] },
  { label: 'Footer', keys: ['footer.tagline'] },
]

export default async function ContentAdminPage() {
  requireAdmin()
  const content = await loadSiteContent()
  const connected = hasAdminSupabase()

  const initial: Record<string, { en: string; ka: string }> = {}
  for (const g of GROUPS) {
    for (const key of g.keys) {
      initial[key] = {
        en: content[key]?.en ?? CONTENT_DEFAULTS[key]?.en ?? '',
        ka: content[key]?.ka ?? CONTENT_DEFAULTS[key]?.ka ?? '',
      }
    }
  }

  return (
    <div className="p-8 lg:p-12 max-w-4xl">
      <header className="mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">Content</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Site copy</h1>
        <p className="text-white/40 text-sm mt-2">
          {connected
            ? 'Edits publish to Supabase and the public site immediately.'
            : 'Supabase not configured — edits will fail until service key is set.'}
        </p>
      </header>
      <ContentEditor groups={GROUPS} initial={initial} />
    </div>
  )
}
