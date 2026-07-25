import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { listTours } from '@/lib/tours'
import { hasAdminSupabase } from '@/lib/supabase/admin'
import { formatPrice } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ToursAdminPage() {
  requireAdmin()
  const tours = await listTours()
  const connected = hasAdminSupabase()

  return (
    <div className="p-8 lg:p-12">
      <header className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">Tours</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Tour packages</h1>
          <p className="text-white/40 text-sm mt-2">
            {connected
              ? `${tours.length} tour${tours.length === 1 ? '' : 's'} in Supabase.`
              : 'Showing static tours. Configure Supabase to enable saves.'}
          </p>
        </div>
        <Link href="/admin/tours/new" className="admin-btn">+ New tour</Link>
      </header>

      <div className="admin-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a0a] text-white/40 text-[10px] font-bold tracking-widest uppercase">
            <tr>
              <th className="text-left px-5 py-3">Title</th>
              <th className="text-left px-5 py-3">Destination</th>
              <th className="text-left px-5 py-3">Price</th>
              <th className="text-left px-5 py-3">Duration</th>
              <th className="text-left px-5 py-3">Featured</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {tours.map((t) => (
              <tr key={t.id} className="border-t border-white/5">
                <td className="px-5 py-4">
                  <p className="font-bold text-white">{t.title_en || '—'}</p>
                  <p className="text-white/40 text-xs mt-1">{t.subtitle_en}</p>
                </td>
                <td className="px-5 py-4 text-white/70">{t.destination}</td>
                <td className="px-5 py-4 text-white/70">{formatPrice(t.price_from, t.currency)}</td>
                <td className="px-5 py-4 text-white/70">{t.duration_days ? `${t.duration_days}d` : '—'}</td>
                <td className="px-5 py-4">
                  {t.is_featured ? (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">Yes</span>
                  ) : (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/30">No</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/admin/tours/${t.id}`}
                    className="text-[10px] font-bold tracking-widest uppercase text-white/60 hover:text-[#FFCC00]"
                  >
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
            {tours.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-white/40 text-sm">
                  No tours yet. Click “New tour” to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
