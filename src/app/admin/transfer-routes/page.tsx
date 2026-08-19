import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { listTransferRoutesForAdmin } from '@/lib/transferRoutes'
import { listDestinationsForAdmin } from '@/lib/destinations'
import { hasAdminSupabase } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function TransferRoutesAdminPage() {
  await requireAdmin()
  const [items, destinations] = await Promise.all([
    listTransferRoutesForAdmin(),
    listDestinationsForAdmin(),
  ])
  const connected = hasAdminSupabase()

  const destMap = new Map(destinations.map((d) => [d.id, d.name_ka || d.name_en]))

  return (
    <div className="p-8 lg:p-12">
      <header className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">Transfer routes</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Point-to-point transfers</h1>
          <p className="text-white/40 text-sm mt-2">
            {connected
              ? `${items.length} route${items.length === 1 ? '' : 's'} in Supabase.`
              : 'Supabase not configured — configure to enable saves.'}
          </p>
        </div>
        <Link href="/admin/transfer-routes/new" className="admin-btn">+ New route</Link>
      </header>

      <div className="admin-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a0a] text-white/40 text-[10px] font-bold tracking-widest uppercase">
            <tr>
              <th className="text-left px-5 py-3">Route</th>
              <th className="text-left px-5 py-3">Destination hub</th>
              <th className="text-left px-5 py-3">Price</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => {
              const from = r.from_name_ka || r.from_name_en || '—'
              const to = r.to_name_ka || r.to_name_en || '—'
              const hub = r.to_destination_id ? destMap.get(r.to_destination_id) ?? '—' : '—'
              return (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="px-5 py-4">
                    <p className="font-bold text-white">
                      {from} → {to}
                    </p>
                    <p className="text-white/40 text-xs mt-1 font-mono">{r.slug}</p>
                  </td>
                  <td className="px-5 py-4 text-white/70 text-xs">{hub}</td>
                  <td className="px-5 py-4 text-white/70 text-xs">
                    {r.price_from != null ? `${r.price_from} ${r.currency}` : '—'}
                  </td>
                  <td className="px-5 py-4">
                    {r.is_published ? (
                      <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">Live</span>
                    ) : (
                      <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">Draft</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/transfer-routes/${r.id}`}
                      className="text-[10px] font-bold tracking-widest uppercase text-white/60 hover:text-[#FFCC00]"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              )
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-white/40 text-sm">
                  No transfer routes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
