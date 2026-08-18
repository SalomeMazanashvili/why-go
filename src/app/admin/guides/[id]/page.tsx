import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/adminAuth'
import { getGuideById } from '@/lib/guides'
import GuideForm from '../GuideForm'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

export default async function EditGuidePage(props: Params) {
  await requireAdmin()
  const { id } = await props.params
  const guide = await getGuideById(id)
  if (!guide) notFound()
  return (
    <div className="p-8 lg:p-12 max-w-4xl">
      <header className="mb-8">
        <Link href="/admin/guides" className="text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-[#FFCC00]">
          ← Guides
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3">
          {guide.name_ka || guide.name_en || 'Untitled guide'}
        </h1>
      </header>
      <GuideForm mode="edit" initial={guide} />
    </div>
  )
}
