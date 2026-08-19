import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { listDestinationContactsForAdmin } from '@/lib/destinationContacts'
import { listDestinationsForAdmin } from '@/lib/destinations'
import { hasAdminSupabase } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function DestinationContactsAdminPage() {
  await requireAdmin()
  const [items, destinations] = await Promise.all([
    listDestinationContactsForAdmin(),
    listDestinationsForAdmin(),
  ])
  const connected = hasAdminSupabase()
  const destMap = new Map(destinations.map((d) => [d.id, d.name_ka || d.name_en]))

  return (
    <div className="p-8 lg:p-12">
      <header className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">Destination contacts</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Driver + guide routing</h1>
          <p className="text-white/40 text-sm mt-2 max-w-2xl">
            {connected
              ? `${items.length} contact${items.length === 1 ? '' : 's'} in Supabase. Powers the WhatsApp copy block on the inquiry admin so every booking request has the right person to forward to.`
              : 'Supabase not configured — configure to enable saves.'}
          </p>
        </div>
        <Link href="/admin/destination-contacts/new" className="admin-btn">+ New contact</Link>
      </header>

      <div className="admin-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a0a] text-white/40 text-[10px] font-bold tracking-widest uppercase">
            <tr>
              <th className="text-left px-5 py-3">Destination</th>
              <th className="text-left px-5 py-3">Role</th>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Phone</th>
              <th className="text-left px-5 py-3">WhatsApp</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t border-white/5">
                <td className="px-5 py-4 text-white/80 text-xs">{destMap.get(c.destination_id) ?? '—'}</td>
                <td className="px-5 py-4">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">
                    {c.contact_type}
                  </span>
                </td>
                <td className="px-5 py-4 font-bold text-white">{c.name}</td>
                <td className="px-5 py-4 text-white/70 font-mono text-xs">{c.phone_e164}</td>
                <td className="px-5 py-4 text-white/70 font-mono text-xs">{c.whatsapp_e164 || '—'}</td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/admin/destination-contacts/${c.id}`}
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
                  No contacts yet. Add drivers and guides so the WhatsApp block can find them.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
