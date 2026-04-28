'use client'
import type { Tour, Locale } from '@/types'
import { getTourTitle } from '@/types'

export default function MarqueeStrip({ tours, locale }: { tours: Tour[]; locale: Locale }) {
  const items = [...tours, ...tours]
  return (
    <div className="bg-yellow-400 overflow-hidden py-4">
      <div className="marquee-inner gap-8">
        {items.map((tour, i) => (
          <span key={`${tour.id}-${i}`} className="flex items-center gap-8">
            <span className="text-[13px] font-black tracking-widest uppercase text-black whitespace-nowrap">
              {getTourTitle(tour, locale).toUpperCase()}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-black inline-block flex-shrink-0" />
          </span>
        ))}
      </div>
    </div>
  )
}
