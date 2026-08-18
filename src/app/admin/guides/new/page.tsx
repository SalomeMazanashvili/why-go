import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import GuideForm from '../GuideForm'

export const dynamic = 'force-dynamic'

export default async function NewGuidePage() {
  await requireAdmin()
  return (
    <div className="p-8 lg:p-12 max-w-4xl">
      <header className="mb-8">
        <Link href="/admin/guides" className="text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-[#FFCC00]">
          ← Guides
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3">New guide</h1>
      </header>
      <GuideForm mode="create" />
    </div>
  )
}
