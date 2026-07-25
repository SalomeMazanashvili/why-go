'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }
      router.push(from)
      router.refresh()
    } catch (err) {
      setError('Network error')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-[10px] font-bold tracking-widest uppercase text-white/50 block mb-2">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          className="w-full bg-[#111] border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#FFCC00] transition-colors"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold tracking-widest uppercase text-white/50 block mb-2">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-[#111] border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#FFCC00] transition-colors"
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p className="text-[11px] text-red-400 border-l-2 border-red-400 pl-3 py-2 bg-red-500/5">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#FFCC00] text-black font-black text-[11px] tracking-widest uppercase py-3.5 hover:bg-yellow-300 transition-colors disabled:opacity-50"
      >
        {loading ? '…' : 'Sign in'}
      </button>
      <p className="text-[10px] text-white/30 text-center pt-2">
        Root recovery: leave email empty and use the ADMIN_PASSWORD env value.
      </p>
    </form>
  )
}
