import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { STATIC_TOURS } from '@/types'
import type { Locale } from '@/types'
import { getTourTitle, getTourSubtitle, getTourDescription, getTourTag, formatPrice } from '@/types'

export async function generateStaticParams() {
  return STATIC_TOURS.flatMap(tour =>
    ['en', 'ka'].map(locale => ({ locale, slug: tour.slug }))
  )
}

export default function TourDetailPage({ params: { locale, slug } }: { params: { locale: string; slug: string } }) {
  const tour = STATIC_TOURS.find(t => t.slug === slug)
  if (!tour) notFound()
  const loc = locale as Locale

  return (
    <>
      <section className="relative h-[85vh] flex items-end overflow-hidden">
        <Image src={tour.cover_image ?? ''} alt={getTourTitle(tour, loc)} fill priority
          className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="relative z-10 px-6 md:px-10 pb-12 w-full">
          <Link href={`/${locale}/tours`}
            className="text-[10px] font-bold tracking-widest uppercase text-yellow-400 hover:text-white transition-colors inline-block mb-4">
            ← All Tours
          </Link>
          <p className="text-[10px] font-bold tracking-widest uppercase text-yellow-400 mb-3">{getTourTag(tour, loc)}</p>
          <h1 className="font-black uppercase text-white leading-none tracking-tight"
            style={{ fontSize: 'clamp(48px,8vw,96px)', letterSpacing: '-0.04em' }}>
            {getTourTitle(tour, loc).toUpperCase()}
          </h1>
          <p className="text-lg text-white/60 mt-3 max-w-lg">{getTourSubtitle(tour, loc)}</p>
        </div>
      </section>

      <section className="bg-white px-6 md:px-10 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2">
            <p className="text-[10px] font-bold tracking-widest uppercase text-black/40 mb-4">About This Experience</p>
            <p className="text-base leading-relaxed text-black/80">{getTourDescription(tour, loc)}</p>
          </div>
          <div className="bg-black p-8">
            <p className="text-[10px] font-bold tracking-widest uppercase text-yellow-400 mb-6">Trip Details</p>
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-bold tracking-widest uppercase text-white/30 mb-1">Starting From</p>
                <p className="font-black text-yellow-400 text-2xl tracking-tight">{formatPrice(tour.price_from, tour.currency)}</p>
              </div>
              {tour.duration_days && (
                <div>
                  <p className="text-[9px] font-bold tracking-widest uppercase text-white/30 mb-1">Duration</p>
                  <p className="font-bold text-white">{tour.duration_days} days</p>
                </div>
              )}
              <div>
                <p className="text-[9px] font-bold tracking-widest uppercase text-white/30 mb-1">Destination</p>
                <p className="font-bold text-white">{tour.destination}</p>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <Link href={`/${locale}/contact`}
                className="block w-full text-center bg-yellow-400 text-black font-black text-[11px] tracking-widest uppercase py-4 hover:bg-yellow-300 transition-colors">
                Book This Tour →
              </Link>
              <Link href={`/${locale}/contact`}
                className="block w-full text-center border border-white/20 text-white font-black text-[11px] tracking-widest uppercase py-4 hover:border-yellow-400 hover:text-yellow-400 transition-colors">
                Enquire
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
