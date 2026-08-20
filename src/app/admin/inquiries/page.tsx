import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { listInquiriesForAdmin } from '@/lib/inquiries'
import { listDestinationsForAdmin } from '@/lib/destinations'
import { hasAdminSupabase } from '@/lib/supabase/admin'
import type { InquiryStatus, InquiryServiceType } from '@/types'

export const dynamic = 'force-dynamic'

const STATUSES: (InquiryStatus | 'all')[] = ['all', 'new', 'contacted', 'confirmed', 'declined']
const SERVICE_TYPES: (InquiryServiceType | 'all')[] = [
  'all',
  'transfer',
  'day_trip',
  'guide',
  'experience',
]

interface Props {
  searchParams: Promise<{ status?: string; service_type?: string }>
}

export default async function InquiriesAdminPage(props: Props) {
  await requireAdmin()
  const { status = 'new', service_type = 'all' } = await props.searchParams

  const [items, destinations] = await Promise.all([
    listInquiriesForAdmin({
      status: status !== 'all' ? (status as InquiryStatus) : undefined,
      service_type: service_type !== 'all' ? (service_type as InquiryServiceType) : undefined,
    }),
    listDestinationsForAdmin(),
  ])
  const connected = hasAdminSupabase()
  const destMap = new Map(destinations.map((d) => [d.id, d.name_ka || d.name_en]))

  return (
    <div className="p-8 lg:p-12">
      <header className="mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">Inquiries</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Booking requests</h1>
        <p className="text-white/40 text-sm mt-2">
          {connected
            ? `${items.length} inquir${items.length === 1 ? 'y' : 'ies'} matching filters.`
            : 'Supabase not configured — configure to enable this view.'}
        </p>
      </header>

      <div className="admin-card mb-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-bold tracking-widest uppercase text-white/40 mr-2">Status</span>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={{ query: { status: s, service_type } }}
              className={`text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 border ${
                status === s
                  ? 'text-[#FFCC00] border-[#FFCC00] bg-[#FFCC00]/10'
                  : 'text-white/50 border-white/10 hover:text-white hover:border-white/30'
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-bold tracking-widest uppercase text-white/40 mr-2">Type</span>
          {SERVICE_TYPES.map((s) => (
            <Link
              key={s}
              href={{ query: { status, service_type: s } }}
              className={`text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 border ${
                service_type === s
                  ? 'text-[#FFCC00] border-[#FFCC00] bg-[#FFCC00]/10'
                  : 'text-white/50 border-white/10 hover:text-white hover:border-white/30'
              }`}
            >
              {s.replace('_', ' ')}
            </Link>
          ))}
        </div>
      </div>

      <div className="admin-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a0a] text-white/40 text-[10px] font-bold tracking-widest uppercase">
            <tr>
              <th className="text-left px-5 py-3">Received</th>
              <th className="text-left px-5 py-3">Type</th>
              <th className="text-left px-5 py-3">Destination</th>
              <th className="text-left px-5 py-3">Customer</th>
              <th className="text-left px-5 py-3">Phone</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Payment</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-white/5">
                <td className="px-5 py-4 text-white/70 text-xs whitespace-nowrap">
                  {new Date(i.created_at).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-5 py-4 text-white/70 text-xs">{i.service_type.replace('_', ' ')}</td>
                <td className="px-5 py-4 text-white/70 text-xs">
                  {i.destination_id ? destMap.get(i.destination_id) ?? '—' : '—'}
                </td>
                <td className="px-5 py-4 font-bold text-white">{i.name}</td>
                <td className="px-5 py-4 text-white/70 font-mono text-xs">{i.phone}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={i.status} />
                </td>
                <td className="px-5 py-4">
                  {i.payment_method === 'iban' ? (
                    <PaymentBadge status={i.payment_status} />
                  ) : (
                    <span className="text-[10px] text-white/30 uppercase tracking-widest">n/a</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/admin/inquiries/${i.id}`}
                    className="text-[10px] font-bold tracking-widest uppercase text-white/60 hover:text-[#FFCC00]"
                  >
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-white/40 text-sm">
                  No inquiries match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: InquiryStatus }) {
  const map: Record<InquiryStatus, string> = {
    new: 'text-[#FFCC00]',
    contacted: 'text-sky-400',
    confirmed: 'text-emerald-400',
    declined: 'text-white/40',
  }
  return (
    <span className={`text-[10px] font-bold tracking-widest uppercase ${map[status]}`}>{status}</span>
  )
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    awaiting: 'text-orange-400',
    received: 'text-emerald-400',
    not_applicable: 'text-white/40',
  }
  return (
    <span className={`text-[10px] font-bold tracking-widest uppercase ${map[status] ?? 'text-white/40'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
