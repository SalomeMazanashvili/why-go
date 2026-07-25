'use client'

import { Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '../_components/ToastProvider'
import type { ContactStatus, ContactSubmission } from '@/lib/contacts'

interface Props {
  initial: ContactSubmission[]
}

const STATUS_STYLES: Record<ContactStatus, string> = {
  new: 'text-[#FFCC00] border-[#FFCC00]/40',
  replied: 'text-emerald-400 border-emerald-400/40',
  archived: 'text-white/40 border-white/20',
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function ContactsTable({ initial }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [rows, setRows] = useState(initial)
  const [openId, setOpenId] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)

  const setStatus = async (id: string, status: ContactStatus) => {
    setPending(id + ':' + status)
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Update failed')
        return
      }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
      toast.success(`Marked ${status}`)
      router.refresh()
    } catch {
      toast.error('Network error')
    } finally {
      setPending(null)
    }
  }

  if (rows.length === 0) {
    return (
      <div className="admin-card text-white/40 text-sm text-center py-10">
        No submissions match this filter.
      </div>
    )
  }

  return (
    <div className="admin-card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#0a0a0a] text-white/40 text-[10px] font-bold tracking-widest uppercase">
          <tr>
            <th className="text-left px-5 py-3">Name / email</th>
            <th className="text-left px-5 py-3">Tour</th>
            <th className="text-left px-5 py-3">Received</th>
            <th className="text-left px-5 py-3">Status</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const isOpen = openId === c.id
            return (
              <Fragment key={c.id}>
                <tr
                  className="border-t border-white/5 cursor-pointer hover:bg-white/[0.02]"
                  onClick={() => setOpenId(isOpen ? null : c.id)}
                >
                  <td className="px-5 py-4">
                    <p className="font-bold text-white">{c.full_name}</p>
                    <p className="text-white/40 text-xs mt-1">{c.email}</p>
                  </td>
                  <td className="px-5 py-4 text-white/70">{c.tour_slug || '—'}</td>
                  <td className="px-5 py-4 text-white/60 text-xs">{formatDateTime(c.created_at)}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase border ${STATUS_STYLES[c.status]}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-[10px] font-bold tracking-widest uppercase text-white/40">
                    {isOpen ? 'Close' : 'Open'}
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-t border-white/5 bg-[#0a0a0a]">
                    <td colSpan={5} className="px-5 py-5">
                      <div className="mb-4">
                        <p className="admin-label mb-2">Message</p>
                        <p className="text-white/80 text-sm whitespace-pre-wrap">
                          {c.message || <span className="text-white/30">— no message —</span>}
                        </p>
                      </div>
                      <div className="text-white/40 text-xs mb-4">
                        Language: {c.language?.toUpperCase() || 'EN'}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setStatus(c.id, 'new') }}
                          disabled={pending === c.id + ':new' || c.status === 'new'}
                          className="admin-btn admin-btn-ghost"
                        >
                          Mark new
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setStatus(c.id, 'replied') }}
                          disabled={pending === c.id + ':replied' || c.status === 'replied'}
                          className="admin-btn"
                        >
                          Mark replied
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setStatus(c.id, 'archived') }}
                          disabled={pending === c.id + ':archived' || c.status === 'archived'}
                          className="admin-btn admin-btn-ghost"
                        >
                          Archive
                        </button>
                        <a
                          href={`mailto:${c.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="admin-btn admin-btn-ghost ml-auto"
                        >
                          Reply →
                        </a>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
