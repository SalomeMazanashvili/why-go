import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/adminAuth'
import { getDestinationById } from '@/lib/destinations'
import DestinationForm from '../DestinationForm'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

export default async function EditDestinationPage(props: Params) {
  await requireAdmin()
  const { id } = await props.params
  const destination = await getDestinationById(id)
  if (!destination) notFound()
  return (
    <div className="p-8 lg:p-12 max-w-4xl">
      <header className="mb-8">
        <Link href="/admin/destinations" className="text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-[#FFCC00]">
          ← Destinations
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3">
          {destination.name_ka || destination.name_en || 'Untitled destination'}
        </h1>
        {destination.country && (
          <p className="text-white/40 text-sm mt-2">{destination.country}</p>
        )}
      </header>
      <DestinationForm mode="edit" initial={destination} />
    </div>
  )
}
