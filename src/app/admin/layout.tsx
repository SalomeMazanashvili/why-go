import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import AdminShell from './_components/AdminShell'
import { ToastProvider } from './_components/ToastProvider'
import '../globals.css'
import './admin.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '700', '900'],
  display: 'swap',
})

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'WHYGO Admin',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="font-sans bg-[#0a0a0a] text-white antialiased">
        <ToastProvider>
          <AdminShell>{children}</AdminShell>
        </ToastProvider>
      </body>
    </html>
  )
}
