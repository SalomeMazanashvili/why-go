'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '../_components/ToastProvider'

interface Props {
  disabled?: boolean
}

export default function NewAdminForm({ disabled }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Create failed')
        return
      }
      toast.success('Admin created')
      setEmail('')
      setPassword('')
      router.refresh()
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <aside className="admin-card space-y-4 self-start">
      <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">Add admin</p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="admin-label">Email</label>
          <input
            type="email"
            className="admin-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={disabled}
          />
        </div>
        <div>
          <label className="admin-label">Password</label>
          <input
            type="password"
            className="admin-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            disabled={disabled}
          />
          <p className="text-[10px] text-white/30 mt-1">Minimum 8 characters. Stored as scrypt hash.</p>
        </div>
        <button
          type="submit"
          disabled={saving || disabled}
          className="admin-btn w-full"
        >
          {saving ? 'Creating…' : disabled ? 'Supabase required' : 'Create admin'}
        </button>
      </form>
    </aside>
  )
}
