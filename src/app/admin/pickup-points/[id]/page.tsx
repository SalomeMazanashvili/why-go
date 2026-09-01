import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/adminAuth'
import { getPickupPointById } from '@/lib/pickupPoints'
import { listDestinationsForAdmin } from '@/lib/destinations'
import PickupPointForm from '../PickupPointForm'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

export default async function EditPickupPointPage(props: Params) {
  await requireAdmin()
  const { id } = await props.params
  const [point, destinations] = await Promise.all([
    getPickupPointById(id),
    listDestinationsForAdmin(),
  ])
  if (!point) notFound()
  return (
    <div className="p-8 lg:p-12 max-w-4xl">
      <header className="mb-8">
        <Link href="/admin/pickup-points" className="text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-[#FFCC00]">
          ← Pickup points
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3">
          {point.label_ka || point.label_en}
        </h1>
      </header>
      <PickupPointForm mode="edit" initial={point} destinations={destinations} />
    </div>
  )
}
