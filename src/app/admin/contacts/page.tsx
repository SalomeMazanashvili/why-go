import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { listContacts, type ContactStatus } from '@/lib/contacts'
import { hasAdminSupabase } from '@/lib/supabase/admin'
import ContactsTable from './ContactsTable'

export const dynamic = 'force-dynamic'

const FILTERS: { value: 'all' | ContactStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'replied', label: 'Replied' },
  { value: 'archived', label: 'Archived' },
]

interface SearchParams {
  searchParams: { status?: string }
}

export default async function ContactsAdminPage({ searchParams }: SearchParams) {
  requireAdmin()
  const raw = searchParams?.status
  const status = (['all', 'new', 'replied', 'archived'].includes(raw ?? '')
    ? (raw as 'all' | ContactStatus)
    : 'all')
  const rows = await listContacts(status)
  const connected = hasAdminSupabase()

  return (
    <div className="p-8 lg:p-12">
      <header className="mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">Contacts</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Contact submissions</h1>
        <p className="text-white/40 text-sm mt-2">
          {connected
            ? `${rows.length} submission${rows.length === 1 ? '' : 's'}`
            : 'Supabase not configured — no submissions to show.'}
        </p>
      </header>

      <nav className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => {
          const active = f.value === status
          const href = f.value === 'all' ? '/admin/contacts' : `/admin/contacts?status=${f.value}`
          return (
            <Link
              key={f.value}
              href={href}
              className={`px-4 py-2 text-[10px] font-bold tracking-widest uppercase border ${
                active
                  ? 'bg-[#FFCC00] text-black border-[#FFCC00]'
                  : 'text-white/60 border-white/10 hover:text-white hover:border-white/30'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </nav>

      {connected ? (
        <ContactsTable initial={rows} />
      ) : (
        <div className="admin-card text-white/40 text-sm">
          Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to view submissions.
        </div>
      )}
    </div>
  )
}
