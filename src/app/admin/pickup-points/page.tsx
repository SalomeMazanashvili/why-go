import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { listPickupPointsForAdmin } from '@/lib/pickupPoints'
import { listDestinationsForAdmin } from '@/lib/destinations'
import { hasAdminSupabase } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function PickupPointsAdminPage() {
  await requireAdmin()
  const [items, destinations] = await Promise.all([
    listPickupPointsForAdmin(),
    listDestinationsForAdmin(),
  ])
  const connected = hasAdminSupabase()
  const destMap = new Map(destinations.map((d) => [d.id, d.name_ka || d.name_en]))

  return (
    <div className="p-8 lg:p-12">
      <header className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">Pickup points</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Transfer form dropdown</h1>
          <p className="text-white/40 text-sm mt-2 max-w-2xl">
            {connected
              ? `${items.length} pickup point${items.length === 1 ? '' : 's'} in Supabase. Each entry becomes an option in the transfer form's "From" dropdown, grouped by origin city.`
              : 'Supabase not configured — configure to enable saves.'}
          </p>
        </div>
        <Link href="/admin/pickup-points/new" className="admin-btn">+ New pickup point</Link>
      </header>

      <div className="admin-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a0a] text-white/40 text-[10px] font-bold tracking-widest uppercase">
            <tr>
              <th className="text-left px-5 py-3">Destination</th>
              <th className="text-left px-5 py-3">Label</th>
              <th className="text-left px-5 py-3">From price</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-white/5">
                <td className="px-5 py-4 text-white/80 text-xs">{destMap.get(p.destination_id) ?? '—'}</td>
                <td className="px-5 py-4 font-bold text-white">{p.label_ka || p.label_en || '—'}</td>
                <td className="px-5 py-4 text-white/70 text-xs">
                  {p.price_from != null ? `${p.currency} ${p.price_from}` : '—'}
                </td>
                <td className="px-5 py-4">
                  {p.is_published ? (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">Live</span>
                  ) : (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">Draft</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/admin/pickup-points/${p.id}`}
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
                  No pickup points yet. Add at least one before publishing the transfer form.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
