import type { Destination } from '@/types'

// WHY-79 direction D ("Night on Earth"): which clocks the hero's clock wall
// shows. Tbilisi (where every customer is) plus each *published*
// destination whose time zone is known, west to east as in the film's
// wall. A destination missing from the table gets no clock rather than a
// guessed one. Labels are the plaque text, Latin capitals like the film's.
export interface ClockCity {
  key: string
  label: string
  timeZone: string
  home: boolean
}

const ZONES: Record<string, { timeZone: string; lon: number }> = {
  madrid: { timeZone: 'Europe/Madrid', lon: -3.7 },
  barcelona: { timeZone: 'Europe/Madrid', lon: 2.17 },
  paris: { timeZone: 'Europe/Paris', lon: 2.35 },
  venice: { timeZone: 'Europe/Rome', lon: 12.33 },
  rome: { timeZone: 'Europe/Rome', lon: 12.5 },
}
const TBILISI = { key: 'tbilisi', label: 'TBILISI', timeZone: 'Asia/Tbilisi', home: true, lon: 44.8 }

// Five fit across a 380px phone; the wall stays a wall, not a list.
const MAX_DESTINATIONS = 4

export function clockCities(destinations: Destination[]): ClockCity[] {
  const away = destinations
    .filter((d) => d.is_published && ZONES[d.slug])
    .slice(0, MAX_DESTINATIONS)
    .map((d) => ({
      key: d.slug,
      label: (d.name_en || d.slug).toUpperCase(),
      timeZone: ZONES[d.slug].timeZone,
      home: false,
      lon: ZONES[d.slug].lon,
    }))
  return [...away, TBILISI]
    .sort((a, b) => a.lon - b.lon)
    .map(({ key, label, timeZone, home }) => ({ key, label, timeZone, home }))
}
