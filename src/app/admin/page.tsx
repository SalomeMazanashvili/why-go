import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { hasAdminSupabase, getAdminSupabase } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function getCounts() {
  const empty = { tours: 0, news: 0, contacts: 0, unread: 0, supabase: false }
  if (!hasAdminSupabase()) return empty
  try {
    const s = getAdminSupabase()
    const [tours, news, contacts, unread] = await Promise.all([
      s.from('tours').select('id', { count: 'exact', head: true }),
      s.from('news').select('id', { count: 'exact', head: true }),
      s.from('contact_submissions').select('id', { count: 'exact', head: true }),
      s
        .from('contact_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new'),
    ])
    return {
      tours: tours.count ?? 0,
      news: news.count ?? 0,
      contacts: contacts.count ?? 0,
      unread: unread.count ?? 0,
      supabase: true,
    }
  } catch (err) {
    console.error('[admin/dashboard] getCounts failed', err)
    return empty
  }
}

const CARDS = [
  { href: '/admin/tours', label: 'Tours', key: 'tours' as const, desc: 'Manage tour packages' },
  { href: '/admin/destinations', label: 'Destinations', key: null, desc: 'Manage destination hubs' },
  { href: '/admin/service-categories', label: 'Categories', key: null, desc: 'Experience-layer taxonomy' },
  { href: '/admin/services', label: 'Services', key: null, desc: 'Experience-layer products' },
  { href: '/admin/transfer-routes', label: 'Transfers', key: null, desc: 'Point-to-point transfers' },
  { href: '/admin/guides', label: 'Guides', key: null, desc: 'Named experience-layer guides' },
  { href: '/admin/destination-contacts', label: 'Contact routing', key: null, desc: 'Driver + guide routing for WhatsApp' },
  { href: '/admin/content', label: 'Content', key: null, desc: 'Edit hero, about, footer text' },
  { href: '/admin/branding', label: 'Branding', key: null, desc: 'Colors & typography' },
  { href: '/admin/news', label: 'News', key: 'news' as const, desc: 'Blog articles' },
  { href: '/admin/contacts', label: 'Contacts', key: 'contacts' as const, desc: 'Contact submissions' },
  { href: '/admin/admins', label: 'Admins', key: null, desc: 'Manage admin accounts' },
]

export default async function AdminHome() {
  await requireAdmin()
  const counts = await getCounts()
  return (
    <div className="p-8 lg:p-12">
      <header className="mb-10">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">Dashboard</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Welcome back</h1>
        <p className="text-white/40 text-sm mt-2">
          {counts.supabase
            ? 'Connected to Supabase.'
            : 'Supabase not configured — counts unavailable. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'}
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <StatCard label="Tours" value={counts.tours} />
        <StatCard label="Articles" value={counts.news} />
        <StatCard label="New contacts" value={counts.unread} accent />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="admin-card block hover:border-[#FFCC00]/50 transition-colors group"
          >
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">
              {c.label}
            </p>
            <p className="text-white/60 text-sm">{c.desc}</p>
            <p className="mt-4 text-[11px] font-bold tracking-widest uppercase text-white/40 group-hover:text-[#FFCC00] transition-colors">
              Open →
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="admin-card">
      <p className="text-[10px] font-bold tracking-widest uppercase text-white/40">{label}</p>
      <p
        className={`text-4xl font-black tracking-tight mt-2 ${
          accent ? 'text-[#FFCC00]' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
