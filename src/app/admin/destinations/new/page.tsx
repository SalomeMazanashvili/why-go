import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import DestinationForm from '../DestinationForm'

export const dynamic = 'force-dynamic'

export default async function NewDestinationPage() {
  await requireAdmin()
  return (
    <div className="p-8 lg:p-12 max-w-4xl">
      <header className="mb-8">
        <Link href="/admin/destinations" className="text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-[#FFCC00]">
          ← Destinations
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3">New destination</h1>
      </header>
      <DestinationForm mode="create" />
    </div>
  )
}
