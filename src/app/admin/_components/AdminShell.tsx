'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const isLoginPage = pathname === '/admin/login'

  if (isLoginPage) return <>{children}</>

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 bg-[#1a1a1a]">{children}</main>
    </div>
  )
}
