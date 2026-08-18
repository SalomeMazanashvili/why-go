import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { listGuidesForAdmin } from '@/lib/guides'
import { hasAdminSupabase } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function GuidesAdminPage() {
  await requireAdmin()
  const items = await listGuidesForAdmin()
  const connected = hasAdminSupabase()

  return (
    <div className="p-8 lg:p-12">
      <header className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">Guides</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Experience-layer guides</h1>
          <p className="text-white/40 text-sm mt-2">
            {connected
              ? `${items.length} guide${items.length === 1 ? '' : 's'} in Supabase.`
              : 'Supabase not configured — configure to enable saves.'}
          </p>
        </div>
        <Link href="/admin/guides/new" className="admin-btn">+ New guide</Link>
      </header>

      <div className="admin-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a0a] text-white/40 text-[10px] font-bold tracking-widest uppercase">
            <tr>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Languages</th>
              <th className="text-left px-5 py-3">Destinations</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((g) => (
              <tr key={g.id} className="border-t border-white/5">
                <td className="px-5 py-4">
                  <p className="font-bold text-white">{g.name_ka || g.name_en || '—'}</p>
                  {g.name_ka && g.name_en && g.name_ka !== g.name_en && (
                    <p className="text-white/40 text-xs mt-1">{g.name_en}</p>
                  )}
                </td>
                <td className="px-5 py-4 text-white/70 text-xs">{g.languages || '—'}</td>
                <td className="px-5 py-4 text-white/70 text-xs">{g.destinations_covered || '—'}</td>
                <td className="px-5 py-4">
                  {g.is_published ? (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">Live</span>
                  ) : (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">Draft</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/admin/guides/${g.id}`}
                    className="text-[10px] font-bold tracking-widest uppercase text-white/60 hover:text-[#FFCC00]"
                  >
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-white/40 text-sm">
                  No guides yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
