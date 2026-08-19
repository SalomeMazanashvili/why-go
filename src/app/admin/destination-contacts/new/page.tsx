import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { listDestinationsForAdmin } from '@/lib/destinations'
import DestinationContactForm from '../DestinationContactForm'

export const dynamic = 'force-dynamic'

export default async function NewDestinationContactPage() {
  await requireAdmin()
  const destinations = await listDestinationsForAdmin()
  return (
    <div className="p-8 lg:p-12 max-w-4xl">
      <header className="mb-8">
        <Link href="/admin/destination-contacts" className="text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-[#FFCC00]">
          ← Destination contacts
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3">New contact</h1>
      </header>
      <DestinationContactForm mode="create" destinations={destinations} />
    </div>
  )
}
