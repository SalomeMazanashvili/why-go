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
// different for a museum ticket and a full-day excursion. `city` is for
// lists that aren't already grouped by destination (the homepage). `wide`
// lays a lone card out image-beside-text so one item still fills the row.
export default function ServiceCard({
  service,
  loc,
  href,
  details,
  price,
  city,
  wide = false,
}: {
  service: Service
  loc: Locale
  href: string
  details?: string | null
  price?: string | null
  city?: string | null
  wide?: boolean
}) {
  const name = getServiceName(service, loc)
  const short = getServiceShortDescription(service, loc)
  return (
    <Link
      href={href}
      className={`group block h-full bg-raised border border-line hover:border-fg transition-colors ${wide ? 'md:grid md:grid-cols-2' : ''}`}
    >
      {service.cover_image && (
        <div className={`relative aspect-[4/3] overflow-hidden ${wide ? 'md:aspect-auto md:min-h-[320px]' : ''}`}>
          {/* Decorative here: the card's accessible name is the title below. */}
          <Image
            src={service.cover_image}
            alt=""
            fill
            sizes={wide ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw'}
            className="object-cover"
          />
        </div>
      )}
      <div className={wide ? 'p-5 md:p-8 md:self-center' : 'p-5'}>
        {city && (
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-2">{city}</p>
        )}
        <h3 className="text-lg font-bold group-hover:underline decoration-yellow-400 decoration-2 underline-offset-4 transition-colors">{name}</h3>
        {short && <p className="text-muted text-sm mt-2 leading-relaxed">{short}</p>}
        {(details || price) && (
          <p className="text-xs text-muted mt-4 flex flex-wrap gap-x-4 items-center">
            {details && <span>{details}</span>}
            {price && <span className="inline-block bg-yellow-400 text-ink font-bold px-1.5">{price}</span>}
          </p>
        )}
      </div>
    </Link>
  )
}
