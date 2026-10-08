import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { destinationWordCount, listDestinationsForAdmin } from '@/lib/destinations'
import { MIN_INDEXABLE_WORDS } from '@/lib/seo'
import { hasAdminSupabase } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function DestinationsAdminPage() {
  await requireAdmin()
  const items = await listDestinationsForAdmin()
  const connected = hasAdminSupabase()

  return (
    <div className="p-8 lg:p-12">
      <header className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-brand-yellow mb-2">Destinations</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Destination hubs</h1>
          <p className="text-white/40 text-sm mt-2">
            {connected
              ? `${items.length} destination${items.length === 1 ? '' : 's'} in Supabase.`
              : 'Supabase not configured — configure to enable saves.'}
          </p>
        </div>
        <Link href="/admin/destinations/new" className="admin-btn">+ New destination</Link>
      </header>

      <div className="admin-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a0a] text-white/40 text-[10px] font-bold tracking-widest uppercase">
            <tr>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Country</th>
              <th className="text-left px-5 py-3">Slug</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Hub in Google</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-t border-white/5">
                <td className="px-5 py-4">
                  <p className="font-bold text-white">{d.name_ka || d.name_en || '—'}</p>
                  {d.name_ka && d.name_en && d.name_ka !== d.name_en && (
                    <p className="text-white/40 text-xs mt-1">{d.name_en}</p>
                  )}
                </td>
                <td className="px-5 py-4 text-white/70">{d.country || '—'}</td>
                <td className="px-5 py-4 text-white/50 font-mono text-xs">{d.slug}</td>
                <td className="px-5 py-4">
                  {d.is_published ? (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">Live</span>
                  ) : (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">Draft</span>
                  )}
                </td>
                <td className="px-5 py-4 text-xs">
                  {/* WHY-65: hubs under 300 Georgian words are noindex by design. */}
                  {destinationWordCount(d) >= MIN_INDEXABLE_WORDS ? (
                    <span className="text-emerald-400">Indexed</span>
                  ) : (
                    <span className="text-white/50">
                      Hidden · {destinationWordCount(d)}/{MIN_INDEXABLE_WORDS} words
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/admin/destinations/${d.id}`}
                    className="text-[10px] font-bold tracking-widest uppercase text-white/60 hover:text-brand-yellow"
                  >
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-white/40 text-sm">
                  No destinations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
