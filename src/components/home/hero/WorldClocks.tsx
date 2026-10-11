'use client'

import { useEffect, useState } from 'react'
import type { ClockCity } from '@/lib/cityClocks'

// WHY-79 direction D: the clock wall from the opening of Jarmusch's
// "Night on Earth" (the still WHYGO posted in May), with the cities the
// customer is travelling between. Decorative: aria-hidden, no requests.
//
// Time is only known in the browser (the page is cached for an hour), so
// the server renders the faces with the hands hidden; on mount they sweep
// once from 12:00 to the local time in each city (no sweep under
// prefers-reduced-motion). After that the hands step once a minute, without
// animation, and stop while the tab is hidden. Nothing loops.

type Time = { h: number; m: number }

function timeIn(timeZone: string, now: Date): Time {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0)
  return { h: get('hour'), m: get('minute') }
}

export default function WorldClocks({ cities }: { cities: ClockCity[] }) {
  const [times, setTimes] = useState<Record<string, Time> | null>(null)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      const now = new Date()
      setTimes(Object.fromEntries(cities.map((c) => [c.key, timeIn(c.timeZone, now)])))
      // Next update on the next minute boundary, only while visible.
      timer = setTimeout(() => {
        if (document.visibilityState === 'visible') tick()
      }, 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50)
    }
    // First paint at 12:00, then sweep to the real time.
    const raf = requestAnimationFrame(() => tick())
    const done = setTimeout(() => setSettled(true), 1600)
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timer)
        tick()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      clearTimeout(done)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [cities])

  // Fewer clocks, bigger faces: three fill a phone row as well as five.
  const size =
    cities.length <= 3
      ? 'w-[clamp(72px,24vw,96px)] md:w-28 lg:w-32'
      : 'w-[clamp(52px,16vw,64px)] md:w-24 lg:w-28'
  return (
    <ul aria-hidden="true" className="flex items-end gap-3 sm:gap-5 md:gap-7">
      {cities.map((c) => {
        const t = times?.[c.key]
        // Cumulative angles so the minute step from :59 to :00 doesn't spin back.
        const hourDeg = t ? (t.h % 12) * 30 + t.m * 0.5 : 0
        const minDeg = t ? t.m * 6 : 0
        const handStyle = (deg: number) => ({
          transform: `rotate(${deg}deg)`,
          transformOrigin: '50px 50px',
          opacity: t ? 1 : 0,
        })
        return (
          <li key={c.key} className={`flex flex-col items-center gap-2 ${size}`}>
            {/* Plaque above, as on the film's wall. Home is the yellow one. */}
            <span
              className={`px-1.5 py-0.5 text-[8px] md:text-[10px] font-black tracking-widest leading-none whitespace-nowrap ${
                c.home ? 'bg-brand-yellow text-ink' : 'bg-ink text-paper ring-1 ring-paper/25'
              }`}
            >
              {c.label}
            </span>
            <svg viewBox="0 0 100 100" className="w-full h-auto" focusable="false">
              <circle cx="50" cy="50" r="48" fill="#111110" stroke="#F5F5F0" strokeOpacity="0.3" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="44" fill="#F5F5F0" />
              {Array.from({ length: 60 }, (_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1={i % 5 === 0 ? 9 : 10}
                  x2="50"
                  y2={i % 5 === 0 ? 16 : 12}
                  stroke="#111110"
                  strokeWidth={i % 5 === 0 ? 2.4 : 0.8}
                  transform={`rotate(${i * 6} 50 50)`}
                />
              ))}
              <g className={settled ? '' : 'clock-sweep'}>
                <line x1="50" y1="54" x2="50" y2="28" stroke="#111110" strokeWidth="4" strokeLinecap="round" style={handStyle(hourDeg)} />
                <line x1="50" y1="56" x2="50" y2="16" stroke="#111110" strokeWidth="2.6" strokeLinecap="round" style={handStyle(minDeg)} />
              </g>
              <circle cx="50" cy="50" r="3.2" fill={c.home ? '#FCCC01' : '#111110'} stroke="#111110" strokeWidth="1" />
              {/* Wall-light falloff across the face. */}
              <circle cx="50" cy="50" r="44" fill={`url(#clock-shade-${c.key})`} />
              <defs>
                <radialGradient id={`clock-shade-${c.key}`} cx="0.35" cy="0.3" r="0.8">
                  <stop offset="0.55" stopColor="#111110" stopOpacity="0" />
                  <stop offset="1" stopColor="#111110" stopOpacity="0.28" />
                </radialGradient>
              </defs>
            </svg>
            {/* Digital plaque below, in place of the film's A.M./P.M. */}
            <span className="min-w-[3.6em] text-center bg-ink text-paper/90 ring-1 ring-paper/25 px-1 py-0.5 text-[9px] md:text-[11px] font-bold tabular-nums leading-none">
              {t ? `${String(t.h).padStart(2, '0')}:${String(t.m).padStart(2, '0')}` : ' '}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
