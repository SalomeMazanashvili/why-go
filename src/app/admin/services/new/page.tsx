import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { listDestinationsForAdmin } from '@/lib/destinations'
import { listServiceCategoriesForAdmin } from '@/lib/serviceCategories'
import ServiceForm from '../ServiceForm'

export const dynamic = 'force-dynamic'

export default async function NewServicePage() {
  await requireAdmin()
  const [destinations, categories] = await Promise.all([
    listDestinationsForAdmin(),
    listServiceCategoriesForAdmin(),
  ])
  return (
    <div className="p-8 lg:p-12 max-w-4xl">
      <header className="mb-8">
        <Link href="/admin/services" className="text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-[#FFCC00]">
          ← Services
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3">New service</h1>
      </header>
      <ServiceForm mode="create" destinations={destinations} categories={categories} />
    </div>
  )
}
