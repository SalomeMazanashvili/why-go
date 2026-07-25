import { requireAdmin } from '@/lib/adminAuth'
import { loadSiteSettings } from '@/lib/siteData'
import { hasAdminSupabase } from '@/lib/supabase/admin'
import BrandingEditor from './BrandingEditor'

export const dynamic = 'force-dynamic'

export default async function BrandingAdminPage() {
  requireAdmin()
  const settings = await loadSiteSettings()
  const connected = hasAdminSupabase()

  return (
    <div className="p-8 lg:p-12">
      <header className="mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">Branding</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Colors & typography</h1>
        <p className="text-white/40 text-sm mt-2">
          {connected ? 'Changes apply to the whole public site.' : 'Supabase not configured — changes will not persist.'}
        </p>
      </header>
      <BrandingEditor initial={settings} />
    </div>
  )
}
