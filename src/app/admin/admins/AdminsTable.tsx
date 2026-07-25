'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '../_components/ToastProvider'
import type { AdminUser } from '@/lib/admins'

interface Props {
  initial: AdminUser[]
  currentId: string | null
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function AdminsTable({ initial, currentId }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [rows, setRows] = useState(initial)
  const [pending, setPending] = useState<string | null>(null)

  const patch = async (id: string, body: Record<string, any>, action: string) => {
    setPending(id + ':' + action)
    try {
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Update failed')
        return false
      }
      return true
    } catch {
      toast.error('Network error')
      return false
    } finally {
      setPending(null)
    }
  }

  const toggleActive = async (a: AdminUser) => {
    if (a.id === currentId && a.is_active) {
      if (!confirm('Deactivate your own account? You will be logged out.')) return
    }
    const ok = await patch(a.id, { is_active: !a.is_active }, 'active')
    if (ok) {
      setRows((prev) => prev.map((r) => (r.id === a.id ? { ...r, is_active: !a.is_active } : r)))
      toast.success(a.is_active ? 'Deactivated' : 'Activated')
      router.refresh()
    }
  }

  const resetPassword = async (a: AdminUser) => {
    const pw = prompt(`New password for ${a.email}:`)
    if (!pw) return
    if (pw.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    const ok = await patch(a.id, { password: pw }, 'password')
    if (ok) toast.success('Password updated')
  }

  const remove = async (a: AdminUser) => {
    if (a.id === currentId) {
      toast.error('Cannot delete the account you are signed in with')
      return
    }
    if (!confirm(`Delete ${a.email}? This cannot be undone.`)) return
    setPending(a.id + ':delete')
    try {
      const res = await fetch(`/api/admin/admins/${a.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Delete failed')
        return
      }
      setRows((prev) => prev.filter((r) => r.id !== a.id))
      toast.success('Admin deleted')
      router.refresh()
    } catch {
      toast.error('Network error')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="admin-card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#0a0a0a] text-white/40 text-[10px] font-bold tracking-widest uppercase">
          <tr>
            <th className="text-left px-5 py-3">Email</th>
            <th className="text-left px-5 py-3">Status</th>
            <th className="text-left px-5 py-3">Last login</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const isMe = a.id === currentId
            return (
              <tr key={a.id} className="border-t border-white/5">
                <td className="px-5 py-4">
                  <p className="font-bold text-white break-all">{a.email}</p>
                  {isMe && (
                    <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mt-1">You</p>
                  )}
                </td>
                <td className="px-5 py-4">
                  {a.is_active ? (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">Active</span>
                  ) : (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">Inactive</span>
                  )}
                </td>
                <td className="px-5 py-4 text-white/60 text-xs">{formatDateTime(a.last_login_at)}</td>
                <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                  <button
                    onClick={() => toggleActive(a)}
                    disabled={pending === a.id + ':active'}
                    className="admin-btn admin-btn-ghost"
                  >
                    {a.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => resetPassword(a)}
                    disabled={pending === a.id + ':password'}
                    className="admin-btn admin-btn-ghost"
                  >
                    Reset pw
                  </button>
                  <button
                    onClick={() => remove(a)}
                    disabled={pending === a.id + ':delete' || isMe}
                    className="admin-btn admin-btn-danger"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-5 py-10 text-center text-white/40 text-sm">
                No admins yet. Add one using the form.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
