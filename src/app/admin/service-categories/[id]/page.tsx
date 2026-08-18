import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/adminAuth'
import { getServiceCategoryById } from '@/lib/serviceCategories'
import ServiceCategoryForm from '../ServiceCategoryForm'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

export default async function EditServiceCategoryPage(props: Params) {
  await requireAdmin()
  const { id } = await props.params
  const category = await getServiceCategoryById(id)
  if (!category) notFound()
  return (
    <div className="p-8 lg:p-12 max-w-4xl">
      <header className="mb-8">
        <Link href="/admin/service-categories" className="text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-[#FFCC00]">
          ← Categories
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3">
          {category.name_ka || category.name_en || 'Untitled category'}
        </h1>
      </header>
      <ServiceCategoryForm mode="edit" initial={category} />
    </div>
  )
}
