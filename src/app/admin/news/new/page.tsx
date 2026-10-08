import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { listDestinationsForAdmin } from '@/lib/destinations'
import NewsForm from '../NewsForm'

export const dynamic = 'force-dynamic'

export default async function NewNewsPage() {
  await requireAdmin()
  const destinations = await listDestinationsForAdmin()
  return (
    <div className="p-8 lg:p-12 max-w-4xl">
      <header className="mb-8">
        <Link href="/admin/news" className="text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-brand-yellow">
          ← News
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3">New article</h1>
      </header>
      <NewsForm mode="create" destinations={destinations} />
    </div>
  )
}
