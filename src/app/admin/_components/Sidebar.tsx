'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const LINKS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/tours', label: 'Tours' },
  { href: '/admin/content', label: 'Content' },
  { href: '/admin/branding', label: 'Branding' },
  { href: '/admin/news', label: 'News' },
  { href: '/admin/contacts', label: 'Contacts' },
]

export default function Sidebar() {
  const pathname = usePathname() || ''
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const logout = async () => {
    setLoggingOut(true)
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className="w-64 shrink-0 bg-[#111] border-r border-white/5 min-h-screen flex flex-col sticky top-0">
      <div className="px-6 py-6 border-b border-white/5">
        <Link href="/admin" className="text-xl font-black tracking-tight text-white">
          WHY<span className="text-[#FFCC00]">GO</span>
        </Link>
        <p className="text-[9px] tracking-widest uppercase text-white/30 mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 py-4">
        {LINKS.map((link) => {
          const active = isActive(link.href, link.exact)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-6 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors border-l-2 ${
                active
                  ? 'text-[#FFCC00] border-[#FFCC00] bg-[#FFCC00]/5'
                  : 'text-white/50 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-6 border-t border-white/5">
        <button
          onClick={logout}
          disabled={loggingOut}
          className="w-full text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-white transition-colors py-2 border border-white/10 hover:border-white/30 disabled:opacity-40"
        >
          {loggingOut ? '…' : 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
