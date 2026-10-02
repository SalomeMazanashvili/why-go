import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import {
  getServiceName,
  getServiceShortDescription,
  type Locale,
  type Service,
} from '@/types'

// Card for a published service with a detail page. Shared by /day-trips and
// /experiences (WHY-67). `details` is the muted meta line (e.g. duration on
// /day-trips); /experiences leaves it out — duration means something
// different for a museum ticket and a full-day excursion.
export default function ServiceCard({
  service,
  loc,
  href,
  details,
  price,
}: {
  service: Service
  loc: Locale
  href: string
  details?: string | null
  price?: string | null
}) {
  const name = getServiceName(service, loc)
  const short = getServiceShortDescription(service, loc)
  return (
    <Link
      href={href}
      className="group block h-full border border-white/10 hover:border-[#FFCC00]/50 transition-colors"
    >
      {service.cover_image && (
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* Decorative here: the card's accessible name is the title below. */}
          <Image
            src={service.cover_image}
            alt=""
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="p-5">
        <h3 className="text-lg font-bold group-hover:text-[#FFCC00] transition-colors">{name}</h3>
        {short && <p className="text-white/60 text-sm mt-2 leading-relaxed">{short}</p>}
        {(details || price) && (
          <p className="text-xs text-white/50 mt-4 flex flex-wrap gap-x-4">
            {details && <span>{details}</span>}
            {price && <span className="text-[#FFCC00] font-bold">{price}</span>}
          </p>
        )}
      </div>
    </Link>
  )
}
