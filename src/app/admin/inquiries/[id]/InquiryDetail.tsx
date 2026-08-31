'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '../../_components/ToastProvider'
import { buildWhatsAppMessage, waLink, contactTypeFor } from '@/lib/whatsapp'
import type {
  Inquiry,
  DestinationContact,
  InquiryStatus,
  InquiryPaymentStatus,
} from '@/types'

interface Props {
  inquiry: Inquiry
  contact: DestinationContact | null
  destinationLabel: string | null
  // Pre-resolved by the server parent (page.tsx) via getTransferRouteById.
  // Null for non-transfer inquiries, one-way transfers (returnRouteLabel),
  // or the "Other" free-text path (both nulls).
  outboundRouteLabel?: string | null
  returnRouteLabel?: string | null
}

const STATUSES: InquiryStatus[] = ['new', 'contacted', 'confirmed', 'declined']
const PAYMENT_STATUSES: InquiryPaymentStatus[] = ['awaiting', 'received', 'not_applicable']

export default function InquiryDetail({
  inquiry: initial,
  contact,
  destinationLabel,
  outboundRouteLabel,
  returnRouteLabel,
}: Props) {
  const router = useRouter()
  const toast = useToast()
  const [inquiry, setInquiry] = useState<Inquiry>(initial)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const message = useMemo(
    () =>
      buildWhatsAppMessage({
        inquiry,
        contact,
        destinationLabel,
        outboundRouteLabel,
        returnRouteLabel,
      }),
    [inquiry, contact, destinationLabel, outboundRouteLabel, returnRouteLabel],
  )
  const link = useMemo(() => waLink(contact, message), [contact, message])

  const patch = async (payload: Partial<Pick<Inquiry, 'status' | 'payment_status'>>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Save failed')
        return
      }
      setInquiry((prev) => ({ ...prev, ...payload }))
      toast.success('Saved')
      router.refresh()
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm(`Delete this inquiry from ${inquiry.name}? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiry.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Delete failed')
        setDeleting(false)
        return
      }
      toast.success('Inquiry deleted')
      router.push('/admin/inquiries')
      router.refresh()
    } catch {
      toast.error('Network error')
      setDeleting(false)
    }
  }

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Copy failed — select and copy manually')
    }
  }

  return (
    <div className="space-y-8">
      <section className="admin-card space-y-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={saving || inquiry.status === s}
              onClick={() => patch({ status: s })}
              className={`text-[11px] font-bold tracking-widest uppercase px-3 py-2 border transition-colors ${
                inquiry.status === s
                  ? 'text-[#FFCC00] border-[#FFCC00] bg-[#FFCC00]/10'
                  : 'text-white/60 border-white/10 hover:text-white hover:border-white/30'
              } disabled:cursor-not-allowed`}
            >
              {s}
            </button>
          ))}
        </div>

        {inquiry.payment_method === 'iban' && (
          <>
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] pt-4">
              Payment (IBAN — needs confirmation)
            </p>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={saving || inquiry.payment_status === s}
                  onClick={() => patch({ payment_status: s })}
                  className={`text-[11px] font-bold tracking-widest uppercase px-3 py-2 border transition-colors ${
                    inquiry.payment_status === s
                      ? 'text-[#FFCC00] border-[#FFCC00] bg-[#FFCC00]/10'
                      : 'text-white/60 border-white/10 hover:text-white hover:border-white/30'
                  } disabled:cursor-not-allowed`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="admin-card space-y-4">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">
            WhatsApp — copy + forward
          </p>
          {contact ? (
            <p className="text-white/50 text-xs">
              To {contact.name} ({contact.contact_type}) · <span className="font-mono">{contact.whatsapp_e164 || contact.phone_e164}</span>
            </p>
          ) : (
            <p className="text-orange-400 text-xs">
              No {inquiry.destination_id ? contactTypeFor(inquiry.service_type) : ''} contact routed for this destination.
              {inquiry.destination_id && (
                <>
                  {' '}
                  <Link
                    href="/admin/destination-contacts/new"
                    className="underline hover:text-[#FFCC00]"
                  >
                    Add one →
                  </Link>
                </>
              )}
            </p>
          )}
        </div>
        <pre className="whitespace-pre-wrap bg-black text-white/90 text-sm p-4 border border-white/10 font-mono">
{message}
        </pre>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={copyMessage} className="admin-btn">
            Copy message
          </button>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-ghost"
            >
              Open WhatsApp →
            </a>
          ) : (
            <span className="text-white/40 text-xs">wa.me link unavailable until a contact is set</span>
          )}
        </div>
      </section>

      {/* Trip section groups the transfer-specific fields (outbound + return
          + flight) into one panel so the founder can eyeball a booking at a
          glance. Non-transfer inquiries fall through to the generic
          Submitted panel below. */}
      {inquiry.service_type === 'transfer' && (
        <section className="admin-card space-y-4">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">Trip</p>
          <div className="space-y-3">
            <p className="text-[10px] font-bold tracking-widest uppercase text-white/40">Outbound</p>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <DetailRow
                label="Route"
                value={outboundRouteLabel || `${inquiry.pickup_from} → ${inquiry.pickup_to}`}
              />
              <DetailRow label="Date" value={inquiry.travel_date || '—'} />
              <DetailRow label="Time" value={inquiry.travel_time || '—'} />
              {inquiry.flight_number && (
                <DetailRow label="Flight" value={inquiry.flight_number} />
              )}
            </dl>
          </div>

          {(inquiry.return_route_id ||
            inquiry.return_date ||
            inquiry.return_pickup_from ||
            inquiry.return_pickup_to) && (
            <div className="space-y-3 pt-4 border-t border-white/5">
              <p className="text-[10px] font-bold tracking-widest uppercase text-white/40">Return</p>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <DetailRow
                  label="Route"
                  value={
                    returnRouteLabel ||
                    `${inquiry.return_pickup_from} → ${inquiry.return_pickup_to}`
                  }
                />
                <DetailRow label="Date" value={inquiry.return_date || '—'} />
                {inquiry.return_time && (
                  <DetailRow label="Time" value={inquiry.return_time} />
                )}
              </dl>
            </div>
          )}
        </section>
      )}

      <section className="admin-card space-y-3">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">Submitted</p>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <DetailRow label="Name" value={inquiry.name} />
          <DetailRow label="Phone" value={inquiry.phone} mono />
          <DetailRow label="Email" value={inquiry.email || '—'} />
          <DetailRow label="Language" value={inquiry.language} />
          <DetailRow label="Destination" value={destinationLabel || '—'} />
          <DetailRow label="Type" value={inquiry.service_type.replace('_', ' ')} />
          {/* Transfer-specific fields render in the Trip section above; keep
              generic date/pickup rows only for non-transfer service types. */}
          {inquiry.service_type !== 'transfer' && (
            <>
              <DetailRow label="Travel date" value={inquiry.travel_date || '—'} />
              {inquiry.travel_date_end && (
                <DetailRow label="Travel end date" value={inquiry.travel_date_end} />
              )}
              {inquiry.travel_time && <DetailRow label="Travel time" value={inquiry.travel_time} />}
              {inquiry.pickup_from && <DetailRow label="Pickup from" value={inquiry.pickup_from} />}
              {inquiry.pickup_to && <DetailRow label="Pickup to" value={inquiry.pickup_to} />}
            </>
          )}
          {inquiry.passengers != null && (
            <DetailRow label="Passengers" value={String(inquiry.passengers)} />
          )}
          {inquiry.luggage_pieces != null && inquiry.luggage_pieces > 0 && (
            <DetailRow label="Luggage" value={String(inquiry.luggage_pieces)} />
          )}
          {inquiry.interests.length > 0 && (
            <DetailRow label="Interests" value={inquiry.interests.join(', ')} />
          )}
          {inquiry.payment_method && (
            <DetailRow label="Payment method" value={inquiry.payment_method} />
          )}
        </dl>
        {inquiry.notes && (
          <div className="pt-4 border-t border-white/5">
            <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-2">Notes</p>
            <p className="text-white/80 text-sm whitespace-pre-wrap">{inquiry.notes}</p>
          </div>
        )}
      </section>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={remove}
          disabled={deleting}
          className="admin-btn admin-btn-danger"
        >
          {deleting ? 'Deleting…' : 'Delete inquiry'}
        </button>
      </div>
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-bold tracking-widest uppercase text-white/40">{label}</dt>
      <dd className={`text-white ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  )
}
