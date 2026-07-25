import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/adminAuth'
import { getNewsById } from '@/lib/news'
import NewsForm from '../NewsForm'

export const dynamic = 'force-dynamic'

interface Params {
  params: { id: string }
}

export default async function EditNewsPage({ params }: Params) {
  requireAdmin()
  const item = await getNewsById(params.id)
  if (!item) notFound()
  return (
    <div className="p-8 lg:p-12 max-w-4xl">
      <header className="mb-8">
        <Link href="/admin/news" className="text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-[#FFCC00]">
          ← News
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3">
          {item.title_en || 'Untitled article'}
        </h1>
      </header>
      <NewsForm mode="edit" initial={item} />
    </div>
  )
}
