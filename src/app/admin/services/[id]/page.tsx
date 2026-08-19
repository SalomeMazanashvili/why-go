import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/adminAuth'
import { getServiceById } from '@/lib/services'
import { listDestinationsForAdmin } from '@/lib/destinations'
import { listServiceCategoriesForAdmin } from '@/lib/serviceCategories'
import ServiceForm from '../ServiceForm'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

export default async function EditServicePage(props: Params) {
  await requireAdmin()
  const { id } = await props.params
  const [service, destinations, categories] = await Promise.all([
    getServiceById(id),
    listDestinationsForAdmin(),
    listServiceCategoriesForAdmin(),
  ])
  if (!service) notFound()
  return (
    <div className="p-8 lg:p-12 max-w-4xl">
      <header className="mb-8">
        <Link href="/admin/services" className="text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-[#FFCC00]">
          ← Services
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3">
          {service.name_ka || service.name_en || 'Untitled service'}
        </h1>
      </header>
      <ServiceForm mode="edit" initial={service} destinations={destinations} categories={categories} />
    </div>
  )
}
