import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { listServicesForAdmin } from '@/lib/services'
import { listDestinationsForAdmin } from '@/lib/destinations'
import { listServiceCategoriesForAdmin } from '@/lib/serviceCategories'
import { hasAdminSupabase } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function ServicesAdminPage() {
  await requireAdmin()
  const [items, destinations, categories] = await Promise.all([
    listServicesForAdmin(),
    listDestinationsForAdmin(),
    listServiceCategoriesForAdmin(),
  ])
  const connected = hasAdminSupabase()

  const destMap = new Map(destinations.map((d) => [d.id, d.name_ka || d.name_en]))
  const catMap = new Map(categories.map((c) => [c.id, c.name_ka || c.name_en]))

  return (
    <div className="p-8 lg:p-12">
      <header className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">Services</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Experience-layer products</h1>
          <p className="text-white/40 text-sm mt-2">
            {connected
              ? `${items.length} service${items.length === 1 ? '' : 's'} in Supabase.`
              : 'Supabase not configured — configure to enable saves.'}
          </p>
        </div>
        <Link href="/admin/services/new" className="admin-btn">+ New service</Link>
      </header>

      <div className="admin-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a0a] text-white/40 text-[10px] font-bold tracking-widest uppercase">
            <tr>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Destination</th>
              <th className="text-left px-5 py-3">Category</th>
              <th className="text-left px-5 py-3">Price</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((svc) => (
              <tr key={svc.id} className="border-t border-white/5">
                <td className="px-5 py-4">
                  <p className="font-bold text-white">{svc.name_ka || svc.name_en || '—'}</p>
                  {svc.name_ka && svc.name_en && svc.name_ka !== svc.name_en && (
                    <p className="text-white/40 text-xs mt-1">{svc.name_en}</p>
                  )}
                </td>
                <td className="px-5 py-4 text-white/70 text-xs">
                  {svc.destination_id ? destMap.get(svc.destination_id) ?? '—' : '—'}
                </td>
                <td className="px-5 py-4 text-white/70 text-xs">
                  {svc.category_id ? catMap.get(svc.category_id) ?? '—' : '—'}
                </td>
                <td className="px-5 py-4 text-white/70 text-xs">
                  {svc.price_from != null ? `${svc.price_from} ${svc.currency}` : '—'}
                </td>
                <td className="px-5 py-4">
                  {svc.is_published ? (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">Live</span>
                  ) : (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">Draft</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/admin/services/${svc.id}`}
                    className="text-[10px] font-bold tracking-widest uppercase text-white/60 hover:text-[#FFCC00]"
                  >
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-white/40 text-sm">
                  No services yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
