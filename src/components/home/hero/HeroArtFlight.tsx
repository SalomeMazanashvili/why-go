import { CREASE_STEP_DEG, PLANE_EDGE_DEG, PlaneGlyph } from '@/components/brand/PlaneMark'

// WHY-79, direction A: flight geometry. The logo's construction rule,
// scaled to the hero: rays from one origin just off the top-right corner,
// 2.4° apart and phased on the plane's own 23.73°/26.13° crease, so the
// plane (translated, not rotated) has every edge parallel to a ray.
//
// One square viewBox, sliced from the top-right corner: the rays keep their
// true angles at any aspect ratio, and the convergence stays in the corner
// on a 380px phone and a 1440px desktop alike.
const O = { x: 1040, y: -40 }
const BASE = PLANE_EDGE_DEG[1]
const RAYS = Array.from({ length: 39 }, (_, i) => BASE + (i - 9) * CREASE_STEP_DEG) // ≈2°…93°
const LEN = 2600

// The plane sits just below the convergence, clear of the headline column
// (which grows upwards from the bottom-left). Positions are in viewBox
// units; the slice scale is hero height / 1000 on a phone and width / 1000
// from md up, so they're set per breakpoint. Phone: nose ≈ (338, 128)px
// on a 380×608 hero. Desktop: nose ≈ (1330, 150)px at 1440, tail right of
// the 896px headline column.
const PLANE_PHONE = { x: 931, y: 210, size: 170 }
const PLANE_DESK = { x: 924, y: 104, size: 150 }

export default function HeroArtFlight() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMaxYMin slice"
    >
      <defs>
        {/* Rays are brightest at the origin and fade with distance. */}
        <radialGradient id="hero-a-fade" gradientUnits="userSpaceOnUse" cx={O.x} cy={O.y} r="1400">
          <stop offset="0" stopColor="#FCCC01" stopOpacity="0.30" />
          <stop offset="0.45" stopColor="#FCCC01" stopOpacity="0.11" />
          <stop offset="1" stopColor="#FCCC01" stopOpacity="0.03" />
        </radialGradient>
      </defs>
      <g className="hero-fade" stroke="url(#hero-a-fade)" strokeWidth="1" fill="none">
        {RAYS.map((deg) => {
          const r = (deg * Math.PI) / 180
          return (
            <line
              key={deg}
              x1={O.x}
              y1={O.y}
              x2={(O.x - LEN * Math.cos(r)).toFixed(1)}
              y2={(O.y + LEN * Math.sin(r)).toFixed(1)}
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </g>
      <g className="hero-glide">
        <g className="md:hidden">
          <PlaneGlyph {...PLANE_PHONE} />
        </g>
        <g className="hidden md:inline">
          <PlaneGlyph {...PLANE_DESK} />
        </g>
      </g>
    </svg>
  )
}
