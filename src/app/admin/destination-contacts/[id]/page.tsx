import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/adminAuth'
import { getDestinationContactById } from '@/lib/destinationContacts'
import { listDestinationsForAdmin } from '@/lib/destinations'
import DestinationContactForm from '../DestinationContactForm'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

export default async function EditDestinationContactPage(props: Params) {
  await requireAdmin()
  const { id } = await props.params
  const [contact, destinations] = await Promise.all([
    getDestinationContactById(id),
    listDestinationsForAdmin(),
  ])
  if (!contact) notFound()
  return (
    <div className="p-8 lg:p-12 max-w-4xl">
      <header className="mb-8">
        <Link href="/admin/destination-contacts" className="text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-[#FFCC00]">
          ← Destination contacts
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3">{contact.name}</h1>
        <p className="text-white/40 text-sm mt-2">{contact.contact_type} · {contact.phone_e164}</p>
      </header>
      <DestinationContactForm mode="edit" initial={contact} destinations={destinations} />
    </div>
  )
}
