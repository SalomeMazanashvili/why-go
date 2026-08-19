import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/adminAuth'
import { getTransferRouteById } from '@/lib/transferRoutes'
import { listDestinationsForAdmin } from '@/lib/destinations'
import TransferRouteForm from '../TransferRouteForm'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

export default async function EditTransferRoutePage(props: Params) {
  await requireAdmin()
  const { id } = await props.params
  const [route, destinations] = await Promise.all([
    getTransferRouteById(id),
    listDestinationsForAdmin(),
  ])
  if (!route) notFound()
  const label = `${route.from_name_ka || route.from_name_en} → ${route.to_name_ka || route.to_name_en}`
  return (
    <div className="p-8 lg:p-12 max-w-4xl">
      <header className="mb-8">
        <Link href="/admin/transfer-routes" className="text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-[#FFCC00]">
          ← Transfer routes
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3">{label}</h1>
      </header>
      <TransferRouteForm mode="edit" initial={route} destinations={destinations} />
    </div>
  )
}
