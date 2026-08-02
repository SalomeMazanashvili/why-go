import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { listNewsForAdmin } from '@/lib/news'
import { hasAdminSupabase } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

export default async function NewsAdminPage() {
  await requireAdmin()
  const items = await listNewsForAdmin()
  const connected = hasAdminSupabase()

  return (
    <div className="p-8 lg:p-12">
      <header className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">News</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Articles</h1>
          <p className="text-white/40 text-sm mt-2">
            {connected
              ? `${items.length} article${items.length === 1 ? '' : 's'} in Supabase.`
              : 'Showing static articles. Configure Supabase to enable saves.'}
          </p>
        </div>
        <Link href="/admin/news/new" className="admin-btn">+ New article</Link>
      </header>

      <div className="admin-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a0a] text-white/40 text-[10px] font-bold tracking-widest uppercase">
            <tr>
              <th className="text-left px-5 py-3">Title</th>
              <th className="text-left px-5 py-3">Published</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Featured</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((n) => (
              <tr key={n.id} className="border-t border-white/5">
                <td className="px-5 py-4">
                  <p className="font-bold text-white">{n.title_en || '—'}</p>
                  <p className="text-white/40 text-xs mt-1 line-clamp-1">{n.excerpt_en}</p>
                </td>
                <td className="px-5 py-4 text-white/70">{formatDate(n.published_at)}</td>
                <td className="px-5 py-4">
                  {n.is_published ? (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">Live</span>
                  ) : (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">Draft</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  {n.is_featured ? (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">Yes</span>
                  ) : (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/30">No</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/admin/news/${n.id}`}
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
                  No articles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
