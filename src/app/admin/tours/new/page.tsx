import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import TourForm from '../TourForm'

export const dynamic = 'force-dynamic'

export default function NewTourPage() {
  requireAdmin()
  return (
    <div className="p-8 lg:p-12 max-w-4xl">
      <header className="mb-8">
        <Link href="/admin/tours" className="text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-[#FFCC00]">
          ← Tours
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3">New tour</h1>
      </header>
      <TourForm mode="create" />
    </div>
  )
}
