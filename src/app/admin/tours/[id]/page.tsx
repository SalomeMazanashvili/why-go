import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/adminAuth'
import { getTourById } from '@/lib/tours'
import TourForm from '../TourForm'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

export default async function EditTourPage(props: Params) {
  const params = await props.params;
  await requireAdmin()
  const tour = await getTourById(params.id)
  if (!tour) notFound()
  return (
    <div className="p-8 lg:p-12 max-w-4xl">
      <header className="mb-8">
        <Link href="/admin/tours" className="text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-[#FFCC00]">
          ← Tours
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3">
          {tour.title_en || 'Untitled tour'}
        </h1>
        <p className="text-white/40 text-sm mt-2">{tour.destination}</p>
      </header>
      <TourForm mode="edit" initial={tour} />
    </div>
  )
}
